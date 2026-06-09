/**
 * MultiplayerTriviaManager.ts
 *
 * Drop this on a SceneObject alongside your existing
 * CustomEdgeFunctionObjectTopicUI component.
 *
 * HOW IT WORKS
 * ─────────────────────────────────────────────────────────────────────────────
 * • One player is the "host" – the first person who enters the session.
 *   The host is whoever owns the SyncEntity (claimOwnership = true on first
 *   player, unowned for everyone else who joins later).
 * • When any player presses the "Next Question" (processButton) the host
 *   fetches a new question from Supabase and writes the result into synced
 *   StorageProperties.  All other players receive the update automatically.
 * • Each player tracks their own score locally; a per-player score is also
 *   broadcast via a second, player-owned SyncEntity so everyone can see a
 *   live scoreboard.
 * • If the local player is NOT the host, pressing the button instead sends a
 *   NetworkedEvent asking the host to fetch.
 *
 * SETUP IN LENS STUDIO
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Make sure SpectaclesSyncKit.prefab is in your hierarchy.
 * 2. Add this script to the same SceneObject as your trivia UI script.
 * 3. Wire the @input fields in the Inspector (same inputs your UI script uses,
 *    plus the syncedUI reference to the UI script component itself).
 * 4. The UI script's onAwake() button wiring will still work; this manager
 *    intercepts the processButton tap via its own listener and can either
 *    proceed normally (host) or request via network (non-host).
 *
 * IMPORTANT: Do NOT duplicate the processButton.onTriggerUp listener – remove
 * the one inside CustomEdgeFunctionObjectTopicUI.setupProcessButton() or guard
 * it with a check, as shown in the comment at the bottom of this file.
 */

import { SessionController }  from 'SpectaclesSyncKit.lspkg/Core/SessionController'
import { SyncEntity }         from 'SpectaclesSyncKit.lspkg/Core/SyncEntity'
import { StorageProperty }    from 'SpectaclesSyncKit.lspkg/Core/StorageProperty'
import { StoragePropertySet } from 'SpectaclesSyncKit.lspkg/Core/StoragePropertySet'
import { NetworkedEvent }     from 'SpectaclesSyncKit.lspkg/Core/NetworkedEvent'
import { RectangleButton }    from 'SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton'
import { SnapCloudRequirements } from '../SnapCloudRequirements'

// ─── Small helper types ───────────────────────────────────────────────────────

/** The shape of the trivia record we read from Supabase. */
interface TriviaRecord {
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  optionCount: number
  answer: number        // 1-based index of the correct option
}

// ─── Component ───────────────────────────────────────────────────────────────

@component
export class MultiplayerTriviaManager extends BaseScriptComponent {

  // ── Supabase / edge-function wiring (same fields as the UI script) ─────────
  private internetModule: InternetModule = require('LensStudio:InternetModule')

  @input public snapCloudRequirements: SnapCloudRequirements
  @input public functionName: string = '[your-function-name]'
  @input public object: string = ''
  @input public topic: string = ''

  // ── UI inputs ──────────────────────────────────────────────────────────────
  @input public processButton: RectangleButton

  @input public questionText: Text
  @input public optionButton1: RectangleButton
  @input public optionButton2: RectangleButton
  @input public optionButton3: RectangleButton
  @input public optionButton4: RectangleButton
  @input public optionButtonChildTextName: string = ''

  @input public correctText: Text
  @input public incorrectText: Text
  @input public scoreValueText: Text

  /** Optional: a Text node to display the remote player's score. */
  @input public remoteScoreText: Text | null = null
  /** Optional: a Text node to show connection / host status. */
  @input public statusText: Text | null = null

  @input public enableDebugLogs: boolean = true

  // ── Internal state ─────────────────────────────────────────────────────────

  // Shared game state entity (owned by the host)
  private gameSyncEntity: SyncEntity | null = null

  // Synced question fields
  private questionProp    = StorageProperty.manualString('question',    '')
  private option1Prop     = StorageProperty.manualString('option1',     '')
  private option2Prop     = StorageProperty.manualString('option2',     '')
  private option3Prop     = StorageProperty.manualString('option3',     '')
  private option4Prop     = StorageProperty.manualString('option4',     '')
  private optionCountProp = StorageProperty.manualInt   ('optionCount', 0)
  private correctAnswerProp = StorageProperty.manualInt ('correctAnswer', 0)
  // A monotonically increasing revision counter so late-joiners also refresh
  private revisionProp    = StorageProperty.manualInt   ('revision',    0)

