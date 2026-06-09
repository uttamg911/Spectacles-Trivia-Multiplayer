/**
 * MultiplayerTriviaManager.ts
 *
 * Drop this on a SceneObject alongside your existing UI script.
 */

import { SessionController }  from 'SpectaclesSyncKit.lspkg/Core/SessionController'
import { SyncEntity }         from 'SpectaclesSyncKit.lspkg/Core/SyncEntity'
import { StorageProperty }    from 'SpectaclesSyncKit.lspkg/Core/StorageProperty'
import { StoragePropertySet } from 'SpectaclesSyncKit.lspkg/Core/StoragePropertySet'
import { RectangleButton }    from 'SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton'

// ─── Minimal interface matching what we need from SnapCloudRequirements ───────
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

    const gameNetworkId = {
      customNetworkId: 'triviaGameState',
      networkIdType: 'Custom'
    } as any

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
      true,       
      'Session',  
      gameNetworkId
    )

    this.gameSyncEntity.onEventReceived.add('requestQuestion', () => {
      if (this.isHost) {
        this.log('Client requested next question — fetching…')
        this.fetchAndSync()
      }
    })

    // Listeners track updates sequentially across network updates
    this.revisionProp.onAnyChange.add(() => {
      const rev = this.revisionProp.currentValue ?? 0
      if (rev > this.lastRevisionSeen) {
        this.lastRevisionSeen = rev
        this.applyCurrentSyncedQuestion()
      }
    })

    const myConnectionId = SessionController.getInstance()
      .getLocalUserInfo()?.connectionId ?? 'localPlayer'

    const scoreNetworkId = {
      customNetworkId: `score_${myConnectionId}`,
      networkIdType: 'Custom'
    } as any

    this.scoreSyncEntity = new SyncEntity(
      this,
      new StoragePropertySet([this.myScoreProp]),
      true,
      'Session',
      scoreNetworkId
    )

    this.gameSyncEntity.notifyOnReady(() => {
      this.isHost = this.gameSyncEntity!.canIModifyStore()
      this.log(`I am the ${this.isHost ? 'HOST' : 'CLIENT'}`)
      this.setStatusText(this.isHost ? 'Host – ready!' : 'Player – ready!')

      this.setupProcessButton()
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
  // Answer checking 
  // ─────────────────────────────────────────────────────────────────────────

  private checkUserAnswer(index: number) {
    const isCorrect = index === this.correctAnswer

    if (isCorrect) {
      this.correctAnswerSelected = true
      if (this.correctText) this.correctText.enabled = true
      if (this.incorrectText) this.incorrectText.enabled = false
      if (this.doOnce) {
        this.localScore += this.POINTS
        this.doOnce = false
        this.myScoreProp.setPendingValue(this.localScore)
      }
    } else {
      if (this.incorrectText) this.incorrectText.enabled = true
      if (this.correctText) this.correctText.enabled = false
      if (this.correctAnswerSelected) {
        this.localScore           -= this.POINTS
        this.doOnce               = true
        this.correctAnswerSelected = false
        this.myScoreProp.setPendingValue(this.localScore)
      }
    }

    if (this.scoreValueText) this.scoreValueText.text = String(this.localScore)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Supabase fetch 
  // ─────────────────────────────────────────────────────────────────────────

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
        this.log('Edge Function returned ok=false or missing record')
        return
      }

      const r = result.record as TriviaRecord

      // Write values across the Sync Kit Properties
      this.questionProp.setPendingValue     (String(r.question    ?? ''))
      this.option1Prop.setPendingValue      (String(r.option1     ?? ''))
      this.option2Prop.setPendingValue      (String(r.option2     ?? ''))
      this.option3Prop.setPendingValue      (String(r.option3     ?? ''))
      this.option4Prop.setPendingValue      (String(r.option4     ?? ''))
      this.optionCountProp.setPendingValue  (Number(r.optionCount ?? 0))
      this.correctAnswerProp.setPendingValue(Number(r.answer      ?? 0))

      // Bump revision — Host updates will loop back on end of frame naturally
      const nextRev = (this.revisionProp.currentValue ?? 0) + 1
      this.revisionProp.setPendingValue(nextRev)

      this.setStatusText('Host')

    } catch (e) {
      this.log(`JSON parse error: ${e}`)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UI helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** * Reads unified storage properties and updates display safely across clients.
   */
  /*private applyCurrentSyncedQuestion() {
    // Read from currentOrPendingValue so the host can view locally immediate text while properties transfer
    const count = this.optionCountProp.currentOrPendingValue ?? 0
    if (count === 0) return 

    this.correctAnswer = this.correctAnswerProp.currentOrPendingValue ?? 0

    if (this.questionText) {
      this.questionText.text = this.questionProp.currentOrPendingValue ?? ''
    }

    this.setOptionText(0, this.option1Prop.currentOrPendingValue ?? '')
    this.setOptionText(1, this.option2Prop.currentOrPendingValue ?? '')
    this.setOptionText(2, this.option3Prop.currentOrPendingValue ?? '')
    this.setOptionText(3, this.option4Prop.currentOrPendingValue ?? '')

    if (this.optionButton1) this.optionButton1.enabled = count >= 1
    if (this.optionButton2) this.optionButton2.enabled = count >= 2
    if (this.optionButton3) this.optionButton3.enabled = count >= 3
    if (this.optionButton4) this.optionButton4.enabled = count >= 4

    this.resetAnswerState()
    this.hideAnswerFeedback()
    this.setStatusText(this.isHost ? 'Host' : 'Player')
  }*/
  private applyCurrentSyncedQuestion() {
    const count = this.optionCountProp.currentOrPendingValue ?? 0
    if (count === 0) return 

    this.correctAnswer = this.correctAnswerProp.currentOrPendingValue ?? 0

    if (this.questionText) {
      this.questionText.text = this.questionProp.currentOrPendingValue ?? ''
    }

    // FIXED: Maps option 1, 2, 3, and 4 perfectly to their respective properties
    this.setOptionText(0, this.option1Prop.currentOrPendingValue ?? '')
    this.setOptionText(1, this.option2Prop.currentOrPendingValue ?? '')
    this.setOptionText(2, this.option3Prop.currentOrPendingValue ?? '')
    this.setOptionText(3, this.option4Prop.currentOrPendingValue ?? '')

    if (this.optionButton1) this.optionButton1.enabled = true
    if (this.optionButton2) this.optionButton2.enabled = true
    if (this.optionButton3) this.optionButton3.enabled = true
    if (this.optionButton4) this.optionButton4.enabled = true

    this.resetAnswerState()
    this.hideAnswerFeedback()
    this.setStatusText(this.isHost ? 'Host' : 'Player')
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
  // Child-text helpers
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