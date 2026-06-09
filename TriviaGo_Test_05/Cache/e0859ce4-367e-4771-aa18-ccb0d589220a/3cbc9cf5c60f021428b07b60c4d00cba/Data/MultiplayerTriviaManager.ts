/**
 * MultiplayerTriviaManager.ts — v2
 *
 * Changes from v1:
 *   - Removed manual "next question" button entirely
 *   - Host auto-queues next round after a configurable delay (default 5s)
 *     when roundState becomes REVEAL_CORRECT or REVEAL_INCORRECT
 *   - Both devices show a "Next question in Xs..." countdown during that window
 *   - Removed: processButton, hostReadyProp, guestReadyReceived, MSG_GUEST_READY,
 *     setupProcessButton(), evaluateHostQuestionFetch()
 */

import { SessionController }  from 'SpectaclesSyncKit.lspkg/Core/SessionController'
import { SyncEntity }         from 'SpectaclesSyncKit.lspkg/Core/SyncEntity'
import { StorageProperty }    from 'SpectaclesSyncKit.lspkg/Core/StorageProperty'
import { StoragePropertySet } from 'SpectaclesSyncKit.lspkg/Core/StoragePropertySet'
import { RectangleButton }    from 'SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton'

interface ISnapCloudRequirements {
  isConfigured(): boolean
  getFunctionsApiUrl(): string
  getSupabaseHeaders(): { [key: string]: string }
}

interface TriviaRecord {
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  optionCount: number
  answer: number
}

const MSG_GUEST_BUZZ = 'GUEST_BUZZ'

@component
export class MultiplayerTriviaManager extends BaseScriptComponent {

  private internetModule: InternetModule = require('LensStudio:InternetModule')

  @input('Component.ScriptComponent') public snapCloudRequirements: ScriptComponent
  @input public functionName: string = ''
  @input public object:  string = ''
  @input public topic:   string = ''

  @input public questionText: Text
  @input public optionButton1: RectangleButton
  @input public optionButton2: RectangleButton
  @input public optionButton3: RectangleButton
  @input public optionButton4: RectangleButton
  @input public optionButtonChildTextName: string = ''

  @input public correctText:   Text
  @input public incorrectText: Text
  @input public myScoreValueText: Text
  @input public statusText: Text | null = null

  @input public opponentScoreValueText: Text
  @input public timerText: Text
  @input public roundDurationSeconds: number = 15

  // How long to show the result before auto-advancing (shown to both players)
  @input public nextRoundDelaySeconds: number = 5

  @input public enableDebugLogs: boolean = true

  // ── SyncEntity ────────────────────────────────────────────────────────────
  private gameSyncEntity: SyncEntity | null = null

  private jsonQuestionProp        = StorageProperty.manualString('jsonQuestion', '')
  private timerStartTokenProp     = StorageProperty.manualString('timerStartToken', '')
  private roundStateProp          = StorageProperty.manualString('roundState', 'PLAYING')
  private currentActiveBuzzerProp = StorageProperty.manualString('currentActiveBuzzer', 'NONE')
  private hostScoreProp           = StorageProperty.manualInt('hostScore', 0)
  private guestScoreProp          = StorageProperty.manualInt('guestScore', 0)
  private hostBuzzedTimeProp      = StorageProperty.manualString('hostBuzzedTime', '')
  private guestBuzzedTimeProp     = StorageProperty.manualString('guestBuzzedTime', '')

  // ── Local state ───────────────────────────────────────────────────────────
  private correctAnswer: number          = 0
  private localScore: number             = 0
  private localHasAnsweredPhase: boolean = false
  private turnProcessed: boolean         = false

  // Countdown displayed to both players between rounds
  private nextRoundCountdown: number     = 0
  private nextRoundCountdownActive: boolean = false

  private readonly REWARD_POINTS  = 10
  private readonly PENALTY_POINTS = 5

  private optionTexts: (Text | null)[] = [null, null, null, null]
  private isHost: boolean              = false
  private localPlayerId: string        = ''
  private localTimeRemaining: number   = 0
  private timerActive: boolean         = false

  // ───────────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ───────────────────────────────────────────────────────────────────────────

  onAwake() {
    this.cacheOptionChildTextNodes()
    this.setupAnswerButtons()
    this.hideAnswerFeedback()
    this.setStatusText('Connecting…')

    if (this.timerText) this.timerText.text = ''
    if (this.opponentScoreValueText) this.opponentScoreValueText.text = '0'
    if (this.myScoreValueText) this.myScoreValueText.text = '0'

    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
    SessionController.getInstance().notifyOnReady(() => this.onSessionReady())
  }

