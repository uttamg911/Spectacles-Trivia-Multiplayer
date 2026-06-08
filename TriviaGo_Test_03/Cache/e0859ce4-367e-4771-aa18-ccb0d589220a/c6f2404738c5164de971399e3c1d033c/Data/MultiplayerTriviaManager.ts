/**
 * MultiplayerTriviaManager.ts
 *
 * Fixed Scoreboard and Server Clock Synchronization.
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
  private hostPlayerSyncEntity: SyncEntity | null = null
  private guestPlayerSyncEntity: SyncEntity | null = null

  // ── Synced Network Properties ──────────────────────────────────────────────
  private jsonQuestionProp     = StorageProperty.manualString('jsonQuestion', '')
  private timerEndServerTimeProp = StorageProperty.manualFloat('timerEndServerTime', 0.0)

  // Explicit, static network properties to prevent naming drops
  private hostScoreProp  = StorageProperty.manualInt('hostScore', 0)
  private hostReadyProp  = StorageProperty.manualBool('hostReady', false)
  private guestScoreProp = StorageProperty.manualInt('guestScore', 0)
  private guestReadyProp = StorageProperty.manualBool('guestReady', false)

  // ── Local Simulation Variables ─────────────────────────────────────────────
  private correctAnswer: number         = 0
  private localScore: number            = 0
  private doOnce: boolean               = true
  private correctAnswerSelected: boolean = false
  private readonly POINTS               = 10

  private optionTexts: (Text | null)[] = [null, null, null, null]
  private isHost: boolean              = false
  private timerActive: boolean         = false

  // ───────────────────────────────────────────────────────────────────────────
  // Lifecycle & Initialization
  // ─────────────────────────────────────────────────────────────────────────

  onAwake() {
    this.cacheOptionChildTextNodes()
    this.setupAnswerButtons()
    this.hideAnswerFeedback()
    this.setStatusText('Connecting…')

    if (this.timerText) this.timerText.text = ''
    if (this.opponentScoreValueText) this.opponentScoreValueText.text = '0'
    if (this.myScoreValueText) this.myScoreValueText.text = '0'

    this.createEvent("UpdateEvent").bind(() => this.onUpdate());
    SessionController.getInstance().notifyOnReady(() => this.onSessionReady())
  }

  private onSessionReady() {
    this.log('Session connection established')
    
    // 1. Core Global Game Sync Setup
    const gameNetworkId = { customNetworkId: 'triviaGameState', networkIdType: 'Custom' } as any
    this.gameSyncEntity = new SyncEntity(
      this,
      new StoragePropertySet([this.jsonQuestionProp, this.timerEndServerTimeProp]),
      true, 'Session', gameNetworkId
    )

    this.gameSyncEntity.notifyOnReady(() => {
      // Establish who is the true network host
      this.isHost = this.gameSyncEntity!.canIModifyStore()
      this.setStatusText(this.isHost ? 'Host – Ready' : 'Player – Ready')
      
      // 2. Instantiate Static, Explicit Sync Entities based on Room Status Role
      const hostStoreId  = { customNetworkId: 'trivia_host_store', networkIdType: 'Custom' } as any
      const guestStoreId = { customNetworkId: 'trivia_guest_store', networkIdType: 'Custom' } as any

      this.hostPlayerSyncEntity = new SyncEntity(
        this,
        new StoragePropertySet([this.hostScoreProp, this.hostReadyProp]),
        this.isHost, // Only the true Host writes to this entity
        'Session', hostStoreId
      )

      this.guestPlayerSyncEntity = new SyncEntity(
        this,
        new StoragePropertySet([this.guestScoreProp, this.guestReadyProp]),
        !this.isHost, // The non-host guest writes to this entity
        'Session', guestStoreId
      )

      // 3. Bind Cross-Talk Scoreboard Sync Listeners
      this.setupScoreboardCrossTalkListeners()

      // 4. Bind Ready State Evaluation Updates
      this.hostReadyProp.onAnyChange.add(() => this.evaluateHostQuestionFetch())
      this.guestReadyProp.onAnyChange.add(() => this.evaluateHostQuestionFetch())

      // 5. Connect Global Question Listeners
      this.jsonQuestionProp.onAnyChange.add(() => {
        const rawJson = this.jsonQuestionProp.currentValue
        if (rawJson) this.parseAndApplyJson(rawJson)
      })

      this.timerEndServerTimeProp.onAnyChange.add(() => {
        const targetTime = this.timerEndServerTimeProp.currentValue ?? 0
        if (targetTime > 0) {
          this.timerActive = true
          this.log(`New target synchronized network clock received: ${targetTime}`)
        }
      })

      this.setupProcessButton()

      const initialJson = this.jsonQuestionProp.currentValue
      if (initialJson) this.parseAndApplyJson(initialJson)
    })
  }

  // ───────────────────────────────────────────────────────────────────────────
  // FIXED: Concrete Score Routing Engine
  // ───────────────────────────────────────────────────────────────────────────

  private setupScoreboardCrossTalkListeners() {
    // Whenever the host score property changes over the network:
    this.hostScoreProp.onAnyChange.add(() => {
      const val = this.hostScoreProp.currentValue ?? 0
      if (this.isHost) {
        if (this.myScoreValueText) this.myScoreValueText.text = String(val)
      } else {
        if (this.opponentScoreValueText) this.opponentScoreValueText.text = String(val)
      }
    })

    // Whenever the guest score property changes over the network:
    this.guestScoreProp.onAnyChange.add(() => {
      const val = this.guestScoreProp.currentValue ?? 0
      if (!this.isHost) {
        if (this.myScoreValueText) this.myScoreValueText.text = String(val)
      } else {
        if (this.opponentScoreValueText) this.opponentScoreValueText.text = String(val)
      }
    })
  }

  private evaluateHostQuestionFetch() {
    if (!this.isHost) return

    const isHostReady  = this.hostReadyProp.currentValue ?? false
    const isGuestReady = this.guestReadyProp.currentValue ?? false

    this.log(`Evaluating room configurations: [Host Ready: ${isHostReady}] | [Guest Ready: ${isGuestReady}]`)

    // Proceed to fetch if both rooms are flagged true
    if (isHostReady && isGuestReady) {
      this.log('All participants confirmed ready. Resetting ready toggles and pulling next round...')
      this.hostReadyProp.setPendingValue(false)
      this.guestReadyProp.setPendingValue(false)
      this.fetchAndSync()
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // FIXED: Network-Locked Frame Update Loop
  // ───────────────────────────────────────────────────────────────────────────

  private onUpdate() {
    if (!this.timerActive) return

    const targetEndTime = this.timerEndServerTimeProp.currentValue ?? 0
    if (targetEndTime === 0) {
      this.timerActive = false
      return
    }

    // Lock calculations strictly to standard server network runtime execution
    const currentTime = SessionController.getInstance().getServerTimeInSeconds() ?? 0
    const remainingTime = targetEndTime - currentTime

    if (remainingTime <= 0) {
      this.timerActive = false
      if (this.timerText) this.timerText.text = '0.0s'
      this.onRoundTimerExpired()
    } else {
      if (this.timerText) {
        this.timerText.text = remainingTime.toFixed(1) + 's'
      }
    }
  }

  private onRoundTimerExpired() {
    this.log('Round timer hit deadline. Locking interactables.')
    if (!this.correctAnswerSelected && this.doOnce) {
      if (this.incorrectText) this.incorrectText.enabled = true
      this.doOnce = false
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Core Interface & Button Setup
  // ─────────────────────────────────────────────────────────────────────────

  private setupProcessButton() {
    if (!this.processButton) return

    this.processButton.onTriggerUp.add(() => {
      this.hideAnswerFeedback()
      this.resetAnswerState()

      // Reset local visual clock while waiting for host network authorization packet
      this.timerActive = false
      if (this.timerText) this.timerText.text = 'Waiting...'

      this.log('Local player requested ready verification status.')
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
    const currentTime = SessionController.getInstance().getServerTimeInSeconds() ?? 0
    const targetEndTime = this.timerEndServerTimeProp.currentValue ?? 0
    if (targetEndTime > 0 && currentTime >= targetEndTime) {
      this.log('Attempted submission bypassed. Round has concluded.')
      return
    }

    const isCorrect = index === this.correctAnswer

    if (isCorrect) {
      this.correctAnswerSelected = true
      if (this.correctText) this.correctText.enabled = true
      if (this.incorrectText) this.incorrectText.enabled = false
      if (this.doOnce) {
        this.localScore += this.POINTS
        this.doOnce = false
        this.syncLocalScoreToNetwork()
      }
    } else {
      if (this.incorrectText) this.incorrectText.enabled = true
      if (this.correctText) this.correctText.enabled = false
      if (this.correctAnswerSelected) {
        this.localScore           -= this.POINTS
        this.doOnce               = true
        this.correctAnswerSelected = false
        this.syncLocalScoreToNetwork()
      }
    }
  }

  private syncLocalScoreToNetwork() {
    if (this.isHost) {
      this.hostScoreProp.setPendingValue(this.localScore)
    } else {
      this.guestScoreProp.setPendingValue(this.localScore)
    }
  }

  // ─── Supabase Data Fetch Execution ──────────────────────────────────────────

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

      if (result.ok !== true || !result.record) {
        this.log('Edge Function verification mismatch')
        return
      }

      const r = result.record as TriviaRecord
      
      // Calculate server target time strictly on the master host authority profile
      const currentServerTime = SessionController.getInstance().getServerTimeInSeconds() ?? 0
      const endServerTimestamp = currentServerTime + this.roundDurationSeconds

      // Update the shared properties across the network topology
      this.timerEndServerTimeProp.setPendingValue(endServerTimestamp)
      this.jsonQuestionProp.setPendingValue(JSON.stringify(r))

    } catch (e) {
      this.log(`Data normalization crash: ${e}`)
    }
  }

  // ─── UI Application Blocks ──────────────────────────────────────────────────

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
      this.log(`UI data rendering payload fault: ${e}`)
    }
  }

  private resetAnswerState() {
    this.doOnce               = true
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

  // ─── Text Node Graph Hierarchy Traversals ───────────────────────────────────

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