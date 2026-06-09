/**
 * MultiplayerTriviaManager.ts
 *
 * Full Production Script - Fixed Score Sync via StoragePropertySet.forAllUsers topology.
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
  private globalGameSyncEntity: SyncEntity | null = null
  private userStateSyncEntity: SyncEntity | null = null

  // ── Synced Network Properties ──────────────────────────────────────────────
  // Global Shared Room properties (Host-written, Guest-read)
  private jsonQuestionProp     = StorageProperty.manualString('jsonQuestion', '')
  private timerStartTokenProp = StorageProperty.manualString('timerStartToken', '')

  // User-specific properties (Everyone can read/write their own slots)
  private playerScoreProp = StorageProperty.manualInt('playerScore', 0)
  private playerReadyProp = StorageProperty.manualBool('playerReady', false)

  // ── Local State ────────────────────────────────────────────────────────────
  private correctAnswer: number         = 0
  private localScore: number            = 0
  private hasAnsweredThisRound: boolean = false
  private correctAnswerSelected: boolean = false
  private readonly POINTS               = 10

  private optionTexts: (Text | null)[] = [null, null, null, null]
  private isHost: boolean              = false
  private localPlayerId: string        = ''
  private opponentPlayerId: string     = ''
  private localTimeRemaining: number   = 0
  private timerActive: boolean         = false

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

    // 1. Setup Global Room Channel (Questions and Timers)
    const globalNetworkId = { customNetworkId: 'triviaGlobalRoomBlock', networkIdType: 'Custom' } as any
    this.globalGameSyncEntity = new SyncEntity(
      this,
      new StoragePropertySet([this.jsonQuestionProp, this.timerStartTokenProp]),
      true, 'Session', globalNetworkId
    )

    // FIX: Combined standard properties inside the native StoragePropertySet.forAllUsers() factory.
    // This replicates the properties for every individual player, granting total multi-user write permissions.
    const userNetworkId = { customNetworkId: 'triviaUserStateBlock', networkIdType: 'Custom' } as any
    const userPropertySet = StoragePropertySet.forAllUsers([this.playerScoreProp, this.playerReadyProp])
    
    this.userStateSyncEntity = new SyncEntity(
      this,
      userPropertySet,
      true, 'Session', userNetworkId
    )

    this.setupScoreboardCrossTalk()

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

    this.playerReadyProp.onAnyChange.add(() => this.evaluateHostQuestionFetch())

    this.setupProcessButton()

    this.globalGameSyncEntity.notifyOnReady(() => {
      this.log('Network sync layers online.')
      this.discoverPlayers()
      const initialJson = this.jsonQuestionProp.currentValue
      if (initialJson) this.parseAndApplyJson(initialJson)
    })
  }

  // ─── Network Identity Map ──────────────────────────────────────────────────

  private discoverPlayers() {
    const session = SessionController.getInstance() as any
    const currentUsers = session.getUsers?.() || session.getConnectedUsers?.() || []
    
    for (let i = 0; i < currentUsers.length; i++) {
      const u = currentUsers[i]
      if (u) {
        const id = u.userId || u.getUserId?.()
        if (id && id !== this.localPlayerId) {
          this.opponentPlayerId = id
          this.log(`Opponent identified with ID: ${this.opponentPlayerId}`)
          break
        }
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Scoreboard Engine
  // ───────────────────────────────────────────────────────────────────────────

  private setupScoreboardCrossTalk() {
    this.playerScoreProp.onAnyChange.add((changedProperty) => {
      if (!this.opponentPlayerId) {
        this.discoverPlayers()
      }

      const senderId = changedProperty.getOwnerId()
      const scoreValue = this.playerScoreProp.getValue(senderId) ?? 0

      this.log(`Score footprint modified by user [${senderId}]: ${scoreValue}`)

      if (senderId === this.localPlayerId) {
        if (this.myScoreValueText) this.myScoreValueText.text = String(scoreValue)
      } else if (senderId === this.opponentPlayerId || this.opponentPlayerId === '') {
        if (this.opponentScoreValueText) this.opponentScoreValueText.text = String(scoreValue)
      }
    })
  }

  private evaluateHostQuestionFetch() {
    if (!this.isHost) return

    if (!this.opponentPlayerId) {
      this.discoverPlayers()
    }

    const hostReady  = this.playerReadyProp.getValue(this.localPlayerId) ?? false
    const guestReady = this.opponentPlayerId ? (this.playerReadyProp.getValue(this.opponentPlayerId) ?? false) : false

    this.log(`Evaluating room setup parameters -> Host Ready: ${hostReady}, Guest Ready: ${guestReady}`)

    const roomIsReady = this.opponentPlayerId ? (hostReady && guestReady) : hostReady

    if (roomIsReady) {
      this.log('Ready synchronization validated. Clearing toggles and running fetch...');
      
      this.playerReadyProp.setValue(this.localPlayerId, false)
      if (this.opponentPlayerId) {
        this.playerReadyProp.setValue(this.opponentPlayerId, false)
      }

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
    if (!this.correctAnswerSelected) {
      if (this.incorrectText) this.incorrectText.enabled = true
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Buttons & Answer Logic
  // ───────────────────────────────────────────────────────────────────────────

  private setupProcessButton() {
    if (!this.processButton) return

    this.processButton.onTriggerUp.add(() => {
      this.log('Next button pressed. Marking identity status to ready...');
      this.hideAnswerFeedback()
      this.resetAnswerState()

      this.timerActive = false
      this.localTimeRemaining = 0
      if (this.timerText) this.timerText.text = 'Waiting...'

      this.playerReadyProp.setValue(this.localPlayerId, true)
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
    if (!this.timerActive && this.localTimeRemaining <= 0
        && this.timerStartTokenProp.currentValue !== '') {
      return
    }

    if (this.hasAnsweredThisRound) return

    const isCorrect = index === this.correctAnswer

    if (isCorrect) {
      this.correctAnswerSelected = true
      this.hasAnsweredThisRound  = true
      if (this.correctText)   this.correctText.enabled   = true
      if (this.incorrectText) this.incorrectText.enabled = false
      this.localScore += this.POINTS
      this.syncScoreToNetwork()
    } else {
      if (this.incorrectText) this.incorrectText.enabled = true
      if (this.correctText)   this.correctText.enabled   = false
    }
  }

  private syncScoreToNetwork() {
    this.log(`Updating multi-user network slot score: ${this.localScore}`)
    
    this.playerScoreProp.setValue(this.localPlayerId, this.localScore)
    if (this.myScoreValueText) this.myScoreValueText.text = String(this.localScore)
  }

  // ─── Supabase Fetch ────────────────────────────────────────────────────────

  private fetchAndSync() {
    const cloud = this.snapCloudRequirements as unknown as ISnapCloudRequirements
    if (!cloud?.isConfigured()) {
      this.log('SnapCloudRequirements not configured')
      return
    }

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
        this.log(`Edge Function error: ${response.body}`)
        this.setStatusText('Error loading question')
        return
      }
      this.handleEdgeFunctionResponse(response.body)
    })
  }

  private handleEdgeFunctionResponse(body: string) {
    try {
      const result = JSON.parse(body)
      if (result.ok !== true || !result.record) return

      const r = result.record as TriviaRecord

      this.jsonQuestionProp.setPendingValue(JSON.stringify(r))
      this.timerStartTokenProp.setPendingValue(
        `${this.roundDurationSeconds}:${Date.now()}`
      )

    } catch (e) {
      this.log(`Data normalization fault: ${e}`)
    }
  }

  // ─── UI Helpers ────────────────────────────────────────────────────────────

  private parseAndApplyJson(jsonStr: string) {
    try {
      const record = JSON.parse(jsonStr) as TriviaRecord

      this.correctAnswer = Number(record.answer ?? 0)
      if (this.questionText) this.questionText.text = String(record.question ?? '')

      this.setOptionText(0, String(record.option1 ?? ''))
      this.setOptionText(1, String(record.option2 ?? ''))
      this.setOptionText(2, String(record.option3 ?? ''))
      this.setOptionText(3, String(record.option4 ?? ''))

      this.resetAnswerState()
      this.hideAnswerFeedback()
      this.setStatusText(this.isHost ? 'Host' : 'Player')
    } catch (e) {
      this.log(`UI data rendering fault: ${e}`)
    }
  }

  private resetAnswerState() {
    this.hasAnsweredThisRound  = false
    this.correctAnswerSelected = false
  }

  private hideAnswerFeedback() {
    if (this.correctText)   this.correctText.enabled   = false
    if (this.incorrectText) this.incorrectText.enabled = false
  }

  private setStatusText(msg: string) {
    if (this.statusText) this.statusText.text = msg
    this.log(msg)
  }

  // ─── Text Component Traversal ──────────────────────────────────────────────

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