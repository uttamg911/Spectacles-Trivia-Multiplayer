/**
 * MultiplayerTriviaManager.ts
 *
 * Resolved Player Score Updating and Localized Frame-Delta Countdown Sync.
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

@component
export class MultiplayerTriviaManager extends BaseScriptComponent {

  private internetModule: InternetModule = require('LensStudio:InternetModule')

  // ── Supabase Configuration ──────────────────────────────────────────────────
  @input('Component.ScriptComponent') public snapCloudRequirements: ScriptComponent
  @input public functionName: string = ''
  @input public object:  string = ''
  @input public topic:   string = ''

  // ── Core UI Connections ─────────────────────────────────────────────────────
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

  // ── Scoreboard, Timer & Ready States ────────────────────────────────────────
  @input public opponentScoreValueText: Text
  @input public timerText: Text
  @input public roundDurationSeconds: number = 15
  @input public enableDebugLogs: boolean = true

  // ── Core Sync Kit State Stores ──────────────────────────────────────────────
  private gameSyncEntity: SyncEntity | null = null

  // ── Synced Network Properties ──────────────────────────────────────────────
  private jsonQuestionProp      = StorageProperty.manualString('jsonQuestion', '')
  // FIX: Use a float timestamp/counter instead of a resettable duration.
  // We broadcast the target duration once; any change re-triggers the timer.
  private timerStartTokenProp   = StorageProperty.manualFloat('timerStartToken', 0.0)

  private hostScoreProp         = StorageProperty.manualInt('hostScore', 0)
  private hostReadyProp         = StorageProperty.manualBool('hostReady', false)
  private guestScoreProp        = StorageProperty.manualInt('guestScore', 0)
  private guestReadyProp        = StorageProperty.manualBool('guestReady', false)

  // ── Local Simulation Variables ─────────────────────────────────────────────
  private correctAnswer: number          = 0
  private localScore: number             = 0
  // FIX: Split into two clear, independent flags:
  //   hasAnsweredThisRound – locks out any further scoring once the player has
  //                          committed to an answer (correct or wrong)
  //   correctAnswerSelected – tracks whether the current committed answer is correct
  private hasAnsweredThisRound: boolean  = false
  private correctAnswerSelected: boolean = false
  private readonly POINTS                = 10

  private optionTexts: (Text | null)[]  = [null, null, null, null]
  private isHost: boolean               = false
  private localPlayerId: string         = ''
  private localTimeRemaining: number    = 0
  private timerActive: boolean          = false

  // ───────────────────────────────────────────────────────────────────────────
  // Lifecycle & Initialization
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
    this.log('Session connection established')
    const session = SessionController.getInstance() as any

    const localUser = session.getLocalUserInfo()
    this.localPlayerId = localUser ? (localUser.userId || localUser.getUserId?.()) : 'localPlayer'

    this.isHost = session.isHost?.() || false
    if (!this.isHost && session.getCreatorId) {
      this.isHost = (session.getCreatorId() === this.localPlayerId)
    }

    this.setStatusText(this.isHost ? 'Host' : 'Player/Guest')

    const gameNetworkId = { customNetworkId: 'triviaGlobalUnifiedState', networkIdType: 'Custom' } as any
    this.gameSyncEntity = new SyncEntity(
      this,
      new StoragePropertySet([
        this.jsonQuestionProp,
        this.timerStartTokenProp,   // FIX: renamed prop
        this.hostScoreProp,
        this.hostReadyProp,
        this.guestScoreProp,
        this.guestReadyProp
      ]),
      true, 'Session', gameNetworkId
    )

    this.setupScoreboardCrossTalk()

    this.jsonQuestionProp.onAnyChange.add(() => {
      const rawJson = this.jsonQuestionProp.currentValue
      if (rawJson) this.parseAndApplyJson(rawJson)
    })

    // FIX: The token value encodes the duration directly (always > 0 when a
    // round starts). Because we never reset it to 0, onAnyChange fires
    // reliably every time a new round is broadcast.
    this.timerStartTokenProp.onAnyChange.add(() => {
      const duration = this.timerStartTokenProp.currentValue ?? 0
      if (duration > 0) {
        this.localTimeRemaining = duration
        this.timerActive = true
        this.log(`Timer started: ${duration}s`)
      }
    })

    this.hostReadyProp.onAnyChange.add(() => this.evaluateHostQuestionFetch())
    this.guestReadyProp.onAnyChange.add(() => this.evaluateHostQuestionFetch())

    this.setupProcessButton()

    this.gameSyncEntity.notifyOnReady(() => {
      const initialJson = this.jsonQuestionProp.currentValue
      if (initialJson) this.parseAndApplyJson(initialJson)
    })
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Scoreboard Handlers
  // ───────────────────────────────────────────────────────────────────────────

  private setupScoreboardCrossTalk() {
    this.hostScoreProp.onAnyChange.add(() => {
      const score = this.hostScoreProp.currentValue ?? 0
      if (this.isHost) {
        if (this.myScoreValueText) this.myScoreValueText.text = String(score)
      } else {
        if (this.opponentScoreValueText) this.opponentScoreValueText.text = String(score)
      }
    })

    this.guestScoreProp.onAnyChange.add(() => {
      const score = this.guestScoreProp.currentValue ?? 0
      if (!this.isHost) {
        if (this.myScoreValueText) this.myScoreValueText.text = String(score)
      } else {
        if (this.opponentScoreValueText) this.opponentScoreValueText.text = String(score)
      }
    })
  }

  private evaluateHostQuestionFetch() {
    if (!this.isHost) return

    const hostReady  = this.hostReadyProp.currentValue  ?? false
    const guestReady = this.guestReadyProp.currentValue ?? false

    this.log(`Host evaluating ready states -> Host: ${hostReady}, Guest: ${guestReady}`)

    const session = SessionController.getInstance() as any
    const currentUsers = session.getUsers?.() || session.getConnectedUsers?.() || []

    let hasRemoteOpponent = false
    for (let i = 0; i < currentUsers.length; i++) {
      const u = currentUsers[i]
      if (u) {
        const id = u.userId || u.getUserId?.()
        if (id && id !== this.localPlayerId) {
          hasRemoteOpponent = true
          break
        }
      }
    }

    // FIX: When playing solo (no remote opponent), the host ready flag alone
    // is sufficient — no need to wait for a guest that will never arrive.
    const roomIsReady = hasRemoteOpponent ? (hostReady && guestReady) : hostReady

    if (roomIsReady) {
      this.log('Room validated. Fetching question…')
      this.hostReadyProp.setPendingValue(false)
      this.guestReadyProp.setPendingValue(false)
      this.fetchAndSync()
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Frame Update Loop
  // ───────────────────────────────────────────────────────────────────────────

  private onUpdate() {
    if (!this.timerActive) return

    this.localTimeRemaining -= getDeltaTime()

    if (this.localTimeRemaining <= 0) {
      this.localTimeRemaining = 0
      this.timerActive = false
      if (this.timerText) this.timerText.text = '0.0s'
      this.onRoundTimerExpired()
    } else {
      if (this.timerText) {
        this.timerText.text = this.localTimeRemaining.toFixed(1) + 's'
      }
    }
  }

  private onRoundTimerExpired() {
    this.log('Round complete.')
    // FIX: Show incorrect feedback only if the player never answered correctly.
    if (!this.correctAnswerSelected) {
      if (this.incorrectText) this.incorrectText.enabled = true
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Interface & Input System
  // ───────────────────────────────────────────────────────────────────────────

  private setupProcessButton() {
    if (!this.processButton) return

    this.processButton.onTriggerUp.add(() => {
      this.hideAnswerFeedback()
      this.resetAnswerState()

      this.timerActive = false
      if (this.timerText) this.timerText.text = 'Waiting...'

      if (this.isHost) {
        this.hostReadyProp.setPendingValue(true)
      } else {
        this.guestReadyProp.setPendingValue(true)
      }
      this.setStatusText('Waiting for players...')
    })
  }

  private setupAnswerButtons() {
    this.optionButton1?.onTriggerUp.add(() => this.checkUserAnswer(1))
    this.optionButton2?.onTriggerUp.add(() => this.checkUserAnswer(2))
    this.optionButton3?.onTriggerUp.add(() => this.checkUserAnswer(3))
    this.optionButton4?.onTriggerUp.add(() => this.checkUserAnswer(4))
  }

  private checkUserAnswer(index: number) {
    // FIX: Block answers when the timer has expired (use timerActive, not
    // the sync prop value, which is never reset to 0 anymore).
    if (!this.timerActive && this.localTimeRemaining <= 0 &&
        this.timerStartTokenProp.currentValue > 0) {
      return
    }

    // FIX: Once a correct answer is locked in, ignore all further presses.
    if (this.hasAnsweredThisRound) return

    const isCorrect = index === this.correctAnswer

    if (isCorrect) {
      // First correct answer this round — award points and lock scoring.
      this.correctAnswerSelected = true
      this.hasAnsweredThisRound  = true
      if (this.correctText)   this.correctText.enabled   = true
      if (this.incorrectText) this.incorrectText.enabled = false
      this.localScore += this.POINTS
      this.syncScoreToNetwork()
    } else {
      // Wrong answer — show feedback but do NOT deduct points and do NOT lock
      // the player out so they can still find the correct answer.
      if (this.incorrectText) this.incorrectText.enabled = true
      if (this.correctText)   this.correctText.enabled   = false
    }
  }

  private syncScoreToNetwork() {
    this.log(`Syncing score: ${this.localScore} (isHost: ${this.isHost})`)
    if (this.isHost) {
      this.hostScoreProp.setPendingValue(this.localScore)
    } else {
      this.guestScoreProp.setPendingValue(this.localScore)
    }
  }

  // ─── Supabase Cloud Integration ────────────────────────────────────────────

  private fetchAndSync() {
    const cloud = this.snapCloudRequirements as unknown as ISnapCloudRequirements
    if (!clo