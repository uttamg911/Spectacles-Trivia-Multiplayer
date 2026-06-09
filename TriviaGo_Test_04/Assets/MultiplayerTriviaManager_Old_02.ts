/**
 * MultiplayerTriviaManager.ts
 *
 * DEFINITIVE ARCHITECTURE:
 *
 * Root cause of all previous failures:
 *   SyncEntity ownership is decided at CREATION TIME by whichever device
 *   constructs the store first — not by the isHost flag passed to the
 *   constructor. This is a race condition. If the host device constructs
 *   guestPlayerEntity before the guest does, the host becomes its owner
 *   and the guest's setPendingValue calls are silently dropped forever.
 *
 * Final fix:
 *   - ONE SyncEntity, owned by the host, holds ALL synced state.
 *   - Guest communicates buzz + ready signals via session.sendMessage().
 *   - sendMessage() is the SyncKit-guaranteed channel for non-owners to
 *     reach the host. onMessageReceived fires reliably with no ownership.
 *   - Host parses the message, sets its local variables, then writes the
 *     authoritative result back to the SyncEntity for both devices to see.
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

// Message types sent by guest → host via session.sendMessage()
const MSG_GUEST_READY  = 'GUEST_READY'
const MSG_GUEST_BUZZ   = 'GUEST_BUZZ'   // payload: "GUEST_BUZZ:timestamp:optionIndex"

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

  // ── ONE host-owned SyncEntity ─────────────────────────────────────────────
  private gameSyncEntity: SyncEntity | null = null

  // All game state — host is the sole writer
  private jsonQuestionProp        = StorageProperty.manualString('jsonQuestion', '')
  private timerStartTokenProp     = StorageProperty.manualString('timerStartToken', '')
  private roundStateProp          = StorageProperty.manualString('roundState', 'PLAYING')
  private currentActiveBuzzerProp = StorageProperty.manualString('currentActiveBuzzer', 'NONE')
  private hostScoreProp           = StorageProperty.manualInt('hostScore', 0)
  private guestScoreProp          = StorageProperty.manualInt('guestScore', 0)
  // Host signals its own ready/buzz directly into the store (it owns it)
  private hostReadyProp           = StorageProperty.manualBool('hostReady', false)
  private hostBuzzedTimeProp      = StorageProperty.manualString('hostBuzzedTime', '')
  // Host writes guest's buzz token here after receiving the message
  private guestBuzzedTimeProp     = StorageProperty.manualString('guestBuzzedTime', '')

  // ── Local state ───────────────────────────────────────────────────────────
  private correctAnswer: number          = 0
  private localScore: number             = 0
  private localHasAnsweredPhase: boolean = false
  private turnProcessed: boolean         = false
  // Host caches guest-ready flag received via message (can't write guestReady to store
  // from host side without a dedicated prop — we use a local bool instead)
  private guestReadyReceived: boolean    = false

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
    // isHost() is guaranteed non-null inside notifyOnReady (connected=true by then)
    this.isHost = sc.isHost() === true

    this.log(`Session ready — isHost:${this.isHost} localId:${this.localPlayerId}`)
    this.setStatusText(this.isHost ? 'Host' : 'Guest')

    // ── ONE entity, host-owned ────────────────────────────────────────────────
    // persistent=true means the host is the owner. The guest constructs the same
    // entity to subscribe to changes (onAnyChange), but never calls setPendingValue.
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
        this.hostReadyProp,
        this.hostBuzzedTimeProp,
        this.guestBuzzedTimeProp,
      ]),
      true, 'Session', gameNetworkId
    )

    // ── All listeners registered AFTER entity is built ────────────────────────

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
        this.guestReadyReceived = false
        this.log(`Timer started: ${duration}s`)
      }
    })

    // Freeze timer on ALL devices the instant any buzz token is written to the store.
    // For the host's own buzz this fires locally immediately.
    // For the guest's buzz the host writes guestBuzzedTimeProp after receiving the message,
    // and this fires on both the host AND the guest when the store propagates.
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
    this.hostReadyProp.onAnyChange.add(() => this.evaluateHostQuestionFetch())

    // ── Guest → Host messaging ────────────────────────────────────────────────
    // The host subscribes to session messages. The guest sends instead of writing
    // to a SyncEntity prop, completely bypassing ownership issues.
    if (this.isHost) {
      sc.onMessageReceived.add(
        (_session, _userId, message, _senderInfo) => this.onHostReceivedMessage(message)
      )
    }

    this.setupProcessButton()
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Host: receive guest messages
  // ───────────────────────────────────────────────────────────────────────────

  private onHostReceivedMessage(message: string) {
    this.log(`Host received message: ${message}`)

    if (message === MSG_GUEST_READY) {
      this.guestReadyReceived = true
      this.evaluateHostQuestionFetch()
      return
    }

    if (message.startsWith(MSG_GUEST_BUZZ + ':')) {
      // Format: "GUEST_BUZZ:timestamp:optionIndex"
      const parts = message.split(':')
      if (parts.length >= 3) {
        const token = `${parts[1]}:${parts[2]}`
        // Write the guest's buzz into the store — this fires onAnyChange on BOTH
        // devices, which freezes the timer on both sides simultaneously
        this.guestBuzzedTimeProp.setPendingValue(token)
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Guest: send message to host
  // ───────────────────────────────────────────────────────────────────────────

  private guestSendMessage(message: string) {
    const sc = SessionController.getInstance()
    const session = sc.getSession()
    if (!session) {
      this.log('ERROR: session null, cannot send message')
      return
    }
    session.sendMessage(message)
    this.log(`Guest sent message: ${message}`)
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
      this.setStatusText('Correct! Round over.')
    } else if (state === 'REVEAL_INCORRECT') {
      this.timerActive = false
      this.hideAnswerFeedback()
      if (this.incorrectText) this.incorrectText.enabled = true
      this.setStatusText(`Round over. Answer was option ${this.correctAnswer}`)
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
  // Host-authoritative buzzer evaluation (runs every frame on host only)
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
        // Clear buzz tokens and open steal window
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

    if (!this.timerActive) return

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
      // Host writes directly to its own store
      this.hostBuzzedTimeProp.setPendingValue(`${Date.now()}:${index}`)
    } else {
      // Guest sends a message — host receives it, writes guestBuzzedTimeProp,
      // which then propagates back via onAnyChange to freeze guest timer too
      this.guestSendMessage(`${MSG_GUEST_BUZZ}:${Date.now()}:${index}`)
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Process button
  // ───────────────────────────────────────────────────────────────────────────

  private setupProcessButton() {
    if (!this.processButton) return

    this.processButton.onTriggerUp.add(() => {
      this.hideAnswerFeedback()
      this.localHasAnsweredPhase = false
      this.turnProcessed         = false
      this.timerActive           = false
      this.localTimeRemaining    = 0
      if (this.timerText) this.timerText.text = 'Waiting…'

      if (this.isHost) {
        this.hostReadyProp.setPendingValue(true)
        // Re-evaluate immediately in case guest already sent GUEST_READY
        this.evaluateHostQuestionFetch()
      } else {
        this.guestSendMessage(MSG_GUEST_READY)
      }
      this.setStatusText('Waiting for opponent…')
    })
  }

  private evaluateHostQuestionFetch() {
    if (!this.isHost) return

    const hostReady  = this.hostReadyProp.currentValue ?? false
    // Guest ready comes via message, cached in local bool
    const guestReady = this.guestReadyReceived

    const sc = SessionController.getInstance()
    const currentUsers = sc.getUsers()

    let hasRemoteOpponent = false
    for (let i = 0; i < currentUsers.length; i++) {
      if (currentUsers[i].userId !== this.localPlayerId) {
        hasRemoteOpponent = true
        break
      }
    }

    const roomIsReady = hasRemoteOpponent ? (hostReady && guestReady) : hostReady

    this.log(`evaluateHostQuestionFetch — hostReady:${hostReady} guestReady:${guestReady} hasOpponent:${hasRemoteOpponent} roomIsReady:${roomIsReady}`)

    if (roomIsReady) {
      this.hostReadyProp.setPendingValue(false)
      this.guestReadyReceived = false
      this.hostBuzzedTimeProp.setPendingValue('')
      this.guestBuzzedTimeProp.setPendingValue('')
      this.currentActiveBuzzerProp.setPendingValue('NONE')
      this.roundStateProp.setPendingValue('PLAYING')
      this.fetchAndSync()
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