  private onSessionReady() {
    const sc = SessionController.getInstance()
    this.localPlayerId = sc.getLocalUserId() ?? 'localPlayer'
    this.isHost = sc.isHost() === true

    this.log(`Session ready — isHost:${this.isHost} localId:${this.localPlayerId}`)
    this.setStatusText(this.isHost ? 'Host — waiting to start' : 'Guest — waiting for host')

    const gameNetworkId = { customNetworkId: 'triviaGameState', networkIdType: 'Custom' } as any
    this.gameSyncEntity = new SyncEntity(
      this,
      new StoragePropertySet([
        this.jsonQuestionProp,
        this.timerStartTokenProp,
        this.roundStateProp,
        this.currentActiveBuzzerProp,
        this.hostScoreProp,
        this.guestScoreProp,
        this.hostBuzzedTimeProp,
        this.guestBuzzedTimeProp,
      ]),
      true, 'Session', gameNetworkId
    )

    // All listeners registered after entity is built
    this.setupScoreboardCrossTalk()

    this.jsonQuestionProp.onAnyChange.add(() => {
      const raw = this.jsonQuestionProp.currentValue
      if (raw) this.parseAndApplyJson(raw)
    })

    this.timerStartTokenProp.onAnyChange.add(() => {
      const token = this.timerStartTokenProp.currentValue ?? ''
      if (!token) return
      const duration = parseFloat(token.split(':')[0])
      if (duration > 0) {
        this.localTimeRemaining = duration
        this.timerActive = true
        this.turnProcessed = false
        this.nextRoundCountdownActive = false
        this.log(`Timer started: ${duration}s`)
      }
    })

    this.hostBuzzedTimeProp.onAnyChange.add(() => {
      if (this.hostBuzzedTimeProp.currentValue) {
        this.timerActive = false
        this.log('Timer frozen: hostBuzzedTime')
      }
    })
    this.guestBuzzedTimeProp.onAnyChange.add(() => {
      if (this.guestBuzzedTimeProp.currentValue) {
        this.timerActive = false
        this.log('Timer frozen: guestBuzzedTime')
      }
    })

    this.roundStateProp.onAnyChange.add(() => this.handleRoundStateChange())
    this.currentActiveBuzzerProp.onAnyChange.add(() => this.handleBuzzerStateChange())

    // Host subscribes to guest messages
    if (this.isHost) {
      sc.onMessageReceived.add(
        (_session, _userId, message, _senderInfo) => this.onHostReceivedMessage(message)
      )
      // Host kicks off the first question automatically
      this.scheduleNextRound(2)
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Auto-advance: host schedules next round after a delay
  // ───────────────────────────────────────────────────────────────────────────

  private scheduleNextRound(delaySecs: number) {
    if (!this.isHost) return

    this.log(`Next round in ${delaySecs}s`)

    // Broadcast the countdown duration into roundState so both devices
    // can display it. We reuse timerText for the countdown.
    this.nextRoundCountdownActive = false // host will use its own DelayedCallbackEvent

    const delayEvent = this.createEvent('DelayedCallbackEvent') as DelayedCallbackEvent
    delayEvent.bind(() => {
      this.startNextRound()
    })
    delayEvent.reset(delaySecs)
  }

  private startNextRound() {
    if (!this.isHost) return
    this.hostBuzzedTimeProp.setPendingValue('')
    this.guestBuzzedTimeProp.setPendingValue('')
    this.currentActiveBuzzerProp.setPendingValue('NONE')
    this.roundStateProp.setPendingValue('PLAYING')
    this.fetchAndSync()
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Guest → Host messaging
  // ───────────────────────────────────────────────────────────────────────────

  private onHostReceivedMessage(message: string) {
    this.log(`Host received: ${message}`)
    if (message.startsWith(MSG_GUEST_BUZZ + ':')) {
      const parts = message.split(':')
      if (parts.length >= 3) {
        this.guestBuzzedTimeProp.setPendingValue(`${parts[1]}:${parts[2]}`)
      }
    }
  }

  private guestSendMessage(message: string) {
    const session = SessionController.getInstance().getSession()
    if (!session) { this.log('ERROR: session null'); return }
    session.sendMessage(message)
    this.log(`Guest sent: ${message}`)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Round state handlers
  // ───────────────────────────────────────────────────────────────────────────

  private handleRoundStateChange() {
    const state = this.roundStateProp.currentValue

    if (state === 'REVEAL_CORRECT') {
      this.timerActive = false
      this.hideAnswerFeedback()
      if (this.correctText) this.correctText.enabled = true

      // Start the visible countdown on both devices
      this.nextRoundCountdown = this.nextRoundDelaySeconds
      this.nextRoundCountdownActive = true

      // Host schedules the actual next round
      if (this.isHost) this.scheduleNextRound(this.nextRoundDelaySeconds)

    } else if (state === 'REVEAL_INCORRECT') {
      this.timerActive = false
      this.hideAnswerFeedback()
      if (this.incorrectText) this.incorrectText.enabled = true

      this.nextRoundCountdown = this.nextRoundDelaySeconds
      this.nextRoundCountdownActive = true

      if (this.isHost) this.scheduleNextRound(this.nextRoundDelaySeconds)
    }
  }

  private handleBuzzerStateChange() {
    const activeBuzzer = this.currentActiveBuzzerProp.currentValue
    this.localHasAnsweredPhase = false

    const myStealTurn = (activeBuzzer === 'HOST_ONLY' && this.isHost)
                     || (activeBuzzer === 'GUEST_ONLY' && !this.isHost)

    if (activeBuzzer === 'NONE') {
      this.setStatusText('RACE! Buzz in first!')
    } else if (myStealTurn) {
      this.timerActive = true
      this.setStatusText('Opponent missed! YOUR TURN to steal!')
    } else {
      this.timerActive = false
      this.setStatusText('Opponent is answering…')
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Host-authoritative buzzer evaluation
  // ───────────────────────────────────────────────────────────────────────────

  private evaluateBuzzerRaceAuthoritative() {
    if (!this.isHost) return
    if (this.roundStateProp.currentValue !== 'PLAYING') return
    if (this.turnProcessed) return

    const hostToken    = this.hostBuzzedTimeProp.currentValue  || ''
    const guestToken   = this.guestBuzzedTimeProp.currentValue || ''
    const activeBuzzer = this.currentActiveBuzzerProp.currentValue

    if (activeBuzzer === 'NONE') {
      if (!hostToken && !guestToken) return

      const hostTime  = hostToken  ? parseInt(hostToken.split(':')[0])  : Infinity
      const guestTime = guestToken ? parseInt(guestToken.split(':')[0]) : Infinity
      const hostOpt   = hostToken  ? parseInt(hostToken.split(':')[1])  : -1
      const guestOpt  = guestToken ? parseInt(guestToken.split(':')[1]) : -1

      this.turnProcessed = true
      if (hostTime <= guestTime) {
        this.processTurnAuthoritative('HOST', hostOpt)
      } else {
        this.processTurnAuthoritative('GUEST', guestOpt)
      }

    } else if (activeBuzzer === 'HOST_ONLY' && hostToken) {
      this.turnProcessed = true
      this.processTurnAuthoritative('HOST', parseInt(hostToken.split(':')[1]))

    } else if (activeBuzzer === 'GUEST_ONLY' && guestToken) {
      this.turnProcessed = true
      this.processTurnAuthoritative('GUEST', parseInt(guestToken.split(':')[1]))
    }
  }

  private processTurnAuthoritative(player: 'HOST' | 'GUEST', chosenOption: number) {
    this.timerActive = false

    const isCorrect         = chosenOption === this.correctAnswer
    const currentHostScore  = this.hostScoreProp.currentValue  ?? 0
    const currentGuestScore = this.guestScoreProp.currentValue ?? 0
    const activeBuzzer      = this.currentActiveBuzzerProp.currentValue

    this.log(`Turn: player=${player} option=${chosenOption} correct=${isCorrect}`)

    if (isCorrect) {
      if (player === 'HOST') {
        this.hostScoreProp.setPendingValue(currentHostScore + this.REWARD_POINTS)
      } else {
        this.guestScoreProp.setPendingValue(currentGuestScore + this.REWARD_POINTS)
      }
      this.roundStateProp.setPendingValue('REVEAL_CORRECT')
    } else {
      if (player === 'HOST') {
        this.hostScoreProp.setPendingValue(Math.max(0, currentHostScore - this.PENALTY_POINTS))
      } else {
        this.guestScoreProp.setPendingValue(Math.max(0, currentGuestScore - this.PENALTY_POINTS))
      }

      if (activeBuzzer === 'NONE') {
        this.hostBuzzedTimeProp.setPendingValue('')
        this.guestBuzzedTimeProp.setPendingValue('')
        this.turnProcessed = false
        const nextTarget = (player === 'HOST') ? 'GUEST_ONLY' : 'HOST_ONLY'
        this.currentActiveBuzzerProp.setPendingValue(nextTarget)
      } else {
        this.roundStateProp.setPendingValue('REVEAL_INCORRECT')
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Scoreboard
  // ───────────────────────────────────────────────────────────────────────────

  private setupScoreboardCrossTalk() {
    this.hostScoreProp.onAnyChange.add(() => {
      const score = this.hostScoreProp.currentValue ?? 0
      this.log(`hostScore → ${score}`)
      if (this.isHost) {
        this.localScore = score
        if (this.myScoreValueText) this.myScoreValueText.text = String(score)
      } else {
        if (this.opponentScoreValueText) this.opponentScoreValueText.text = String(score)
      }
    })

    this.guestScoreProp.onAnyChange.add(() => {
      const score = this.guestScoreProp.currentValue ?? 0
      this.log(`guestScore → ${score}`)
      if (!this.isHost) {
        this.localScore = score
        if (this.myScoreValueText) this.myScoreValueText.text = String(score)
      } else {
        if (this.opponentScoreValueText) this.opponentScoreValueText.text = String(score)
      }
    })
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Frame update
  // ───────────────────────────────────────────────────────────────────────────

  private onUpdate() {
    if (this.isHost) {
      this.evaluateBuzzerRaceAuthoritative()
    }

    // Question timer
    if (this.timerActive) {
      this.localTimeRemaining -= getDeltaTime()
      if (this.localTimeRemaining <= 0) {
        this.localTimeRemaining = 0
        this.timerActive = false
        if (this.timerText) this.timerText.text = '0.0s'
        if (this.isHost) {
          this.turnProcessed = true
          this.roundStateProp.setPendingValue('REVEAL_INCORRECT')
        }
      } else {
        if (this.timerText) this.timerText.text = this.localTimeRemaining.toFixed(1) + 's'
      }
    }

    // Next-round countdown display (both devices)
    if (this.nextRoundCountdownActive) {
      this.nextRoundCountdown -= getDeltaTime()
      if (this.nextRoundCountdown <= 0) {
        this.nextRoundCountdownActive = false
        if (this.timerText) this.timerText.text = ''
        this.setStatusText('Loading…')
      } else {
        if (this.timerText) {
          this.timerText.text = `Next in ${this.nextRoundCountdown.toFixed(1)}s`
        }
        // Status text shows correct/incorrect during countdown — don't overwrite it here
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Input — answer buttons
  // ───────────────────────────────────────────────────────────────────────────

  private setupAnswerButtons() {
    this.optionButton1?.onTriggerUp.add(() => this.checkUserAnswer(1))
    this.optionButton2?.onTriggerUp.add(() => this.checkUserAnswer(2))
    this.optionButton3?.onTriggerUp.add(() => this.checkUserAnswer(3))
    this.optionButton4?.onTriggerUp.add(() => this.checkUserAnswer(4))
  }

  private checkUserAnswer(index: number) {
    if (this.localHasAnsweredPhase) return
    if (this.roundStateProp.currentValue !== 'PLAYING') return

    const currentBuzzerState = this.currentActiveBuzzerProp.currentValue
    if (currentBuzzerState === 'GUEST_ONLY' && this.isHost)  return
    if (currentBuzzerState === 'HOST_ONLY'  && !this.isHost) return

    this.localHasAnsweredPhase = true
    this.timerActive = false
    this.hideAnswerFeedback()

    const isCorrect = index === this.correctAnswer
    if (isCorrect) {
      if (this.correctText) this.correctText.enabled = true
      this.setStatusText('Correct! Syncing…')
    } else {
      if (this.incorrectText) this.incorrectText.enabled = true
      this.setStatusText(currentBuzzerState === 'NONE'
        ? 'Incorrect! Passing turn…'
        : 'Incorrect! Round over.')
    }

    if (this.isHost) {
      this.hostBuzzedTimeProp.setPendingValue(`${Date.now()}:${index}`)
    } else {
      this.guestSendMessage(`${MSG_GUEST_BUZZ}:${Date.now()}:${index}`)
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Supabase fetch
  // ───────────────────────────────────────────────────────────────────────────

  private fetchAndSync() {
    const cloud = this.snapCloudRequirements as unknown as ISnapCloudRequirements
    if (!cloud?.isConfigured()) return

    const endpointUrl = `${cloud.getFunctionsApiUrl()}${this.functionName}`
    const payload: Record<string, string> = {}
    const obj   = this.object?.trim()
    const topic = this.topic?.trim()
    if (obj)   payload['object'] = obj
    if (topic) payload['topic']  = topic

    const request = RemoteServiceHttpRequest.create()
    request.url     = endpointUrl
    request.headers = cloud.getSupabaseHeaders()
    request.method  = RemoteServiceHttpRequest.HttpRequestMethod.Post
    request.body    = JSON.stringify(payload)

    this.setStatusText('Loading question…')

    this.internetModule.performHttpRequest(request, (response) => {
      if (response.statusCode !== 200) {
        this.setStatusText('Error loading question')
        return
      }
      try {
        const result = JSON.parse(response.body)
        if (result.ok === true && result.record) {
          this.jsonQuestionProp.setPendingValue(JSON.stringify(result.record))
          this.timerStartTokenProp.setPendingValue(`${this.roundDurationSeconds}:${Date.now()}`)
        }
      } catch (e) {
        this.log(`Parse fault: ${e}`)
      }
    })
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UI helpers
  // ───────────────────────────────────────────────────────────────────────────

  private parseAndApplyJson(jsonStr: string) {
    try {
      const record = JSON.parse(jsonStr) as TriviaRecord
      this.correctAnswer = Number(record.answer ?? 0)
      if (this.questionText) this.questionText.text = String(record.question ?? '')
      this.setOptionText(0, String(record.option1 ?? ''))
      this.setOptionText(1, String(record.option2 ?? ''))
      this.setOptionText(2, String(record.option3 ?? ''))
      this.setOptionText(3, String(record.option4 ?? ''))
      this.localHasAnsweredPhase = false
      this.hideAnswerFeedback()
    } catch (e) {
      this.log(`UI render fault: ${e}`)
    }
  }

  private hideAnswerFeedback() {
    if (this.correctText)   this.correctText.enabled   = false
    if (this.incorrectText) this.incorrectText.enabled = false
  }

  private setStatusText(msg: string) {
    if (this.statusText) this.statusText.text = msg
    this.log(msg)
  }

  private cacheOptionChildTextNodes() {
    this.optionTexts[0] = this.findButtonChildText(this.optionButton1)
    this.optionTexts[1] = this.findButtonChildText(this.optionButton2)
    this.optionTexts[2] = this.findButtonChildText(this.optionButton3)
    this.optionTexts[3] = this.findButtonChildText(this.optionButton4)
  }

  private findButtonChildText(btn: RectangleButton): Text | null {
    if (!btn) return null
    const root = btn.getSceneObject()
    if (!root) return null
    if (this.optionButtonChildTextName?.length > 0) {
      const named = this.findChildByNameRecursive(root, this.optionButtonChildTextName)
      if (named) {
        const t = named.getComponent('Text') as Text
        if (t) return t
      }
    }
    return this.findFirstTextInDescendants(root)
  }

  private findChildByNameRecursive(root: SceneObject, name: string): SceneObject | null {
    if (root.name === name) return root
    const count = root.getChildrenCount()
    for (let i = 0; i < count; i++) {
      const child = root.getChild(i)
      if (!child) continue
      if (child.name === name) return child
      const deeper = this.findChildByNameRecursive(child, name)
      if (deeper) return deeper
    }
    return null
  }

  private findFirstTextInDescendants(root: SceneObject): Text | null {
    const rootText = root.getComponent('Text') as Text
    if (rootText) return rootText
    const count = root.getChildrenCount()
    for (let i = 0; i < count; i++) {
      const child = root.getChild(i)
      if (!child) continue
      const t = child.getComponent('Text') as Text
      if (t) return t
      const deeper = this.findFirstTextInDescendants(child)
      if (deeper) return deeper
    }
    return null
  }

  private setOptionText(index: number, value: string) {
    const t = this.optionTexts[index]
    if (t) t.text = value
  }

  private log(msg: string) {
    if (this.enableDebugLogs) print(`[MultiplayerTriviaManager] ${msg}`)
  }
}