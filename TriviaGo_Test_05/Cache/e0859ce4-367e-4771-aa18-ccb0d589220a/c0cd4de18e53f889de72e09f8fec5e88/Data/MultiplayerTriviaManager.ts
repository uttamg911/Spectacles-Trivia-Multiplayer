/**
 * MultiplayerTriviaManager.ts
 *
 * Drop this on a SceneObject alongside your existing UI script.
 *
 * FIXES vs v1
 * ─────────────────────────────────────────────────────────────────────────────
 * • Removed non-existent NetworkedEvent import — networked events are methods
 *   on SyncEntity itself: syncEntity.onEventReceived / syncEntity.sendEvent
 * • Removed SnapCloudRequirements import — injected as @input instead so the
 *   compiler doesn't need to resolve the relative path
 * • NetworkIdOptions: use { networkId: 'myId', networkIdType: NetworkIdType.Custom }
 *   (not customId)
 * • UserInfo.userId (lowercase d), not userID
 */

import { SessionController }  from 'SpectaclesSyncKit.lspkg/Core/SessionController'
import { SyncEntity }         from 'SpectaclesSyncKit.lspkg/Core/SyncEntity'
import { StorageProperty }    from 'SpectaclesSyncKit.lspkg/Core/StorageProperty'
import { StoragePropertySet } from 'SpectaclesSyncKit.lspkg/Core/StoragePropertySet'
import { NetworkIdOptions, NetworkIdType } from 'SpectaclesSyncKit.lspkg/Core/NetworkIdOptions'
import { RectangleButton }    from 'SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton'

// ─── Minimal interface matching what we need from SnapCloudRequirements ───────
// Injected as @input so we never import the type directly.
interface ISnapCloudRequirements {
  isConfigured(): boolean
  getFunctionsApiUrl(): string
  getSupabaseHeaders(): { [key: string]: string }
}

// ─── Trivia record shape from Supabase ───────────────────────────────────────
interface TriviaRecord {
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  optionCount: number
  answer: number  // 1-based index of the correct option
}

// ─────────────────────────────────────────────────────────────────────────────

@component
export class MultiplayerTriviaManager extends BaseScriptComponent {

  private internetModule: InternetModule = require('LensStudio:InternetModule')

  // ── Supabase config ────────────────────────────────────────────────────────
  /** Drag your SnapCloudRequirements SceneObject here */
  @input('Component.ScriptComponent') public snapCloudRequirements: ScriptComponent
  @input public functionName: string = '[your-function-name]'
  @input public object:  string = ''
  @input public topic:   string = ''

  // ── UI inputs ──────────────────────────────────────────────────────────────
  @input public processButton: RectangleButton

  @input public questionText: Text
  @input public optionButton1: RectangleButton
  @input public optionButton2: RectangleButton
  @input public optionButton3: RectangleButton
  @input public optionButton4: RectangleButton
  @input public optionButtonChildTextName: string = ''

  @input public correctText:   Text
  @input public incorrectText: Text
  @input public scoreValueText: Text

  /** Optional: show connection / host status */
  @input public statusText: Text | null = null

  @input public enableDebugLogs: boolean = true

  // ── Sync Kit objects ───────────────────────────────────────────────────────
  private gameSyncEntity: SyncEntity | null = null
  private scoreSyncEntity: SyncEntity | null = null

  // ── Synced question fields ────────────────────────────────────────────────
  private questionProp      = StorageProperty.manualString('question',     '')
  private option1Prop       = StorageProperty.manualString('option1',      '')
  private option2Prop       = StorageProperty.manualString('option2',      '')
  private option3Prop       = StorageProperty.manualString('option3',      '')
  private option4Prop       = StorageProperty.manualString('option4',      '')
  private optionCountProp   = StorageProperty.manualInt   ('optionCount',  0)
  private correctAnswerProp = StorageProperty.manualInt   ('correctAnswer', 0)
  // Monotonic counter – every client watches this to know a new question arrived
  private revisionProp      = StorageProperty.manualInt   ('revision',     0)

  // ── Per-player score ───────────────────────────────────────────────────────
  private myScoreProp = StorageProperty.manualInt('score', 0)

  // ── Local state ───────────────────────────────────────────────────────────
  private correctAnswer: number         = 0
  private localScore: number            = 0
  private doOnce: boolean               = true
  private correctAnswerSelected: boolean = false
  private readonly POINTS               = 10

  private optionTexts: (Text | null)[] = [null, null, null, null]
  private isHost: boolean              = false
  private lastRevisionSeen: number     = -1