  // Per-player score entity (each player owns their own)
  private scoreSyncEntity: SyncEntity | null = null
  private myScoreProp     = StorageProperty.manualInt('score', 0)

  // Request-next-question networked event (any player → host)
  private requestQuestionEvent: NetworkedEvent | null = null

  // Local bookkeeping (mirrors your existing UI script logic)
  private correctAnswer: number        = 0
  private localScore: number           = 0
  private doOnce: boolean              = true
  private correctAnswerSelected: boolean = false
  private readonly POINTS_PER_QUESTION = 10

  private optionTexts: (Text | null)[] = [null, null, null, null]
  private isHost: boolean              = false
  private sessionReady: boolean        = false
  private lastRevisionSeen: number     = -1

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  onAwake() {
    this.cacheOptionChildTextNodes()
    this.setupAnswerButtons()
    this.hideAnswerFeedback()

    // Wait until the Sync Kit session is fully connected before doing anything
    // network-related.
    SessionController.getInstance().notifyOnReady(() => {
      this.onSessionReady()
    })

    this.setStatusText('Connecting…')
  }

  private onSessionReady() {
    this.sessionReady = true
    this.log('Session ready')

    // ── Shared game-state entity ──────────────────────────────────────────
    // The very first client to create this entity claims ownership (= becomes
    // the host for fetching questions).  Subsequent clients connect to the
    // already-existing store and do NOT claim ownership.
    //
    // Because SyncEntity creation is idempotent per SceneObject, we pass a
    // stable network ID so all players resolve to the same store.
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
      true,          // claimOwnership – only the first player actually gets it
      'Session',     // persistence: stays alive for the whole session
      { customId: 'triviaGameState' }
    )

    // ── Per-player score entity ───────────────────────────────────────────
    // Each player owns their own score store; use their user ID as the custom
    // network ID so stores don't collide.
    const myUserId = SessionController.getInstance().getLocalUserInfo()?.userID ?? 'localPlayer'
    this.scoreSyncEntity = new SyncEntity(
      this,
      new StoragePropertySet([this.myScoreProp]),
      true,
      'Session',
      { customId: `score_${myUserId}` }
    )

    // ── Networked event: any player can ask the host to fetch ─────────────
    this.requestQuestionEvent = new NetworkedEvent(this.gameSyncEntity, 'requestQuestion')
    this.requestQuestionEvent.add(() => {
      // Only the host should respond to this
      if (this.isHost) {
        this.log('Remote player requested a new question – fetching…')
        this.fetchAndSync()
      }
    })

    // ── React to question changes broadcasted by the host ─────────────────
    this.revisionProp.onAnyChange.add(() => {
      const newRevision = this.revisionProp.currentValue ?? 0
      if (newRevision > this.lastRevisionSeen) {
        this.lastRevisionSeen = newRevision
        this.applyCurrentSyncedQuestion()
      }
    })

    // ── React to remote score changes (show on scoreboard) ────────────────
    this.myScoreProp.onAnyChange.add(() => {
      // For a 2-player game we'd need to find the other player's score entity.
      // See note below about SyncRealtimeStore for a full scoreboard approach.
      this.refreshScoreUI()
    })

