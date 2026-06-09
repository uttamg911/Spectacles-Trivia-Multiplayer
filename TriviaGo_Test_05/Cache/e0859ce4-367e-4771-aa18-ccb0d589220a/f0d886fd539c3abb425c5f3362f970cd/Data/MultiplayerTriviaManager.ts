/**
 * MultiplayerTriviaManager.ts
 *
 * Fixed Buzzer Race Network Bubbling:
 * - Guest actions now reliably bubble up to the Host.
 * - Host captures network payloads explicitly from change events.
 * - Handles split-second timing differences between devices cleanly.
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
  private hostDataSyncEntity: SyncEntity | null = null
  private guestDataSyncEntity: SyncEntity | null = null

  // ── Synced Network Properties (Global Room State) ───────────────────────────
  private jsonQuestionProp     = StorageProperty.manualString('jsonQuestion', '')
  private timerStartTokenProp = StorageProperty.manualString('timerStartToken', '')
  
  // States: "PLAYING", "REVEAL_CORRECT", "REVEAL_INCORRECT"
  private roundStateProp       = StorageProperty.manualString('roundState', 'PLAYING') 
  // Track who is allowed to answer: "NONE" (Race Mode), "HOST_ONLY", "GUEST_ONLY"
  private currentActiveBuzzerProp = StorageProperty.manualString('currentActiveBuzzer', 'NONE')

  // ── Network Properties (Host Exclusive Data) ───────────────────────────────
  private hostScoreProp       = StorageProperty.manualInt('hostScore', 0)
  private hostReadyProp       = StorageProperty.manualBool('hostReady', false)
  private hostBuzzedTimeProp  = StorageProperty.manualString('hostBuzzedTime', '') // "timestamp:optionIndex"

  // ── Network Properties (Guest Exclusive Data) ──────────────────────────────
  private guestScoreProp      = StorageProperty.manualInt('guestScore', 0)
  private guestReadyProp      = StorageProperty.manualBool('guestReady', false)
  private guestBuzzedTimeProp = StorageProperty.manualString('guestBuzzedTime', '') // "timestamp:optionIndex"

  // ── Local State ────────────────────────────────────────────────────────────
  private correctAnswer: number         = 0
  private localScore: number            = 0
  private localHasAnsweredPhase: boolean = false 
  
  private readonly REWARD_POINTS        = 10
  private readonly PENALTY_POINTS       = 5

  private optionTexts: (Text | null)[] = [null, null, null, null]
  private isHost: boolean              = false
  private localPlayerId: string        = ''
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

    // 1. Shared Global Room Configuration
    const gameNetworkId = { customNetworkId: 'triviaGlobalUnifiedState', networkIdType: 'Custom' } as any
    this.gameSyncEntity = new SyncEntity(
      this,
      new StoragePropertySet([this.jsonQuestionProp, this.timerStartTokenProp, this.roundStateProp, this.currentActiveBuzzerProp]),
      true, 'Session', gameNetworkId
    )

    // 2. Separate Write Authority Channels
    const hostNetworkId  = { customNetworkId: 'triviaHostExclusiveState', networkIdType: 'Custom' } as any
    const guestNetworkId = { customNetworkId: 'triviaGuestExclusiveState', networkIdType: 'Custom' } as any

    this.hostDataSyncEntity = new SyncEntity(
      this,
      new StoragePropertySet([this.hostScoreProp, this.hostReadyProp, this.hostBuzzedTimeProp]),
      this.isHost, 'Session', hostNetworkId
    )

    this.guestDataSyncEntity = new SyncEntity(
      this,
      new StoragePropertySet([this.guestScoreProp, this.guestReadyProp, this.guestBuzzedTimeProp]),
      !this.isHost, 'Session', guestNetworkId
    )

    this.setupScoreboardCrossTalk()

    // Question syncing
    this.jsonQuestionProp.onAnyChange.add(() => {
      const rawJson = this.jsonQuestionProp.currentValue
      if (rawJson) this.parseAndApplyJson(rawJson)
    })

    // Timer sync
    this.timerStartTokenProp.onAnyChange.add(() => {
      const token = this.timerStartTokenProp.currentValue ?? ''
      if (!token) return
      const duration = parseFloat(token.split(':')[0])
      if (duration > 0) {
        this.localTimeRemaining = duration
        this.timerActive = true
      }
    })

    // Listen to gameplay state updates
    this.roundStateProp.onAnyChange.add(() => this.handleRoundStateChange())
    this.currentActiveBuzzerProp.onAnyChange.add(() => this.handleBuzzerStateChange())

    // Authoritative Host checks network property events directly
    if (this.isHost) {
      this.hostBuzzedTimeProp.onAnyChange.add((eventArgs) => {
        this.evaluateBuzzerRace(eventArgs.newValue, this.guestBuzzedTimeProp.currentValue)
      })
      this.guestBuzzedTimeProp.onAnyChange.add((eventArgs) => {
        this.evaluateBuzzerRace(this.hostBuzzedTimeProp.currentValue, eventArgs.newValue)
      })
    }

    this.hostReadyProp.onAnyChange.add(() => this.evaluateHostQuestionFetch())
    this.guestReadyProp.onAnyChange.add(() => this.evaluateHostQuestionFetch())

    this.setupProcessButton()
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Gameplay State Management Matrix
  // ───────────────────────────────────────────────────────────────────────────

  private handleRoundStateChange() {
    const state = this.roundStateProp.currentValue
    this.hideAnswerFeedback()

    if (state === 'REVEAL_CORRECT') {
      this.timerActive = false
      if (this.correctText) this.correctText.enabled = true
      this.setStatusText("Correct! Round Over.")
    } else if (state === 'REVEAL_INCORRECT') {
      this.timerActive = false
      if (this.incorrectText) this.incorrectText.enabled = true
      this.setStatusText(`Round Over! Answer was option ${this.correctAnswer}`)
    }
  }

  private handleBuzzerStateChange() {
    const activeBuzzer = this.currentActiveBuzzerProp.currentValue
    this.localHasAnsweredPhase = false

    const iamHostAndActive = (activeBuzzer === 'HOST_ONLY' && this.isHost)
    const iamGuestAndActive = (activeBuzzer === 'GUEST_ONLY' && !this.isHost)

    if (activeBuzzer === 'NONE') {
      this.setStatusText("RACE! Buzz in first!")
    } else if (iamHostAndActive || iamGuestAndActive) {
      this.setStatusText("Opponent missed! YOUR TURN to steal!")
    } else {
      this.setStatusText("Opponent is answering... Locked out.")
    }
  }

  private evaluateBuzzerRace(hostToken: string, guestToken: string) {
    if (!this.isHost) return
    const currentState = this.roundStateProp.currentValue
    if (currentState !== 'PLAYING') return

    const activeBuzzer = this.currentActiveBuzzerProp.currentValue

    // ── SCENARIO A: The initial flat race
    if (activeBuzzer === 'NONE') {
      if (!hostToken && !guestToken) return

      const hostTime = hostToken ? parseInt(hostToken.split(':')[0]) : Infinity
      const guestTime = guestToken ? parseInt(guestToken.split(':')[0]) : Infinity
      const hostOpt = hostToken ? parseInt(hostToken.split(':')[1]) : -1
      const guestOpt = guestToken ? parseInt(guestToken.split(':')[1]) : -1

      // Whichever registration came through with an earlier timestamp wins
      if (hostTime < guestTime) {
        this.processTurnAuthoritative('HOST', hostOpt)
      } else {
        this.processTurnAuthoritative('GUEST', guestOpt)
      }
    } 
    // ── SCENARIO B: Steal phase for Host
    else if (activeBuzzer === 'HOST_ONLY' && hostToken) {
      const hostOpt = parseInt(hostToken.split(':')[1])
      this.processTurnAuthoritative('HOST', hostOpt)
    } 
    // ── SCENARIO C: Steal phase for Guest
    else if (activeBuzzer === 'GUEST_ONLY' && guestToken) {
      const guestOpt = parseInt(guestToken.split(':')[1])
      this.processTurnAuthoritative('GUEST', guestOpt)
    }
  }

  private processTurnAuthoritative(player: 'HOST' | 'GUEST', chosenOption: number) {
    const isCorrect = chosenOption === this.correctAnswer
    const currentHostScore = this.hostScoreProp.currentValue ?? 0
    const currentGuestScore = this.guestScoreProp.currentValue ?? 0
    const activeBuzzer = this.currentActiveBuzzerProp.currentValue

    if (isCorrect) {
      if (player === 'HOST') {
        this.hostScoreProp.setPendingValue(currentHostScore + this.REWARD_POINTS)
      } else {
        this.guestScoreProp.setPendingValue(currentGuestScore + this.REWARD_POINTS)
      }
      this.roundStateProp.setPendingValue('REVEAL_CORRECT')
    } else {
      // Apply penalty points
      if (player === 'HOST') {
        this.hostScoreProp.setPendingValue(Math.max(0, currentHostScore - this.PENALTY_POINTS))
      } else {
        this.guestScoreProp.setPendingValue(Math.max(0, currentGuestScore - this.PENALTY_POINTS))
      }

      // If this was the first miss of the round, offer a steal window to the opponent
      if (activeBuzzer === 'NONE') {
        this.hostBuzzedTimeProp.setPendingValue('')
        this.guestBuzzedTimeProp.setPendingValue('')
        
        const nextTarget = (player === 'HOST') ? 'GUEST_ONLY' : 'HOST_ONLY'
        this.currentActiveBuzzerProp.setPendingValue(nextTarget)
      } else {
        // Both players failed
        this.roundStateProp.setPendingValue('REVEAL_INCORRECT')
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Scoreboard Alignment Cross-talk
  // ───────────────────────────────────────────────────────────────────────────

  private setupScoreboardCrossTalk() {
    this.hostScoreProp.onAnyChange.add(() => {
      const score = this.hostScoreProp.currentValue ?? 0
      if (this.isHost) {
        this.localScore = score
        if (this.myScoreValueText) this.myScoreValueText.text = String(score)
      } else {
        if (this.opponentScoreValueText) this.opponentScoreValueText.text = String(score)
      }
    })

    this.guestScoreProp.onAnyChange.add(() => {
      const score = this.guestScoreProp.currentValue ?? 0
      if (!this.isHost) {
        this.localScore = score
        if (this.myScoreValueText) this.myScoreValueText.text = String(score)
      } else {
        if (this.opponentScoreValueText) this.opponentScoreValueText.text = String(score)
      }
    })
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
      if (this.isHost) {
        this.roundStateProp.setPendingValue('REVEAL_INCORRECT')
      }
    } else {
      if (this.timerText) {
        this.timerText.text = this.localTimeRemaining.toFixed(1) + 's'
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Input Handling: Buzzer Interaction
  // ───────────────────────────────────────────────────────────────────────────

  private setupAnswerButtons() {
    this.optionButton1?.onTriggerUp.add(() => this.checkUserAnswer(1))
    this.optionButton2?.onTriggerUp.add(() => this.checkUserAnswer(2))
    this.optionButton3?.onTriggerUp.add(() => this.checkUserAnswer(3))
    this.optionButton4?.onTriggerUp.add(() => this.checkUserAnswer(4))
  }

  private checkUserAnswer(index: number) {
    if (!this.timerActive || this.localHasAnsweredPhase) return
    if (this.roundStateProp.currentValue !== 'PLAYING') return

    const currentBuzzerState = this.currentActiveBuzzerProp.currentValue
    
    if (currentBuzzerState === 'GUEST_ONLY' && this.isHost) return
    if (currentBuzzerState === 'HOST_ONLY' && !this.isHost) return

    this.localHasAnsweredPhase = true
    const timestampStr = `${Date.now()}:${index}`

    if (this.isHost) {
      this.hostBuzzedTimeProp.setPendingValue(timestampStr)
    } else {
      this.guestBuzzedTimeProp.setPendingValue(timestampStr)
    }
    
    this.setStatusText("Submitted! Waiting for verification...")
  }

  private setupProcessButton() {
    if (!this.processButton) return

    this.processButton.onTriggerUp.add(() => {
      this.hideAnswerFeedback()
      this.localHasAnsweredPhase = false

      this.timerActive = false
      this.localTimeRemaining = 0
      if (this.timerText) this.timerText.text = 'Waiting...'

      if (this.isHost) {
        this.hostReadyProp.setPendingValue(true)
      } else {
        this.guestReadyProp.setPendingValue(true)
      }
      this.setStatusText('Waiting for players...')
    })
  }

  private evaluateHostQuestionFetch() {
    if (!this.isHost) return

    const hostReady  = this.hostReadyProp.currentValue  ?? false
    const guestReady = this.guestReadyProp.currentValue ?? false

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
      this.hostReadyProp.setPendingValue(false)
      this.guestReadyProp.setPendingValue(false)
      
      this.hostBuzzedTimeProp.setPendingValue('')
      this.guestBuzzedTimeProp.setPendingValue('')
      this.currentActiveBuzzerProp.setPendingValue('NONE')
      this.roundStateProp.setPendingValue('PLAYING')

      this.fetchAndSync()
    }
  }

  // ─── Supabase Fetch ────────────────────────────────────────────────────────

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
        this.log(`Data parsing fault: ${e}`)
      }
    })
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

      this.localHasAnsweredPhase = false
      this.hideAnswerFeedback()
    } catch (e) {
      this.log(`UI data rendering fault: ${e}`)
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