  // ─────────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────────────────

  onAwake() {
    this.cacheOptionChildTextNodes()
    this.setupAnswerButtons()
    this.hideAnswerFeedback()
    this.setStatusText('Connecting…')

    SessionController.getInstance().notifyOnReady(() => this.onSessionReady())
  }

  private onSessionReady() {
    this.log('Session ready')

    // ── Shared game-state entity ──────────────────────────────────────────
    // All players connect to the same stable network ID.
    // The FIRST player who creates it claims ownership (= becomes host).
    const gameNetworkId: NetworkIdOptions = {
      networkId: 'triviaGameState',
      networkIdType: NetworkIdType.Custom,
    }

    this.gameSyncEntity = new SyncEntity(
      this,
      new StoragePropertySet([
        this.questionProp,
        this.option1Prop,
        this.option2Prop,
        this.option3Prop,
        this.option4Prop,
        this.optionCountProp,
        this.correctAnswerProp,
        this.revisionProp,
      ]),
      true,       // claimOwnership — only the first player actually gets it
      'Session',  // persistence
      gameNetworkId
    )

    // ── Networked event: any client can ask the host to fetch a question ──
    // API: SyncEntity.onEventReceived.add(eventName, callback)
    this.gameSyncEntity.onEventReceived.add('requestQuestion', () => {
      if (this.isHost) {
        this.log('Client requested next question — fetching…')
        this.fetchAndSync()
      }
    })

    // ── Watch the revision counter to know when a new question arrived ────
    this.revisionProp.onAnyChange.add(() => {
      const rev = this.revisionProp.currentValue ?? 0
      if (rev > this.lastRevisionSeen) {
        this.lastRevisionSeen = rev
        this.applyCurrentSyncedQuestion()
      }
    })

    // ── Per-player score entity ───────────────────────────────────────────
    // Each player uses their connectionId as the network ID so stores don't
    // collide.  connectionId is unique per device per session.
    const myConnectionId = SessionController.getInstance()
      .getLocalUserInfo()?.connectionId ?? 'localPlayer'

    const scoreNetworkId: NetworkIdOptions = {
      networkId: `score_${myConnectionId}`,
      networkIdType: NetworkIdType.Custom,
    }

    this.scoreSyncEntity = new SyncEntity(
      this,
      new StoragePropertySet([this.myScoreProp]),
      true,
      'Session',
      scoreNetworkId
    )

    // ── Wait for game entity to be ready, then decide host status ─────────
    this.gameSyncEntity.notifyOnReady(() => {
      this.isHost = this.gameSyncEntity!.canIModifyStore()
      this.log(`I am the ${this.isHost ? 'HOST' : 'CLIENT'}`)
      this.setStatusText(this.isHost ? 'Host – ready!' : 'Player – ready!')

      // Wire Next Question button now that we know host vs. client
      this.setupProcessButton()

      // If we joined mid-session, display whatever question is current
      this.applyCurrentSyncedQuestion()
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Button wiring
  // ─────────────────────────────────────────────────────────────────────────

  private setupProcessButton() {
    if (!this.processButton) return

    this.processButton.onTriggerUp.add(() => {
      this.hideAnswerFeedback()
      this.resetAnswerState()

      if (this.isHost) {
        this.fetchAndSync()
      } else {
        // API: SyncEntity.sendEvent(eventName)
        this.gameSyncEntity?.sendEvent('requestQuestion')
        this.setStatusText('Asking host for next question…')
      }
    })
  }

  private setupAnswerButtons() {
    this.optionButton1?.onTriggerUp.add(() => this.checkUserAnswer(1))
    this.optionButton2?.onTriggerUp.add(() => this.checkUserAnswer(2))
    this.optionButton3?.onTriggerUp.add(() => this.checkUserAnswer(3))
    this.optionButton4?.onTriggerUp.add(() => this.checkUserAnswer(4))
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Answer checking  (local only – no sync needed)
  // ─────────────────────────────────────────────────────────────────────────

  private checkUserAnswer(index: number) {
    const isCorrect = index === this.correctAnswer

    if (isCorrect) {
      this.correctAnswerSelected = true
      this.correctText.enabled   = true
      this.incorrectText.enabled = false
      if (this.doOnce) {
        this.localScore += this.POINTS
        this.doOnce = false
        this.myScoreProp.setPendingValue(this.localScore)
      }
    } else {
      this.incorrectText.enabled = true
      this.correctText.enabled   = false
      if (this.correctAnswerSelected) {
        this.localScore           -= this.POINTS
        this.doOnce               = true
        this.correctAnswerSelected = false
        this.myScoreProp.setPendingValue(this.localScore)
      }
    }

    this.scoreValueText.text = String(this.localScore)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Supabase fetch  (host only)
  // ─────────────────────────────────────────────────────────────────────────

  private fetchAndSync() {
    // Cast the injected script component to our local interface
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
        this.log('Edge Function returned ok=false or missing record')
        return
      }

      const r = result.record as TriviaRecord

      // Write all question fields to synced StorageProperties.
      // These broadcast to every connected player automatically.
      this.questionProp.setPendingValue     (String(r.question    ?? ''))
      this.option1Prop.setPendingValue      (String(r.option1     ?? ''))
      this.option2Prop.setPendingValue      (String(r.option2     ?? ''))
      this.option3Prop.setPendingValue      (String(r.option3     ?? ''))
      this.option4Prop.setPendingValue      (String(r.option4     ?? ''))
      this.optionCountProp.setPendingValue  (Number(r.optionCount ?? 0))
      this.correctAnswerProp.setPendingValue(Number(r.answer      ?? 0))

      // Bump revision — all clients (including host) watch this to refresh UI
      const nextRev = (this.revisionProp.currentValue ?? 0) + 1
      this.revisionProp.setPendingValue(nextRev)
      this.lastRevisionSeen = nextRev

      // Host applies immediately without waiting for network round-trip
      this.applyQuestionData(r)
      this.setStatusText('Host')

    } catch (e) {
      this.log(`JSON parse error: ${e}`)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UI helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** Read current StorageProperty values and refresh local UI.
   *  Called on revisionProp change, so late-joiners also see current question. */
  private applyCurrentSyncedQuestion() {
    const count = this.optionCountProp.currentValue ?? 0
    if (count === 0) return  // nothing synced yet

    this.correctAnswer = this.correctAnswerProp.currentValue ?? 0

    if (this.questionText) {
      this.questionText.text = this.questionProp.currentValue ?? ''
    }

    this.setOptionText(0, this.option1Prop.currentValue ?? '')
    this.setOptionText(1, this.option2Prop.currentValue ?? '')
    this.setOptionText(2, this.option3Prop.currentValue ?? '')
    this.setOptionText(3, this.option4Prop.currentValue ?? '')

    this.optionButton1.enabled = count >= 1
    this.optionButton2.enabled = count >= 2
    this.optionButton3.enabled = count >= 3
    this.optionButton4.enabled = count >= 4

    this.resetAnswerState()
    this.hideAnswerFeedback()
    this.setStatusText(this.isHost ? 'Host' : 'Player')
  }

  /** Host shortcut: apply a freshly-fetched record without waiting for round-trip. */
  private applyQuestionData(r: TriviaRecord) {
    this.correctAnswer = Number(r.answer ?? 0)

    if (this.questionText) this.questionText.text = String(r.question ?? '')

    this.setOptionText(0, String(r.option1 ?? ''))
    this.setOptionText(1, String(r.option2 ?? ''))
    this.setOptionText(2, String(r.option3 ?? ''))
    this.setOptionText(3, String(r.option4 ?? ''))

    const count = Number(r.optionCount ?? 0)
    this.optionButton1.enabled = count >= 1
    this.optionButton2.enabled = count >= 2
    this.optionButton3.enabled = count >= 3
    this.optionButton4.enabled = count >= 4
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

  // ─────────────────────────────────────────────────────────────────────────
  // Child-text helpers (mirrors your existing UI script)
  // ─────────────────────────────────────────────────────────────────────────

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
    if ((root as any).name === name) return root
    const count = root.getChildrenCount()
    for (let i = 0; i < count; i++) {
      const child = root.getChild(i)
      if (!child) continue
      if ((child as any).name === name) return child
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

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * MIGRATION NOTE FOR CustomEdgeFunctionObjectTopicUI
 * ─────────────────────────────────────────────────────────────────────────────
 * Add this field to CustomEdgeFunctionObjectTopicUI and guard its button wiring:
 *
 *   @input public managedExternally: boolean = false
 *
 *   private setupProcessButton() {
 *     if (this.managedExternally) return   // ← add this line
 *     if (!this.processButton) return
 *     this.processButton.onTriggerUp.add(() => { ... })
 *   }
 *
 * Then tick "Managed Externally" in the Inspector when MultiplayerTriviaManager
 * is present on the same SceneObject.
 * ─────────────────────────────────────────────────────────────────────────────
 */