    // Wait for game entity to finish setup, then decide host status
    this.gameSyncEntity.notifyOnReady(() => {
      this.isHost = this.gameSyncEntity!.canIModifyStore()
      this.log(`I am ${this.isHost ? 'the HOST' : 'a CLIENT'}`)
      this.setStatusText(this.isHost ? 'Host – ready!' : 'Player – ready!')

      // Wire the Next Question button now that we know who we are
      this.setupProcessButton()

      // If we just joined mid-session, display whatever question is current
      this.applyCurrentSyncedQuestion()
    })
  }

  // ── Button wiring ──────────────────────────────────────────────────────────

  private setupProcessButton() {
    if (!this.processButton) return

    this.processButton.onTriggerUp.add(() => {
      this.hideAnswerFeedback()
      this.resetAnswerState()

      if (this.isHost) {
        // Host fetches and broadcasts
        this.fetchAndSync()
      } else {
        // Non-host sends an event asking the host to fetch
        this.requestQuestionEvent?.sendEvent()
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

  // ── Answer checking (purely local, no sync needed) ─────────────────────────

  private checkUserAnswer(index: number) {
    const isCorrect = index === this.correctAnswer

    if (isCorrect) {
      this.correctAnswerSelected = true
      this.correctText.enabled   = true
      this.incorrectText.enabled = false
      if (this.doOnce) {
        this.localScore += this.POINTS_PER_QUESTION
        this.doOnce = false
        // Broadcast updated score so the other player can see it
        this.myScoreProp.setPendingValue(this.localScore)
      }
    } else {
      this.incorrectText.enabled = true
      this.correctText.enabled   = false
      if (this.correctAnswerSelected) {
        // Penalty: answered correctly before, then changed mind
        this.localScore           -= this.POINTS_PER_QUESTION
        this.doOnce               = true
        this.correctAnswerSelected = false
        this.myScoreProp.setPendingValue(this.localScore)
      }
    }

    this.scoreValueText.text = String(this.localScore)
  }

  // ── Supabase fetch (host only) ─────────────────────────────────────────────

  private fetchAndSync() {
    if (!this.snapCloudRequirements?.isConfigured()) {
      this.log('SnapCloudRequirements not configured')
      return
    }

    const endpointUrl = `${this.snapCloudRequirements.getFunctionsApiUrl()}${this.functionName}`
    const payload: Record<string, string> = {}
    const obj   = this.object?.trim()
    const topic = this.topic?.trim()
    if (obj)   payload['object'] = obj
    if (topic) payload['topic']  = topic

    const request = RemoteServiceHttpRequest.create()
    request.url     = endpointUrl
    request.headers = this.snapCloudRequirements.getSupabaseHeaders()
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
        this.log('Edge Function returned ok=false or no record')
        return
      }

      const r = result.record as TriviaRecord

      // Write all question data into synced properties; this broadcasts to
      // every connected player automatically via the Sync Kit.
      this.questionProp.setPendingValue(String(r.question     ?? ''))
      this.option1Prop.setPendingValue (String(r.option1      ?? ''))
      this.option2Prop.setPendingValue (String(r.option2      ?? ''))
      this.option3Prop.setPendingValue (String(r.option3      ?? ''))
      this.option4Prop.setPendingValue (String(r.option4      ?? ''))
      this.optionCountProp.setPendingValue(Number(r.optionCount ?? 0))
      this.correctAnswerProp.setPendingValue(Number(r.answer  ?? 0))

      // Bump revision so all players (including host) know to refresh UI
      const nextRevision = (this.revisionProp.currentValue ?? 0) + 1
      this.revisionProp.setPendingValue(nextRevision)
      this.lastRevisionSeen = nextRevision

      // Host updates its own UI immediately (doesn't wait for round-trip)
      this.applyQuestionData(r)
      this.setStatusText('Host')

    } catch (e) {
      this.log(`JSON parse error: ${e}`)
    }
  }

  // ── UI helpers ─────────────────────────────────────────────────────────────

  /**
   * Reads the current synced StorageProperties and refreshes the local UI.
   * Called on every revision change so late joiners also see the question.
   */
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

  /** Host shortcut: apply a freshly-fetched record without waiting for network round-trip. */
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

  private refreshScoreUI() {
    this.scoreValueText.text = String(this.localScore)
    // If you have a Text node wired to remoteScoreText, you'd need to read the
    // other player's score entity here.  For a full scoreboard, iterate over
    // SessionController.getInstance().getUsers() and look up each score store.
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

  // ── Child-text helpers (copied from your UI script) ────────────────────────

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
 * MIGRATION NOTES FOR CustomEdgeFunctionObjectTopicUI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Option A – Keep both scripts on the same SceneObject:
 *   • In CustomEdgeFunctionObjectTopicUI.setupProcessButton(), wrap the
 *     onTriggerUp listener in an `if (this.managedExternally) return` guard,
 *     and add `@input public managedExternally: boolean = false` to that class.
 *     Tick the checkbox in Inspector when MultiplayerTriviaManager is present.
 *
 * Option B – Remove the UI script entirely and use only this manager:
 *   • This manager re-implements all UI and fetch logic already.
 *   • Wire the same Inspector inputs to this script instead.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SCOREBOARD EXTENSION (for a visible 2-player scoreboard)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. Add a second SyncEntity per player (already done above as scoreSyncEntity).
 * 2. To read the OTHER player's score, subscribe to SessionController's
 *    onUserJoinedSession event, find the store with customId = `score_<theirId>`,
 *    and bind to its score property's onAnyChange.
 * 3. Display both scores in your UI.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */