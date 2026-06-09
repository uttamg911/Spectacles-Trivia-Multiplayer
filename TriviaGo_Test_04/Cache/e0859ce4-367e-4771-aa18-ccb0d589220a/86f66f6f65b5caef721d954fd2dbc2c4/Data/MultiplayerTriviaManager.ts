/**
 * MultiplayerTriviaManager.ts
 * 
 * FINAL FIX: Proper ready flag syncing with host-owned entity
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

  private gameSyncEntity: SyncEntity | null = null

  // Host-owned: game state
  private jsonQuestionProp        = StorageProperty.manualString('jsonQuestion', '')
  private timerStartTokenProp     = StorageProperty.manualString('timerStartToken', '')
  private hostScoreProp           = StorageProperty.manualInt('hostScore', 0)
  private guestScoreProp          = StorageProperty.manualInt('guestScore', 0)
  private gameStateProp           = StorageProperty.manualString('gameState', 'LOADING')
  private hostBuzzedAtProp        = StorageProperty.manualString('hostBuzzedAt', '')
  private guestBuzzedAtProp       = StorageProperty.manualString('guestBuzzedAt', '')

  // SEPARATE entities for ready flags (so each can write their own)
  private hostReadySyncEntity: SyncEntity | null = null
  private guestReadySyncEntity: SyncEntity | null = null
  
  private hostReadyProp           = StorageProperty.manualBool('hostReady', false)
  private guestReadyProp          = StorageProperty.manualBool('guestReady', false)

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
    const sessionController = SessionController.getInstance() as any

    const localUser = sessionController.getLocalUserInfo()
    this.localPlayerId = localUser
      ? (localUser.userId || localUser.getUserId?.())
      : 'localPlayer'

    this.isHost = sessionController.isHost?.() || false
    if (!this.isHost && sessionController.getCreatorId) {
      this.isHost = (sessionController.getCreatorId() === this.localPlayerId)
    }

    this.log(`Connected as ${this.isHost ? '✓ HOST' : '✗ GUEST'}`)
    this.setStatusText(this.isHost ? 'Host' : 'Guest')

    // ── GAME STATE ENTITY (host-owned) ────────────────────────────────────
    const gameNetworkId = { customNetworkId: 'triviaGame_v2', networkIdType: 'Custom' } as any
    this.gameSyncEntity = new SyncEntity(
      this,
      new StoragePropertySet([
        this.jsonQuestionProp,
        this.timerStartTokenProp,
        this.hostScoreProp,
        this.guestScoreProp,
        this.gameStateProp,
        this.hostBuzzedAtProp,
        this.guestBuzzedAtProp,
      ]),
      true, // Host always owns this
      'Session',
      gameNetworkId
    )

    // ── HOST READY ENTITY (host-owned, host writes it) ──────────────────
    const hostReadyNetworkId = { customNetworkId: 'triviaHostReady', networkIdType: 'Custom' } as any
    this.hostReadySyncEntity = new SyncEntity(
      this,
      new StoragePropertySet([this.hostReadyProp]),
      this.isHost, // Only host owns/writes this
      'Session',
      hostReadyNetworkId
    )

    // ── GUEST READY ENTITY (guest-owned, guest writes it) ────────────────
    const guestReadyNetworkId = { customNetworkId: 'triviaGuestReady', networkIdType: 'Custom' } as any
    this.guestReadySyncEntity = new SyncEntity(
      this,
      new StoragePropertySet([this.guestReadyProp]),
      !this.isHost, // Only guest owns/writes this
      'Session',
      guestReadyNetworkId
    )

    this.log(`Created entities: game (host), hostReady (${this.isHost ? 'WRITE' : 'read'}), guestReady (${!this.isHost ? 'WRITE' : 'read'})`)

    this.setupPropertyListeners()
    this.setupProcessButton()
  }

  private setupPropertyListeners() {
    // Load question
    this.jsonQuestionProp.onAnyChange.add(() => {
      const json = this.jsonQuestionProp.currentValue
      if (json) this.parseAndApplyJson(json)
    })

    // Start timer
    this.timerStartTokenProp.onAnyChange.add(() => {
      const token = this.timerStartTokenProp.currentValue ?? ''
      if (!token) return
      const duration = parseFloat(token.split(':')[0])
      if (duration > 0) {
        this.localTimeRemaining = duration
        this.timerActive = true
        this.log(`⏱️ Timer: ${duration}s`)
      }
    })

    // BUZZER: Freeze timer when EITHER player buzzes
    this.hostBuzzedAtProp.onAnyChange.add(() => {
      if (this.hostBuzzedAtProp.currentValue) {
        this.timerActive = false
        this.log(`🔴 HOST BUZZED - Timer frozen everywhere`)
      }
    })

    this.guestBuzzedAtProp.onAnyChange.add(() => {
      if (this.guestBuzzedAtProp.currentValue) {
        this.timerActive = false
        this.log(`🟢 GUEST BUZZED - Timer frozen everywhere`)
      }
    })

    // SCORES: Update everywhere
    this.hostScoreProp.onAnyChange.add(() => {
      const score = this.hostScoreProp.currentValue ?? 0
      this.log(`📊 Host score: ${score}`)
      if (this.isHost) {
        this.localScore = score
        if (this.myScoreValueText) this.myScoreValueText.text = String(score)
      } else {
        if (this.opponentScoreValueText) this.opponentScoreValueText.text = String(score)
      }
    })

    this.guestScoreProp.onAnyChange.add(() => {
      const score = this.guestScoreProp.currentValue ?? 0
      this.log(`📊 Guest score: ${score}`)
      if (!this.isHost) {
        this.localScore = score
        if (this.myScoreValueText) this.myScoreValueText.text = String(score)
      } else {
        if (this.opponentScoreValueText) this.opponentScoreValueText.text = String(score)
      }
    })

    // Ready flags - host listens for both
    this.hostReadyProp.onAnyChange.add(() => {
      const isReady = this.hostReadyProp.currentValue ?? false
      this.log(`hostReady changed: ${isReady}`)
      if (this.isHost) {
        this.tryStartNewRound()
      }
    })

    this.guestReadyProp.onAnyChange.add(() => {
      const isReady = this.guestReadyProp.currentValue ?? false
      this.log(`guestReady changed: ${isReady}`)
      if (this.isHost) {
        this.tryStartNewRound()
      }
    })
  }

  private tryStartNewRound() {
    if (!this.isHost) return

    const hostReady = this.hostReadyProp.currentValue ?? false
    const guestReady = this.guestReadyProp.currentValue ?? false

    this.log(`Checking ready: host=${hostReady}, guest=${guestReady}`)

    const sessionController = SessionController.getInstance() as any
    const currentUsers = sessionController.getUsers?.() || []
    
    let hasRemoteOpponent = false
    for (let i = 0; i < currentUsers.length; i++) {
      const u = currentUsers[i]
      if (u && (u.userId || u.getUserId?.()) !== this.localPlayerId) {
        hasRemoteOpponent = true
        break
      }
    }

    this.log(`hasRemoteOpponent=${hasRemoteOpponent}`)

    // If multiplayer, need both ready. If singleplayer, only host ready.
    const roomReady = hasRemoteOpponent ? (hostReady && guestReady) : hostReady

    if (roomReady) {
      this.log(`✅ Both ready! Loading question...`)
      
      this.hostReadyProp.setPendingValue(false)
      this.guestReadyProp.setPendingValue(false)
      this.hostBuzzedAtProp.setPendingValue('')
      this.guestBuzzedAtProp.setPendingValue('')
      this.gameStateProp.setPendingValue('PLAYING')
      
      this.fetchAndSync()
    } else {
      this.log(`⏳ Waiting for opponent...`)
    }
  }

  private onUpdate() {
    if (this.isHost) {
      this.evaluateBuzzer()
    }

    if (!this.timerActive) return

    this.localTimeRemaining -= getDeltaTime()

    if (this.localTimeRemaining <= 0) {
      this.localTimeRemaining = 0
      this.timerActive = false
      if (this.timerText) this.timerText.text = '0.0s'
      if (this.isHost) {
        this.gameStateProp.setPendingValue('TIMEOUT')
      }
    } else {
      if (this.timerText) this.timerText.text = this.localTimeRemaining.toFixed(1) + 's'
    }
  }

  private evaluateBuzzer() {
    if (!this.isHost) return
    if (this.gameStateProp.currentValue !== 'PLAYING') return

    const hostBuzz = this.hostBuzzedAtProp.currentValue || ''
    const guestBuzz = this.guestBuzzedAtProp.currentValue || ''

    if (!hostBuzz && !guestBuzz) return

    this.log(`🏁 Evaluating buzz...`)

    let winner: 'HOST' | 'GUEST'
    let chosenOption: number

    if (hostBuzz && !guestBuzz) {
      winner = 'HOST'
      chosenOption = parseInt(hostBuzz.split(':')[1])
    } else if (guestBuzz && !hostBuzz) {
      winner = 'GUEST'
      chosenOption = parseInt(guestBuzz.split(':')[1])
    } else {
      const hostTime = parseInt(hostBuzz.split(':')[0])
      const guestTime = parseInt(guestBuzz.split(':')[0])
      winner = hostTime <= guestTime ? 'HOST' : 'GUEST'
      chosenOption = winner === 'HOST' 
        ? parseInt(hostBuzz.split(':')[1])
        : parseInt(guestBuzz.split(':')[1])
    }

    this.log(`Winner: ${winner}, Option: ${chosenOption}`)
    
    const isCorrect = chosenOption === this.correctAnswer
    const hostScore = this.hostScoreProp.currentValue ?? 0
    const guestScore = this.guestScoreProp.currentValue ?? 0

    if (isCorrect) {
      if (winner === 'HOST') {
        this.hostScoreProp.setPendingValue(hostScore + this.REWARD_POINTS)
      } else {
        this.guestScoreProp.setPendingValue(guestScore + this.REWARD_POINTS)
      }
      this.gameStateProp.setPendingValue('CORRECT')
    } else {
      if (winner === 'HOST') {
        this.hostScoreProp.setPendingValue(Math.max(0, hostScore - this.PENALTY_POINTS))
      } else {
        this.guestScoreProp.setPendingValue(Math.max(0, guestScore - this.PENALTY_POINTS))
      }
      this.gameStateProp.setPendingValue('INCORRECT')
    }

    this.hostBuzzedAtProp.setPendingValue('')
    this.guestBuzzedAtProp.setPendingValue('')
  }

  private setupAnswerButtons() {
    this.optionButton1?.onTriggerUp.add(() => this.checkUserAnswer(1))
    this.optionButton2?.onTriggerUp.add(() => this.checkUserAnswer(2))
    this.optionButton3?.onTriggerUp.add(() => this.checkUserAnswer(3))
    this.optionButton4?.onTriggerUp.add(() => this.checkUserAnswer(4))
  }

  private checkUserAnswer(index: number) {
    if (this.localHasAnsweredPhase) return
    if (this.gameStateProp.currentValue !== 'PLAYING') return

    this.localHasAnsweredPhase = true
    this.timerActive = false
    this.hideAnswerFeedback()

    const isCorrect = index === this.correctAnswer
    if (isCorrect) {
      if (this.correctText) this.correctText.enabled = true
      this.setStatusText('Correct! Syncing…')
    } else {
      if (this.incorrectText) this.incorrectText.enabled = true
      this.setStatusText('Incorrect! Syncing…')
    }

    const timestamp = `${Date.now()}:${index}`

    if (this.isHost) {
      this.log(`🔴 HOST buzz: ${timestamp}`)
      this.hostBuzzedAtProp.setPendingValue(timestamp)
    } else {
      this.log(`🟢 GUEST buzz: ${timestamp}`)
      this.guestBuzzedAtProp.setPendingValue(timestamp)
    }
  }

  private setupProcessButton() {
    if (!this.processButton) return

    this.processButton.onTriggerUp.add(() => {
      this.log(`⏭️ ${this.isHost ? 'HOST' : 'GUEST'} clicked NEXT`)
      this.hideAnswerFeedback()
      this.localHasAnsweredPhase = false
      this.timerActive = false
      this.localTimeRemaining = 0
      if (this.timerText) this.timerText.text = 'Waiting…'
      this.setStatusText('Waiting for opponent…')

      if (this.isHost) {
        this.hostReadyProp.setPendingValue(true)
      } else {
        this.guestReadyProp.setPendingValue(true)
      }
    })
  }

  private fetchAndSync() {
    const cloud = this.snapCloudRequirements as unknown as ISnapCloudRequirements
    if (!cloud?.isConfigured()) return

    const endpointUrl = `${cloud.getFunctionsApiUrl()}${this.functionName}`
    const payload: Record<string, string> = {}
    const obj = this.object?.trim()
    const topic = this.topic?.trim()
    if (obj) payload['object'] = obj
    if (topic) payload['topic'] = topic

    const request = RemoteServiceHttpRequest.create()
    request.url = endpointUrl
    request.headers = cloud.getSupabaseHeaders()
    request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post
    request.body = JSON.stringify(payload)

    this.setStatusText('Loading question…')

    this.internetModule.performHttpRequest(request, (response) => {
      if (response.statusCode !== 200) {
        this.setStatusText('Error loading question')
        return
      }
      try {
        const result = JSON.parse(response.body)
        if (result.ok && result.record) {
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
      this.log(`UI error: ${e}`)
    }
  }

  private hideAnswerFeedback() {
    if (this.correctText) this.correctText.enabled = false
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
    if (this.enableDebugLogs) print(`[Trivia] ${msg}`)
  }
}