/**
 * MultiplayerTriviaManager.ts
 *
 * FIXED: Proper SyncEntity ownership and property syncing
 * Reference: https://developers.snap.com/spectacles/spectacles-frameworks/spectacles-sync-kit/features/sync-entity
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

enum RoundPhase {
  PLAYING = 'PLAYING',
  EVALUATED = 'EVALUATED',
  REVEAL_CORRECT = 'REVEAL_CORRECT',
  REVEAL_INCORRECT = 'REVEAL_INCORRECT'
}

@component
export class MultiplayerTriviaManager extends BaseScriptComponent {

  private internetModule: InternetModule = require('LensStudio:InternetModule')

  @input('Component.ScriptComponent') public snapCloudRequirements: ScriptComponent
  @input public functionName: string = ''
  @input public object:  string = ''
  @input public topic:   string = ''

  @input public processButton: RectangleButton
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
  @input public enableDebugLogs: boolean = true

  // ── SyncEntities ────────────────────────────────────────────────────────────
  // Game state: owned by HOST only
  private gameSyncEntity: SyncEntity | null = null
  
  // Host player: owned by HOST only
  private hostPlayerEntity: SyncEntity | null = null
  
  // Guest player: owned by GUEST only
  private guestPlayerEntity: SyncEntity | null = null

  // ── Game State Properties (host-owned) ────────────────────────────────────
  private jsonQuestionProp        = StorageProperty.manualString('jsonQuestion', '')
  private timerStartTokenProp     = StorageProperty.manualString('timerStartToken', '')
  private roundStateProp          = StorageProperty.manualString('roundState', RoundPhase.PLAYING)
  private currentActiveBuzzerProp = StorageProperty.manualString('currentActiveBuzzer', 'NONE')
  private hostScoreProp           = StorageProperty.manualInt('hostScore', 0)
  private guestScoreProp          = StorageProperty.manualInt('guestScore', 0)

  // ── Host Player Properties (host-owned) ────────────────────────────────────
  private hostReadyProp      = StorageProperty.manualBool('hostReady', false)
  private hostBuzzedTimeProp = StorageProperty.manualString('hostBuzzedTime', '')

  // ── Guest Player Properties (guest-owned) ────────────────────────────────────
  private guestReadyProp      = StorageProperty.manualBool('guestReady', false)
  private guestBuzzedTimeProp = StorageProperty.manualString('guestBuzzedTime', '')

  private correctAnswer: number          = 0
  private localScore: number             = 0
  private localHasAnsweredPhase: boolean = false

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
    this.log('Session ready')
    const session = SessionController.getInstance() as any

    const localUser = session.getLocalUserInfo()
    this.localPlayerId = localUser
      ? (localUser.userId || localUser.getUserId?.())
      : 'localPlayer'

    this.isHost = session.isHost?.() || false
    if (!this.isHost && session.getCreatorId) {
      this.isHost = (session.getCreatorId() === this.localPlayerId)
    }

    this.log(`Session ready. isHost=${this.isHost}, localPlayerId=${this.localPlayerId}`)
    this.setStatusText(this.isHost ? 'Host' : 'Guest')

    // ── CREATE SYNC ENTITIES ────────────────────────────────────────────────
    // The third parameter to SyncEntity constructor determines OWNERSHIP
    // true = this device owns the entity and can write to it
    // false = this device receives updates but cannot write to it

    // 1. Game State Entity (HOST ONLY owns this)
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
      ]),
      true, // ALWAYS owned by host (persistent across sessions)
      'Session',
      gameNetworkId
    )

    // 2. Host Player Entity (OWNED ONLY BY HOST)
    const hostNetworkId = { customNetworkId: 'triviaHostPlayer', networkIdType: 'Custom' } as any
    this.hostPlayerEntity = new SyncEntity(
      this,
      new StoragePropertySet([
        this.hostReadyProp,
        this.hostBuzzedTimeProp,
      ]),
      this.isHost, // TRUE if this device is the host, FALSE otherwise
      'Session',
      hostNetworkId
    )

    // 3. Guest Player Entity (OWNED ONLY BY GUEST)
    const guestNetworkId = { customNetworkId: 'triviaGuestPlayer', networkIdType: 'Custom' } as any
    this.guestPlayerEntity = new SyncEntity(
      this,
      new StoragePropertySet([
        this.guestReadyProp,
        this.guestBuzzedTimeProp,
      ]),
      !this.isHost, // TRUE if this device is the guest, FALSE otherwise
      'Session',
      guestNetworkId
    )

    this.log(`Created SyncEntities:`)
    this.log(`  - gameSyncEntity: owned by all (host)`)
    this.log(`  - hostPlayerEntity: owned by ${this.isHost ? 'THIS DEVICE' : 'REMOTE'}`)
    this.log(`  - guestPlayerEntity: owned by ${!this.isHost ? 'THIS DEVICE' : 'REMOTE'}`)

    // Wire up all listeners
    this.setupPropertyListeners()
    this.setupProcessButton()
  }

  private setupPropertyListeners() {
    this.jsonQuestionProp.onAnyChange.add(() => {
      const rawJson = this.jsonQuestionProp.currentValue
      if (rawJson) this.parseAndApplyJson(rawJson)
    })

    this.timerStartTokenProp.onAnyChange.add(() => {
      const token = this.timerStartTokenProp.currentValue ?? ''
      if (!token) return
      const duration = parseFloat(token.split(':')[0])
      if (duration > 0) {
        this.localTimeRemaining = duration
        this.timerActive = true
        this.log(`Timer started: ${duration}s`)
      }
    })

    // Timer stops when ANY player buzzes
    this.hostBuzzedTimeProp.onAnyChange.add(() => {
      const token = this.hostBuzzedTimeProp.currentValue
      if (token) {
        this.timerActive = false
        this.log('Timer frozen: host buzzed')
      }
    })

    this.guestBuzzedTimeProp.onAnyChange.add(() => {
      const token = this.guestBuzzedTimeProp.currentValue
      if (token) {
        this.timerActive = false
        this.log('Timer frozen: guest buzzed')
      }
    })

    this.roundStateProp.onAnyChange.add(() => this.handleRoundStateChange())
    this.currentActiveBuzzerProp.onAnyChange.add(() => this.handleBuzzerStateChange())

    // Only host listens to ready changes
    this.hostReadyProp.onAnyChange.add(() => {
      if (this.isHost) {
        this.log(`hostReadyProp changed to ${this.hostReadyProp.currentValue}`)
        this.evaluateHostQuestionFetch()
      }
    })

    this.guestReadyProp.onAnyChange.add(() => {
      if (this.isHost) {
        this.log(`guestReadyProp changed to ${this.guestReadyProp.currentValue}`)
        this.evaluateHostQuestionFetch()
      }
    })

    // Score updates
    this.hostScoreProp.onAnyChange.add(() => {
      const score = this.hostScoreProp.currentValue ?? 0
      this.log(`hostScore updated to ${score}`)
      if (this.isHost) {
        this.localScore = score
        if (this.myScoreValueText) this.myScoreValueText.text = String(score)
      } else {
        if (this.opponentScoreValueText) this.opponentScoreValueText.text = String(score)
      }
    })

    this.guestScoreProp.onAnyChange.add(() => {
      const score = this.guestScoreProp.currentValue ?? 0
      this.log(`guestScore updated to ${score}`)
      if (!this.isHost) {
        this.localScore = score
        if (this.myScoreValueText) this.myScoreValueText.text = String(score)
      } else {
        if (this.opponentScoreValueText) this.opponentScoreValueText.text = String(score)
      }
    })
  }

  private handleRoundStateChange() {
    const state = this.roundStateProp.currentValue
    this.log(`Round state changed to: ${state}`)
    
    if (state === RoundPhase.PLAYING) {
      this.log('New round starting')
    } else if (state === RoundPhase.EVALUATED) {
      this.log('Turn evaluated, waiting for reveal')
    } else if (state === RoundPhase.REVEAL_CORRECT) {
      this.timerActive = false
      this.hideAnswerFeedback()
      if (this.correctText) this.correctText.enabled = true
      this.setStatusText('Correct! Round over.')
    } else if (state === RoundPhase.REVEAL_INCORRECT) {
      this.timerActive = false
      this.hideAnswerFeedback()
      if (this.incorrectText) this.incorrectText.enabled = true
      this.setStatusText(`Round over. Answer was option ${this.correctAnswer}`)
    }
  }

  private handleBuzzerStateChange() {
    const activeBuzzer = this.currentActiveBuzzerProp.currentValue
    this.log(`Buzzer state changed to: ${activeBuzzer}`)
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

  private evaluateBuzzerRaceAuthoritative() {
    if (!this.isHost) return
    if (this.roundStateProp.currentValue !== RoundPhase.PLAYING) return

    const hostToken    = this.hostBuzzedTimeProp.currentValue  || ''
    const guestToken   = this.guestBuzzedTimeProp.currentValue || ''
    const activeBuzzer = this.currentActiveBuzzerProp.currentValue

    if (activeBuzzer === 'NONE') {
      if (!hostToken && !guestToken) return

      const hostTime  = hostToken  ? parseInt(hostToken.split(':')[0])  : Infinity
      const guestTime = guestToken ? parseInt(guestToken.split(':')[0]) : Infinity
      const hostOpt   = hostToken  ? parseInt(hostToken.split(':')[1])  : -1
      const guestOpt  = guestToken ? parseInt(guestToken.split(':')[1]) : -1

      this.log(`Race: host=${hostTime}, guest=${guestTime}`)

      this.roundStateProp.setPendingValue(RoundPhase.EVALUATED)

      if (hostTime <= guestTime) {
        this.processTurnAuthoritative('HOST', hostOpt)
      } else {
        this.processTurnAuthoritative('GUEST', guestOpt)
      }

    } else if (activeBuzzer === 'HOST_ONLY' && hostToken) {
      this.roundStateProp.setPendingValue(RoundPhase.EVALUATED)
      this.processTurnAuthoritative('HOST', parseInt(hostToken.split(':')[1]))

    } else if (activeBuzzer === 'GUEST_ONLY' && guestToken) {
      this.roundStateProp.setPendingValue(RoundPhase.EVALUATED)
      this.processTurnAuthoritative('GUEST', parseInt(guestToken.split(':')[1]))
    }
  }

  private processTurnAuthoritative(player: 'HOST' | 'GUEST', chosenOption: number) {
    this.timerActive = false

    const isCorrect         = chosenOption === this.correctAnswer
    const currentHostScore  = this.hostScoreProp.currentValue  ?? 0
    const currentGuestScore = this.guestScoreProp.currentValue ?? 0
    const activeBuzzer      = this.currentActiveBuzzerProp.currentValue

    this.log(`Turn resolved: ${player} chose option ${chosenOption}, correct=${isCorrect}`)

    if (isCorrect) {
      if (player === 'HOST') {
        this.hostScoreProp.setPendingValue(currentHostScore + this.REWARD_POINTS)
      } else {
        this.guestScoreProp.setPendingValue(currentGuestScore + this.REWARD_POINTS)
      }
      this.roundStateProp.setPendingValue(RoundPhase.REVEAL_CORRECT)

    } else {
      if (player === 'HOST') {
        this.hostScoreProp.setPendingValue(Math.max(0, currentHostScore - this.PENALTY_POINTS))
      } else {
        this.guestScoreProp.setPendingValue(Math.max(0, currentGuestScore - this.PENALTY_POINTS))
      }

      if (activeBuzzer === 'NONE') {
        this.hostBuzzedTimeProp.setPendingValue('')
        const nextTarget = (player === 'HOST') ? 'GUEST_ONLY' : 'HOST_ONLY'
        this.currentActiveBuzzerProp.setPendingValue(nextTarget)
      } else {
        this.roundStateProp.setPendingValue(RoundPhase.REVEAL_INCORRECT)
      }
    }
  }

  private onUpdate() {
    if (this.isHost) {
      this.evaluateBuzzerRaceAuthoritative()
    }

    if (!this.timerActive) return

    this.localTimeRemaining -= getDeltaTime()

    if (this.localTimeRemaining <= 0) {
      this.localTimeRemaining = 0
      this.timerActive = false
      if (this.timerText) this.timerText.text = '0.0s'
      if (this.isHost) {
        this.roundStateProp.setPendingValue(RoundPhase.REVEAL_INCORRECT)
      }
    } else {
      if (this.timerText) this.timerText.text = this.localTimeRemaining.toFixed(1) + 's'
    }
  }

  private setupAnswerButtons() {
    this.optionButton1?.onTriggerUp.add(() => this.checkUserAnswer(1))
    this.optionButton2?.onTriggerUp.add(() => this.checkUserAnswer(2))
    this.optionButton3?.onTriggerUp.add(() => this.checkUserAnswer(3))
    this.optionButton4?.onTriggerUp.add(() => this.checkUserAnswer(4))
  }

  private checkUserAnswer(index: number) {
    if (this.localHasAnsweredPhase) return
    if (this.roundStateProp.currentValue !== RoundPhase.PLAYING) return

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

    // CRITICAL: Write to the property based on ownership
    const timestampStr = `${Date.now()}:${index}`
    if (this.isHost) {
      this.log(`Host writing to hostBuzzedTime: ${timestampStr}`)
      this.hostBuzzedTimeProp.setPendingValue(timestampStr)
    } else {
      this.log(`Guest writing to guestBuzzedTime: ${timestampStr}`)
      this.guestBuzzedTimeProp.setPendingValue(timestampStr)
    }
  }

  private setupProcessButton() {
    if (!this.processButton) return

    this.processButton.onTriggerUp.add(() => {
      this.log(`${this.isHost ? 'HOST' : 'GUEST'} pressed process button`)
      this.hideAnswerFeedback()
      this.localHasAnsweredPhase = false
      this.timerActive           = false
      this.localTimeRemaining    = 0
      if (this.timerText) this.timerText.text = 'Waiting…'

      // CRITICAL: Only write to properties you own
      if (this.isHost) {
        this.log('HOST: Clearing hostBuzzedTime and setting hostReady')
        this.hostBuzzedTimeProp.setPendingValue('')
        this.hostReadyProp.setPendingValue(true)
      } else {
        this.log('GUEST: Clearing guestBuzzedTime and setting guestReady')
        this.guestBuzzedTimeProp.setPendingValue('')
        this.guestReadyProp.setPendingValue(true)
      }
      this.setStatusText('Waiting for opponent…')
    })
  }

  private evaluateHostQuestionFetch() {
    if (!this.isHost) return

    const hostReady  = this.hostReadyProp.currentValue  ?? false
    const guestReady = this.guestReadyProp.currentValue ?? false

    this.log(`Evaluating: hostReady=${hostReady}, guestReady=${guestReady}`)

    const session = SessionController.getInstance() as any
    const currentUsers = session.getUsers?.() || session.getConnectedUsers?.() || []

    let hasRemoteOpponent = false
    for (let i = 0; i < currentUsers.length; i++) {
      const u = currentUsers[i]
      if (u && (u.userId || u.getUserId?.()) !== this.localPlayerId) {
        hasRemoteOpponent = true
        break
      }
    }

    const roomIsReady = hasRemoteOpponent ? (hostReady && guestReady) : hostReady

    if (roomIsReady) {
      this.log('Room ready! Fetching new question...')
      
      this.hostReadyProp.setPendingValue(false)
      this.guestReadyProp.setPendingValue(false)
      this.hostBuzzedTimeProp.setPendingValue('')
      this.currentActiveBuzzerProp.setPendingValue('NONE')
      this.roundStateProp.setPendingValue(RoundPhase.PLAYING)
      this.fetchAndSync()
    }
  }

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
        this.log('Error: ' + response.statusCode)
        return
      }
      try {
        const result = JSON.parse(response.body)
        if (result.ok === true && result.record) {
          this.jsonQuestionProp.setPendingValue(JSON.stringify(result.record))
          this.timerStartTokenProp.setPendingValue(`${this.roundDurationSeconds}:${Date.now()}`)
        }
      } catch (e) {
        this.log(`Parse error: ${e}`)
      }
    })
  }

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
      this.log(`Parse fault: ${e}`)
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