"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiplayerTriviaManager = void 0;
var __selfType = requireType("./MultiplayerTriviaManager");
function component(target) {
    target.getTypeName = function () { return __selfType; };
    if (target.prototype.hasOwnProperty("getTypeName"))
        return;
    Object.defineProperty(target.prototype, "getTypeName", {
        value: function () { return __selfType; },
        configurable: true,
        writable: true
    });
}
/**
 * MultiplayerTriviaManager.ts
 *
 * FIXED: Bidirectional sync for scores and buzzer timestamps
 * Key fix: Host creates the entities as PERSISTENT so both devices sync properly
 */
const SessionController_1 = require("SpectaclesSyncKit.lspkg/Core/SessionController");
const SyncEntity_1 = require("SpectaclesSyncKit.lspkg/Core/SyncEntity");
const StorageProperty_1 = require("SpectaclesSyncKit.lspkg/Core/StorageProperty");
const StoragePropertySet_1 = require("SpectaclesSyncKit.lspkg/Core/StoragePropertySet");
var RoundPhase;
(function (RoundPhase) {
    RoundPhase["PLAYING"] = "PLAYING";
    RoundPhase["EVALUATED"] = "EVALUATED";
    RoundPhase["REVEAL_CORRECT"] = "REVEAL_CORRECT";
    RoundPhase["REVEAL_INCORRECT"] = "REVEAL_INCORRECT";
})(RoundPhase || (RoundPhase = {}));
let MultiplayerTriviaManager = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var MultiplayerTriviaManager = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.internetModule = require('LensStudio:InternetModule');
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.functionName = this.functionName;
            this.object = this.object;
            this.topic = this.topic;
            this.processButton = this.processButton;
            this.questionText = this.questionText;
            this.optionButton1 = this.optionButton1;
            this.optionButton2 = this.optionButton2;
            this.optionButton3 = this.optionButton3;
            this.optionButton4 = this.optionButton4;
            this.optionButtonChildTextName = this.optionButtonChildTextName;
            this.correctText = this.correctText;
            this.incorrectText = this.incorrectText;
            this.myScoreValueText = this.myScoreValueText;
            this.statusText = this.statusText;
            this.opponentScoreValueText = this.opponentScoreValueText;
            this.timerText = this.timerText;
            this.roundDurationSeconds = this.roundDurationSeconds;
            this.enableDebugLogs = this.enableDebugLogs;
            // ── Single Shared SyncEntity (host-owned, both can read/listen) ──────────
            this.sharedGameEntity = null;
            // ── Host-owned properties (in shared entity) ─────────────────────────────
            this.jsonQuestionProp = StorageProperty_1.StorageProperty.manualString('jsonQuestion', '');
            this.timerStartTokenProp = StorageProperty_1.StorageProperty.manualString('timerStartToken', '');
            this.roundStateProp = StorageProperty_1.StorageProperty.manualString('roundState', RoundPhase.PLAYING);
            this.currentActiveBuzzerProp = StorageProperty_1.StorageProperty.manualString('currentActiveBuzzer', 'NONE');
            this.hostScoreProp = StorageProperty_1.StorageProperty.manualInt('hostScore', 0);
            this.guestScoreProp = StorageProperty_1.StorageProperty.manualInt('guestScore', 0);
            this.hostReadyProp = StorageProperty_1.StorageProperty.manualBool('hostReady', false);
            this.guestReadyProp = StorageProperty_1.StorageProperty.manualBool('guestReady', false);
            // ── Separate entities for bidirectional buzzer sync ────────────────────
            this.hostBuzzerEntity = null;
            this.guestBuzzerEntity = null;
            this.hostBuzzedTimeProp = StorageProperty_1.StorageProperty.manualString('hostBuzzedTime', '');
            this.guestBuzzedTimeProp = StorageProperty_1.StorageProperty.manualString('guestBuzzedTime', '');
            this.correctAnswer = 0;
            this.localScore = 0;
            this.localHasAnsweredPhase = false;
            this.REWARD_POINTS = 10;
            this.PENALTY_POINTS = 5;
            this.optionTexts = [null, null, null, null];
            this.isHost = false;
            this.localPlayerId = '';
            this.localTimeRemaining = 0;
            this.timerActive = false;
        }
        __initialize() {
            super.__initialize();
            this.internetModule = require('LensStudio:InternetModule');
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.functionName = this.functionName;
            this.object = this.object;
            this.topic = this.topic;
            this.processButton = this.processButton;
            this.questionText = this.questionText;
            this.optionButton1 = this.optionButton1;
            this.optionButton2 = this.optionButton2;
            this.optionButton3 = this.optionButton3;
            this.optionButton4 = this.optionButton4;
            this.optionButtonChildTextName = this.optionButtonChildTextName;
            this.correctText = this.correctText;
            this.incorrectText = this.incorrectText;
            this.myScoreValueText = this.myScoreValueText;
            this.statusText = this.statusText;
            this.opponentScoreValueText = this.opponentScoreValueText;
            this.timerText = this.timerText;
            this.roundDurationSeconds = this.roundDurationSeconds;
            this.enableDebugLogs = this.enableDebugLogs;
            // ── Single Shared SyncEntity (host-owned, both can read/listen) ──────────
            this.sharedGameEntity = null;
            // ── Host-owned properties (in shared entity) ─────────────────────────────
            this.jsonQuestionProp = StorageProperty_1.StorageProperty.manualString('jsonQuestion', '');
            this.timerStartTokenProp = StorageProperty_1.StorageProperty.manualString('timerStartToken', '');
            this.roundStateProp = StorageProperty_1.StorageProperty.manualString('roundState', RoundPhase.PLAYING);
            this.currentActiveBuzzerProp = StorageProperty_1.StorageProperty.manualString('currentActiveBuzzer', 'NONE');
            this.hostScoreProp = StorageProperty_1.StorageProperty.manualInt('hostScore', 0);
            this.guestScoreProp = StorageProperty_1.StorageProperty.manualInt('guestScore', 0);
            this.hostReadyProp = StorageProperty_1.StorageProperty.manualBool('hostReady', false);
            this.guestReadyProp = StorageProperty_1.StorageProperty.manualBool('guestReady', false);
            // ── Separate entities for bidirectional buzzer sync ────────────────────
            this.hostBuzzerEntity = null;
            this.guestBuzzerEntity = null;
            this.hostBuzzedTimeProp = StorageProperty_1.StorageProperty.manualString('hostBuzzedTime', '');
            this.guestBuzzedTimeProp = StorageProperty_1.StorageProperty.manualString('guestBuzzedTime', '');
            this.correctAnswer = 0;
            this.localScore = 0;
            this.localHasAnsweredPhase = false;
            this.REWARD_POINTS = 10;
            this.PENALTY_POINTS = 5;
            this.optionTexts = [null, null, null, null];
            this.isHost = false;
            this.localPlayerId = '';
            this.localTimeRemaining = 0;
            this.timerActive = false;
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Lifecycle
        // ───────────────────────────────────────────────────────────────────────────
        onAwake() {
            this.cacheOptionChildTextNodes();
            this.setupAnswerButtons();
            this.hideAnswerFeedback();
            this.setStatusText('Connecting…');
            if (this.timerText)
                this.timerText.text = '';
            if (this.opponentScoreValueText)
                this.opponentScoreValueText.text = '0';
            if (this.myScoreValueText)
                this.myScoreValueText.text = '0';
            this.createEvent("UpdateEvent").bind(() => this.onUpdate());
            SessionController_1.SessionController.getInstance().notifyOnReady(() => this.onSessionReady());
        }
        onSessionReady() {
            this.log('Session ready');
            const session = SessionController_1.SessionController.getInstance();
            const localUser = session.getLocalUserInfo();
            this.localPlayerId = localUser
                ? (localUser.userId || localUser.getUserId?.())
                : 'localPlayer';
            this.isHost = session.isHost?.() || false;
            if (!this.isHost && session.getCreatorId) {
                this.isHost = (session.getCreatorId() === this.localPlayerId);
            }
            this.log(`Connected as ${this.isHost ? 'HOST' : 'GUEST'}`);
            this.setStatusText(this.isHost ? 'Host' : 'Guest');
            // ── Create shared game entity (host-owned, everyone can read) ──────────
            const gameNetworkId = { customNetworkId: 'triviaGameState', networkIdType: 'Custom' };
            this.sharedGameEntity = new SyncEntity_1.SyncEntity(this, new StoragePropertySet_1.StoragePropertySet([
                this.jsonQuestionProp,
                this.timerStartTokenProp,
                this.roundStateProp,
                this.currentActiveBuzzerProp,
                this.hostScoreProp,
                this.guestScoreProp,
                this.hostReadyProp,
                this.guestReadyProp,
            ]), true, // Always host-owned
            'Session', gameNetworkId);
            // ── Create host buzzer entity (ONLY host can write to it) ──────────────
            const hostBuzzerNetworkId = { customNetworkId: 'triviaHostBuzzer', networkIdType: 'Custom' };
            this.hostBuzzerEntity = new SyncEntity_1.SyncEntity(this, new StoragePropertySet_1.StoragePropertySet([this.hostBuzzedTimeProp]), this.isHost, // TRUE if this is host device, FALSE if guest device
            'Session', hostBuzzerNetworkId);
            // ── Create guest buzzer entity (ONLY guest can write to it) ────────────
            const guestBuzzerNetworkId = { customNetworkId: 'triviaGuestBuzzer', networkIdType: 'Custom' };
            this.guestBuzzerEntity = new SyncEntity_1.SyncEntity(this, new StoragePropertySet_1.StoragePropertySet([this.guestBuzzedTimeProp]), !this.isHost, // TRUE if this is guest device, FALSE if host device
            'Session', guestBuzzerNetworkId);
            this.log(`Created entities:`);
            this.log(`  - sharedGameEntity (host-owned)`);
            this.log(`  - hostBuzzerEntity (${this.isHost ? 'WRITABLE' : 'READ-ONLY'})`);
            this.log(`  - guestBuzzerEntity (${!this.isHost ? 'WRITABLE' : 'READ-ONLY'})`);
            this.setupPropertyListeners();
            this.setupProcessButton();
        }
        setupPropertyListeners() {
            // Question sync
            this.jsonQuestionProp.onAnyChange.add(() => {
                const rawJson = this.jsonQuestionProp.currentValue;
                if (rawJson)
                    this.parseAndApplyJson(rawJson);
            });
            // Timer start
            this.timerStartTokenProp.onAnyChange.add(() => {
                const token = this.timerStartTokenProp.currentValue ?? '';
                if (!token)
                    return;
                const duration = parseFloat(token.split(':')[0]);
                if (duration > 0) {
                    this.localTimeRemaining = duration;
                    this.timerActive = true;
                    this.log(`✓ Timer started: ${duration}s`);
                }
            });
            // CRITICAL: Both buzzer properties freeze the timer on ALL devices
            this.hostBuzzedTimeProp.onAnyChange.add(() => {
                const token = this.hostBuzzedTimeProp.currentValue;
                if (token) {
                    this.timerActive = false;
                    this.log(`✓✓ Timer FROZEN everywhere: host buzzed at ${token}`);
                }
            });
            this.guestBuzzedTimeProp.onAnyChange.add(() => {
                const token = this.guestBuzzedTimeProp.currentValue;
                if (token) {
                    this.timerActive = false;
                    this.log(`✓✓ Timer FROZEN everywhere: guest buzzed at ${token}`);
                }
            });
            // State changes
            this.roundStateProp.onAnyChange.add(() => this.handleRoundStateChange());
            this.currentActiveBuzzerProp.onAnyChange.add(() => this.handleBuzzerStateChange());
            // Ready flags (only host cares)
            this.hostReadyProp.onAnyChange.add(() => {
                if (this.isHost) {
                    this.log(`hostReady: ${this.hostReadyProp.currentValue}`);
                    this.evaluateHostQuestionFetch();
                }
            });
            this.guestReadyProp.onAnyChange.add(() => {
                if (this.isHost) {
                    this.log(`guestReady: ${this.guestReadyProp.currentValue}`);
                    this.evaluateHostQuestionFetch();
                }
            });
            // CRITICAL: Both score properties update on ALL devices
            this.hostScoreProp.onAnyChange.add(() => {
                const score = this.hostScoreProp.currentValue ?? 0;
                this.log(`✓✓ hostScore updated to ${score} on ALL devices`);
                if (this.isHost) {
                    this.localScore = score;
                    if (this.myScoreValueText)
                        this.myScoreValueText.text = String(score);
                }
                else {
                    if (this.opponentScoreValueText)
                        this.opponentScoreValueText.text = String(score);
                }
            });
            this.guestScoreProp.onAnyChange.add(() => {
                const score = this.guestScoreProp.currentValue ?? 0;
                this.log(`✓✓ guestScore updated to ${score} on ALL devices`);
                if (!this.isHost) {
                    this.localScore = score;
                    if (this.myScoreValueText)
                        this.myScoreValueText.text = String(score);
                }
                else {
                    if (this.opponentScoreValueText)
                        this.opponentScoreValueText.text = String(score);
                }
            });
        }
        handleRoundStateChange() {
            const state = this.roundStateProp.currentValue;
            this.log(`📋 Round state: ${state}`);
            if (state === RoundPhase.PLAYING) {
                // Reset on new round
            }
            else if (state === RoundPhase.EVALUATED) {
                this.log('Waiting for reveal...');
            }
            else if (state === RoundPhase.REVEAL_CORRECT) {
                this.timerActive = false;
                this.hideAnswerFeedback();
                if (this.correctText)
                    this.correctText.enabled = true;
                this.setStatusText('Correct! Round over.');
            }
            else if (state === RoundPhase.REVEAL_INCORRECT) {
                this.timerActive = false;
                this.hideAnswerFeedback();
                if (this.incorrectText)
                    this.incorrectText.enabled = true;
                this.setStatusText(`Round over. Answer was option ${this.correctAnswer}`);
            }
        }
        handleBuzzerStateChange() {
            const activeBuzzer = this.currentActiveBuzzerProp.currentValue;
            this.log(`🔔 Buzzer state: ${activeBuzzer}`);
            this.localHasAnsweredPhase = false;
            const myStealTurn = (activeBuzzer === 'HOST_ONLY' && this.isHost)
                || (activeBuzzer === 'GUEST_ONLY' && !this.isHost);
            if (activeBuzzer === 'NONE') {
                this.setStatusText('RACE! Buzz in first!');
            }
            else if (myStealTurn) {
                this.timerActive = true;
                this.setStatusText('Opponent missed! YOUR TURN to steal!');
            }
            else {
                this.timerActive = false;
                this.setStatusText('Opponent is answering…');
            }
        }
        evaluateBuzzerRaceAuthoritative() {
            if (!this.isHost)
                return;
            if (this.roundStateProp.currentValue !== RoundPhase.PLAYING)
                return;
            const hostToken = this.hostBuzzedTimeProp.currentValue || '';
            const guestToken = this.guestBuzzedTimeProp.currentValue || '';
            const activeBuzzer = this.currentActiveBuzzerProp.currentValue;
            if (activeBuzzer === 'NONE') {
                if (!hostToken && !guestToken)
                    return;
                const hostTime = hostToken ? parseInt(hostToken.split(':')[0]) : Infinity;
                const guestTime = guestToken ? parseInt(guestToken.split(':')[0]) : Infinity;
                const hostOpt = hostToken ? parseInt(hostToken.split(':')[1]) : -1;
                const guestOpt = guestToken ? parseInt(guestToken.split(':')[1]) : -1;
                this.log(`🏁 Race evaluated: host=${hostTime}, guest=${guestTime}`);
                this.roundStateProp.setPendingValue(RoundPhase.EVALUATED);
                if (hostTime <= guestTime) {
                    this.processTurnAuthoritative('HOST', hostOpt);
                }
                else {
                    this.processTurnAuthoritative('GUEST', guestOpt);
                }
            }
            else if (activeBuzzer === 'HOST_ONLY' && hostToken) {
                this.roundStateProp.setPendingValue(RoundPhase.EVALUATED);
                this.processTurnAuthoritative('HOST', parseInt(hostToken.split(':')[1]));
            }
            else if (activeBuzzer === 'GUEST_ONLY' && guestToken) {
                this.roundStateProp.setPendingValue(RoundPhase.EVALUATED);
                this.processTurnAuthoritative('GUEST', parseInt(guestToken.split(':')[1]));
            }
        }
        processTurnAuthoritative(player, chosenOption) {
            this.timerActive = false;
            const isCorrect = chosenOption === this.correctAnswer;
            const currentHostScore = this.hostScoreProp.currentValue ?? 0;
            const currentGuestScore = this.guestScoreProp.currentValue ?? 0;
            const activeBuzzer = this.currentActiveBuzzerProp.currentValue;
            this.log(`⚖️ ${player} answered option ${chosenOption} - ${isCorrect ? '✓ CORRECT' : '✗ WRONG'}`);
            if (isCorrect) {
                if (player === 'HOST') {
                    const newScore = currentHostScore + this.REWARD_POINTS;
                    this.log(`HOST score: ${currentHostScore} → ${newScore}`);
                    this.hostScoreProp.setPendingValue(newScore);
                }
                else {
                    const newScore = currentGuestScore + this.REWARD_POINTS;
                    this.log(`GUEST score: ${currentGuestScore} → ${newScore}`);
                    this.guestScoreProp.setPendingValue(newScore);
                }
                this.roundStateProp.setPendingValue(RoundPhase.REVEAL_CORRECT);
            }
            else {
                if (player === 'HOST') {
                    const newScore = Math.max(0, currentHostScore - this.PENALTY_POINTS);
                    this.log(`HOST score: ${currentHostScore} → ${newScore}`);
                    this.hostScoreProp.setPendingValue(newScore);
                }
                else {
                    const newScore = Math.max(0, currentGuestScore - this.PENALTY_POINTS);
                    this.log(`GUEST score: ${currentGuestScore} → ${newScore}`);
                    this.guestScoreProp.setPendingValue(newScore);
                }
                this.roundStateProp.setPendingValue(RoundPhase.REVEAL_INCORRECT);
                /*if (activeBuzzer === 'NONE') {
                  this.hostBuzzedTimeProp.setPendingValue('')
                  const nextTarget = (player === 'HOST') ? 'GUEST_ONLY' : 'HOST_ONLY'
                  this.currentActiveBuzzerProp.setPendingValue(nextTarget)
                } else {
                  this.roundStateProp.setPendingValue(RoundPhase.REVEAL_INCORRECT)
                }*/
            }
        }
        onUpdate() {
            if (this.isHost) {
                this.evaluateBuzzerRaceAuthoritative();
            }
            if (!this.timerActive)
                return;
            this.localTimeRemaining -= getDeltaTime();
            if (this.localTimeRemaining <= 0) {
                this.localTimeRemaining = 0;
                this.timerActive = false;
                if (this.timerText)
                    this.timerText.text = '0.0s';
                if (this.isHost) {
                    this.roundStateProp.setPendingValue(RoundPhase.REVEAL_INCORRECT);
                }
            }
            else {
                if (this.timerText)
                    this.timerText.text = this.localTimeRemaining.toFixed(1) + 's';
            }
        }
        setupAnswerButtons() {
            this.optionButton1?.onTriggerUp.add(() => this.checkUserAnswer(1));
            this.optionButton2?.onTriggerUp.add(() => this.checkUserAnswer(2));
            this.optionButton3?.onTriggerUp.add(() => this.checkUserAnswer(3));
            this.optionButton4?.onTriggerUp.add(() => this.checkUserAnswer(4));
        }
        checkUserAnswer(index) {
            if (this.localHasAnsweredPhase)
                return;
            if (this.roundStateProp.currentValue !== RoundPhase.PLAYING)
                return;
            const currentBuzzerState = this.currentActiveBuzzerProp.currentValue;
            if (currentBuzzerState === 'GUEST_ONLY' && this.isHost)
                return;
            if (currentBuzzerState === 'HOST_ONLY' && !this.isHost)
                return;
            this.localHasAnsweredPhase = true;
            this.timerActive = false;
            this.hideAnswerFeedback();
            const isCorrect = index === this.correctAnswer;
            if (isCorrect) {
                if (this.correctText)
                    this.correctText.enabled = true;
                this.setStatusText('Correct! Syncing…');
            }
            else {
                if (this.incorrectText)
                    this.incorrectText.enabled = true;
                this.setStatusText(currentBuzzerState === 'NONE'
                    ? 'Incorrect! Passing turn…'
                    : 'Incorrect! Round over.');
            }
            const timestampStr = `${Date.now()}:${index}`;
            if (this.isHost) {
                this.log(`🔵 HOST BUZZ: Writing ${timestampStr}`);
                this.hostBuzzedTimeProp.setPendingValue(timestampStr);
            }
            else {
                this.log(`🔴 GUEST BUZZ: Writing ${timestampStr}`);
                this.guestBuzzedTimeProp.setPendingValue(timestampStr);
            }
        }
        setupProcessButton() {
            if (!this.processButton)
                return;
            this.processButton.onTriggerUp.add(() => {
                this.log(`⏭️ ${this.isHost ? 'HOST' : 'GUEST'} pressed NEXT`);
                this.hideAnswerFeedback();
                this.localHasAnsweredPhase = false;
                this.timerActive = false;
                this.localTimeRemaining = 0;
                if (this.timerText)
                    this.timerText.text = 'Waiting…';
                if (this.isHost) {
                    this.hostBuzzedTimeProp.setPendingValue('');
                    this.hostReadyProp.setPendingValue(true);
                }
                else {
                    this.guestBuzzedTimeProp.setPendingValue('');
                    this.guestReadyProp.setPendingValue(true);
                }
                this.setStatusText('Waiting for opponent…');
            });
        }
        evaluateHostQuestionFetch() {
            if (!this.isHost)
                return;
            const hostReady = this.hostReadyProp.currentValue ?? false;
            const guestReady = this.guestReadyProp.currentValue ?? false;
            this.log(`📊 Ready check: host=${hostReady}, guest=${guestReady}`);
            const session = SessionController_1.SessionController.getInstance();
            const currentUsers = session.getUsers?.() || session.getConnectedUsers?.() || [];
            let hasRemoteOpponent = false;
            for (let i = 0; i < currentUsers.length; i++) {
                const u = currentUsers[i];
                if (u && (u.userId || u.getUserId?.()) !== this.localPlayerId) {
                    hasRemoteOpponent = true;
                    break;
                }
            }
            const roomIsReady = hasRemoteOpponent ? (hostReady && guestReady) : hostReady;
            if (roomIsReady) {
                this.log('🎯 BOTH READY! Fetching new question...');
                this.hostReadyProp.setPendingValue(false);
                this.guestReadyProp.setPendingValue(false);
                this.hostBuzzedTimeProp.setPendingValue('');
                this.guestBuzzedTimeProp.setPendingValue('');
                this.currentActiveBuzzerProp.setPendingValue('NONE');
                this.roundStateProp.setPendingValue(RoundPhase.PLAYING);
                this.fetchAndSync();
            }
        }
        fetchAndSync() {
            const cloud = this.snapCloudRequirements;
            if (!cloud?.isConfigured())
                return;
            const endpointUrl = `${cloud.getFunctionsApiUrl()}${this.functionName}`;
            const payload = {};
            const obj = this.object?.trim();
            const topic = this.topic?.trim();
            if (obj)
                payload['object'] = obj;
            if (topic)
                payload['topic'] = topic;
            const request = RemoteServiceHttpRequest.create();
            request.url = endpointUrl;
            request.headers = cloud.getSupabaseHeaders();
            request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post;
            request.body = JSON.stringify(payload);
            this.setStatusText('Loading question…');
            this.internetModule.performHttpRequest(request, (response) => {
                if (response.statusCode !== 200) {
                    this.setStatusText('Error loading question');
                    return;
                }
                try {
                    const result = JSON.parse(response.body);
                    if (result.ok === true && result.record) {
                        this.jsonQuestionProp.setPendingValue(JSON.stringify(result.record));
                        this.timerStartTokenProp.setPendingValue(`${this.roundDurationSeconds}:${Date.now()}`);
                    }
                }
                catch (e) {
                    this.log(`Parse error: ${e}`);
                }
            });
        }
        parseAndApplyJson(jsonStr) {
            try {
                const record = JSON.parse(jsonStr);
                this.correctAnswer = Number(record.answer ?? 0);
                if (this.questionText)
                    this.questionText.text = String(record.question ?? '');
                this.setOptionText(0, String(record.option1 ?? ''));
                this.setOptionText(1, String(record.option2 ?? ''));
                this.setOptionText(2, String(record.option3 ?? ''));
                this.setOptionText(3, String(record.option4 ?? ''));
                this.localHasAnsweredPhase = false;
                this.hideAnswerFeedback();
            }
            catch (e) {
                this.log(`UI render error: ${e}`);
            }
        }
        hideAnswerFeedback() {
            if (this.correctText)
                this.correctText.enabled = false;
            if (this.incorrectText)
                this.incorrectText.enabled = false;
        }
        setStatusText(msg) {
            if (this.statusText)
                this.statusText.text = msg;
            this.log(msg);
        }
        cacheOptionChildTextNodes() {
            this.optionTexts[0] = this.findButtonChildText(this.optionButton1);
            this.optionTexts[1] = this.findButtonChildText(this.optionButton2);
            this.optionTexts[2] = this.findButtonChildText(this.optionButton3);
            this.optionTexts[3] = this.findButtonChildText(this.optionButton4);
        }
        findButtonChildText(btn) {
            if (!btn)
                return null;
            const root = btn.getSceneObject();
            if (!root)
                return null;
            if (this.optionButtonChildTextName?.length > 0) {
                const named = this.findChildByNameRecursive(root, this.optionButtonChildTextName);
                if (named) {
                    const t = named.getComponent('Text');
                    if (t)
                        return t;
                }
            }
            return this.findFirstTextInDescendants(root);
        }
        findChildByNameRecursive(root, name) {
            if (root.name === name)
                return root;
            const count = root.getChildrenCount();
            for (let i = 0; i < count; i++) {
                const child = root.getChild(i);
                if (!child)
                    continue;
                if (child.name === name)
                    return child;
                const deeper = this.findChildByNameRecursive(child, name);
                if (deeper)
                    return deeper;
            }
            return null;
        }
        findFirstTextInDescendants(root) {
            const rootText = root.getComponent('Text');
            if (rootText)
                return rootText;
            const count = root.getChildrenCount();
            for (let i = 0; i < count; i++) {
                const child = root.getChild(i);
                if (!child)
                    continue;
                const t = child.getComponent('Text');
                if (t)
                    return t;
                const deeper = this.findFirstTextInDescendants(child);
                if (deeper)
                    return deeper;
            }
            return null;
        }
        setOptionText(index, value) {
            const t = this.optionTexts[index];
            if (t)
                t.text = value;
        }
        log(msg) {
            if (this.enableDebugLogs)
                print(`[Trivia] ${msg}`);
        }
    };
    __setFunctionName(_classThis, "MultiplayerTriviaManager");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MultiplayerTriviaManager = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MultiplayerTriviaManager = _classThis;
})();
exports.MultiplayerTriviaManager = MultiplayerTriviaManager;
//# sourceMappingURL=MultiplayerTriviaManager.js.map