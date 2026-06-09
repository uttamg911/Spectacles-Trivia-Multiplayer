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
 * Rewritten for Fast-Buzzer Racing Mechanics:
 * - Compete to answer first; faster player gets priority.
 * - Correct answer ends round immediately + gains points.
 * - Incorrect answer incurs a point penalty + unlocks the question for the opponent.
 * - Global synchronization managed cleanly via SyncEntity channels.
 */
const SessionController_1 = require("SpectaclesSyncKit.lspkg/Core/SessionController");
const SyncEntity_1 = require("SpectaclesSyncKit.lspkg/Core/SyncEntity");
const StorageProperty_1 = require("SpectaclesSyncKit.lspkg/Core/StorageProperty");
const StoragePropertySet_1 = require("SpectaclesSyncKit.lspkg/Core/StoragePropertySet");
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
            // ── Supabase Configuration ──────────────────────────────────────────────────
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.functionName = this.functionName;
            this.object = this.object;
            this.topic = this.topic;
            // ── Core UI Connections ─────────────────────────────────────────────────────
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
            // ── Scoreboard, Timer & Ready States ────────────────────────────────────────
            this.opponentScoreValueText = this.opponentScoreValueText;
            this.timerText = this.timerText;
            this.roundDurationSeconds = this.roundDurationSeconds;
            this.enableDebugLogs = this.enableDebugLogs;
            // ── Core Sync Kit State Stores ──────────────────────────────────────────────
            this.gameSyncEntity = null;
            this.hostDataSyncEntity = null;
            this.guestDataSyncEntity = null;
            // ── Synced Network Properties (Global Room State) ───────────────────────────
            this.jsonQuestionProp = StorageProperty_1.StorageProperty.manualString('jsonQuestion', '');
            this.timerStartTokenProp = StorageProperty_1.StorageProperty.manualString('timerStartToken', '');
            // States: "PLAYING", "REVEAL_CORRECT", "REVEAL_INCORRECT", "PASSED_TO_OPPONENT"
            this.roundStateProp = StorageProperty_1.StorageProperty.manualString('roundState', 'PLAYING');
            this.currentActiveBuzzerProp = StorageProperty_1.StorageProperty.manualString('currentActiveBuzzer', 'NONE');
            // ── Network Properties (Host Exclusive Data) ───────────────────────────────
            this.hostScoreProp = StorageProperty_1.StorageProperty.manualInt('hostScore', 0);
            this.hostReadyProp = StorageProperty_1.StorageProperty.manualBool('hostReady', false);
            this.hostBuzzedTimeProp = StorageProperty_1.StorageProperty.manualString('hostBuzzedTime', ''); // "timestamp:optionIndex"
            // ── Network Properties (Guest Exclusive Data) ──────────────────────────────
            this.guestScoreProp = StorageProperty_1.StorageProperty.manualInt('guestScore', 0);
            this.guestReadyProp = StorageProperty_1.StorageProperty.manualBool('guestReady', false);
            this.guestBuzzedTimeProp = StorageProperty_1.StorageProperty.manualString('guestBuzzedTime', ''); // "timestamp:optionIndex"
            // ── Local State ────────────────────────────────────────────────────────────
            this.correctAnswer = 0;
            this.localScore = 0;
            this.hasBuzzedThisRound = false;
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
            // ── Supabase Configuration ──────────────────────────────────────────────────
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.functionName = this.functionName;
            this.object = this.object;
            this.topic = this.topic;
            // ── Core UI Connections ─────────────────────────────────────────────────────
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
            // ── Scoreboard, Timer & Ready States ────────────────────────────────────────
            this.opponentScoreValueText = this.opponentScoreValueText;
            this.timerText = this.timerText;
            this.roundDurationSeconds = this.roundDurationSeconds;
            this.enableDebugLogs = this.enableDebugLogs;
            // ── Core Sync Kit State Stores ──────────────────────────────────────────────
            this.gameSyncEntity = null;
            this.hostDataSyncEntity = null;
            this.guestDataSyncEntity = null;
            // ── Synced Network Properties (Global Room State) ───────────────────────────
            this.jsonQuestionProp = StorageProperty_1.StorageProperty.manualString('jsonQuestion', '');
            this.timerStartTokenProp = StorageProperty_1.StorageProperty.manualString('timerStartToken', '');
            // States: "PLAYING", "REVEAL_CORRECT", "REVEAL_INCORRECT", "PASSED_TO_OPPONENT"
            this.roundStateProp = StorageProperty_1.StorageProperty.manualString('roundState', 'PLAYING');
            this.currentActiveBuzzerProp = StorageProperty_1.StorageProperty.manualString('currentActiveBuzzer', 'NONE');
            // ── Network Properties (Host Exclusive Data) ───────────────────────────────
            this.hostScoreProp = StorageProperty_1.StorageProperty.manualInt('hostScore', 0);
            this.hostReadyProp = StorageProperty_1.StorageProperty.manualBool('hostReady', false);
            this.hostBuzzedTimeProp = StorageProperty_1.StorageProperty.manualString('hostBuzzedTime', ''); // "timestamp:optionIndex"
            // ── Network Properties (Guest Exclusive Data) ──────────────────────────────
            this.guestScoreProp = StorageProperty_1.StorageProperty.manualInt('guestScore', 0);
            this.guestReadyProp = StorageProperty_1.StorageProperty.manualBool('guestReady', false);
            this.guestBuzzedTimeProp = StorageProperty_1.StorageProperty.manualString('guestBuzzedTime', ''); // "timestamp:optionIndex"
            // ── Local State ────────────────────────────────────────────────────────────
            this.correctAnswer = 0;
            this.localScore = 0;
            this.hasBuzzedThisRound = false;
            this.REWARD_POINTS = 10;
            this.PENALTY_POINTS = 5;
            this.optionTexts = [null, null, null, null];
            this.isHost = false;
            this.localPlayerId = '';
            this.localTimeRemaining = 0;
            this.timerActive = false;
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Lifecycle & Initialization
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
            this.log('Session connection established');
            const session = SessionController_1.SessionController.getInstance();
            const localUser = session.getLocalUserInfo();
            this.localPlayerId = localUser ? (localUser.userId || localUser.getUserId?.()) : 'localPlayer';
            this.isHost = session.isHost?.() || false;
            if (!this.isHost && session.getCreatorId) {
                this.isHost = (session.getCreatorId() === this.localPlayerId);
            }
            this.setStatusText(this.isHost ? 'Host' : 'Player/Guest');
            // 1. Shared Global Room Configuration
            const gameNetworkId = { customNetworkId: 'triviaGlobalUnifiedState', networkIdType: 'Custom' };
            this.gameSyncEntity = new SyncEntity_1.SyncEntity(this, new StoragePropertySet_1.StoragePropertySet([this.jsonQuestionProp, this.timerStartTokenProp, this.roundStateProp, this.currentActiveBuzzerProp]), true, 'Session', gameNetworkId);
            // 2. Separate Write Authority Channels
            const hostNetworkId = { customNetworkId: 'triviaHostExclusiveState', networkIdType: 'Custom' };
            const guestNetworkId = { customNetworkId: 'triviaGuestExclusiveState', networkIdType: 'Custom' };
            this.hostDataSyncEntity = new SyncEntity_1.SyncEntity(this, new StoragePropertySet_1.StoragePropertySet([this.hostScoreProp, this.hostReadyProp, this.hostBuzzedTimeProp]), this.isHost, 'Session', hostNetworkId);
            this.guestDataSyncEntity = new SyncEntity_1.SyncEntity(this, new StoragePropertySet_1.StoragePropertySet([this.guestScoreProp, this.guestReadyProp, this.guestBuzzedTimeProp]), !this.isHost, 'Session', guestNetworkId);
            this.setupScoreboardCrossTalk();
            // Question syncing
            this.jsonQuestionProp.onAnyChange.add(() => {
                const rawJson = this.jsonQuestionProp.currentValue;
                if (rawJson)
                    this.parseAndApplyJson(rawJson);
            });
            // Timer sync
            this.timerStartTokenProp.onAnyChange.add(() => {
                const token = this.timerStartTokenProp.currentValue ?? '';
                if (!token)
                    return;
                const duration = parseFloat(token.split(':')[0]);
                if (duration > 0) {
                    this.localTimeRemaining = duration;
                    this.timerActive = true;
                }
            });
            // Listen to gameplay state loops updates
            this.roundStateProp.onAnyChange.add(() => this.handleRoundStateChange());
            this.currentActiveBuzzerProp.onAnyChange.add(() => this.handleBuzzerStateChange());
            // Host watches incoming race timestamps
            if (this.isHost) {
                this.hostBuzzedTimeProp.onAnyChange.add(() => this.evaluateBuzzerRace());
                this.guestBuzzedTimeProp.onAnyChange.add(() => this.evaluateBuzzerRace());
            }
            this.hostReadyProp.onAnyChange.add(() => this.evaluateHostQuestionFetch());
            this.guestReadyProp.onAnyChange.add(() => this.evaluateHostQuestionFetch());
            this.setupProcessButton();
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Gameplay State Management Matrix
        // ───────────────────────────────────────────────────────────────────────────
        handleRoundStateChange() {
            const state = this.roundStateProp.currentValue;
            this.hideAnswerFeedback();
            if (state === 'REVEAL_CORRECT') {
                this.timerActive = false;
                if (this.correctText)
                    this.correctText.enabled = true;
                this.setStatusText("Round Over! Correct answer guessed.");
            }
            else if (state === 'REVEAL_INCORRECT') {
                this.timerActive = false;
                if (this.incorrectText)
                    this.incorrectText.enabled = true;
                this.setStatusText(`Incorrect! The right answer was option ${this.correctAnswer}`);
            }
        }
        handleBuzzerStateChange() {
            const activeBuzzer = this.currentActiveBuzzerProp.currentValue;
            const iamHostAndActive = (activeBuzzer === 'HOST' && this.isHost);
            const iamGuestAndActive = (activeBuzzer === 'GUEST' && !this.isHost);
            if (activeBuzzer === 'NONE') {
                this.setStatusText(this.isHost ? "Host" : "Guest");
            }
            else if (iamHostAndActive || iamGuestAndActive) {
                this.setStatusText("YOUR TURN! Choose your answer quickly!");
            }
            else {
                this.setStatusText("Opponent is answering... locked out.");
            }
        }
        evaluateBuzzerRace() {
            if (!this.isHost)
                return;
            const currentState = this.roundStateProp.currentValue;
            // Extract submission structures
            const hostToken = this.hostBuzzedTimeProp.currentValue || '';
            const guestToken = this.guestBuzzedTimeProp.currentValue || '';
            if (!hostToken && !guestToken)
                return;
            const hostTime = hostToken ? parseInt(hostToken.split(':')[0]) : Infinity;
            const guestTime = guestToken ? parseInt(guestToken.split(':')[0]) : Infinity;
            const hostOpt = hostToken ? parseInt(hostToken.split(':')[1]) : -1;
            const guestOpt = guestToken ? parseInt(guestToken.split(':')[1]) : -1;
            // ── SCENARIO A: Fresh Question Race (No turns taken yet)
            if (this.currentActiveBuzzerProp.currentValue === 'NONE' && currentState === 'PLAYING') {
                if (hostTime < guestTime) {
                    this.processTurnAuthoritative('HOST', hostOpt);
                }
                else {
                    this.processTurnAuthoritative('GUEST', guestOpt);
                }
            }
            // ── SCENARIO B: Turn Handed Over to Back-up Player
            else if (this.currentActiveBuzzerProp.currentValue === 'PASSED_TO_HOST' && hostToken) {
                this.processTurnAuthoritative('HOST', hostOpt);
            }
            else if (this.currentActiveBuzzerProp.currentValue === 'PASSED_TO_GUEST' && guestToken) {
                this.processTurnAuthoritative('GUEST', guestOpt);
            }
        }
        processTurnAuthoritative(player, chosenOption) {
            const isCorrect = chosenOption === this.correctAnswer;
            const currentHostScore = this.hostScoreProp.currentValue ?? 0;
            const currentGuestScore = this.guestScoreProp.currentValue ?? 0;
            if (isCorrect) {
                // Reward points, end round immediately
                if (player === 'HOST') {
                    this.hostScoreProp.setPendingValue(currentHostScore + this.REWARD_POINTS);
                }
                else {
                    this.guestScoreProp.setPendingValue(currentGuestScore + this.REWARD_POINTS);
                }
                this.roundStateProp.setPendingValue('REVEAL_CORRECT');
            }
            else {
                // Deduct points for incorrect answers
                if (player === 'HOST') {
                    this.hostScoreProp.setPendingValue(Math.max(0, currentHostScore - this.PENALTY_POINTS));
                }
                else {
                    this.guestScoreProp.setPendingValue(Math.max(0, currentGuestScore - this.PENALTY_POINTS));
                }
                // If this was the *first* mistake of the round, offer the question to the opponent
                if (this.currentActiveBuzzerProp.currentValue === 'NONE') {
                    const nextTarget = (player === 'HOST') ? 'PASSED_TO_GUEST' : 'PASSED_TO_HOST';
                    this.currentActiveBuzzerProp.setPendingValue(nextTarget);
                }
                else {
                    // Both players failed or time expired
                    this.roundStateProp.setPendingValue('REVEAL_INCORRECT');
                }
            }
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Scoreboard Alignment Cross-talk
        // ───────────────────────────────────────────────────────────────────────────
        setupScoreboardCrossTalk() {
            this.hostScoreProp.onAnyChange.add(() => {
                const score = this.hostScoreProp.currentValue ?? 0;
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
        // ───────────────────────────────────────────────────────────────────────────
        // Frame Update Loop
        // ───────────────────────────────────────────────────────────────────────────
        onUpdate() {
            if (!this.timerActive)
                return;
            this.localTimeRemaining -= getDeltaTime();
            if (this.localTimeRemaining <= 0) {
                this.localTimeRemaining = 0;
                this.timerActive = false;
                if (this.timerText)
                    this.timerText.text = '0.0s';
                if (this.isHost) {
                    this.roundStateProp.setPendingValue('REVEAL_INCORRECT');
                }
            }
            else {
                if (this.timerText) {
                    this.timerText.text = this.localTimeRemaining.toFixed(1) + 's';
                }
            }
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Input Handling: Buzzer Interaction
        // ───────────────────────────────────────────────────────────────────────────
        setupAnswerButtons() {
            this.optionButton1?.onTriggerUp.add(() => this.checkUserAnswer(1));
            this.optionButton2?.onTriggerUp.add(() => this.checkUserAnswer(2));
            this.optionButton3?.onTriggerUp.add(() => this.checkUserAnswer(3));
            this.optionButton4?.onTriggerUp.add(() => this.checkUserAnswer(4));
        }
        checkUserAnswer(index) {
            if (!this.timerActive || this.hasBuzzedThisRound)
                return;
            const currentBuzzerState = this.currentActiveBuzzerProp.currentValue;
            // Safety check: Lock player out if opponent is handed exclusive pass window
            if (currentBuzzerState === 'PASSED_TO_GUEST' && this.isHost)
                return;
            if (currentBuzzerState === 'PASSED_TO_HOST' && !this.isHost)
                return;
            this.hasBuzzedThisRound = true;
            const timestampStr = `${Date.now()}:${index}`;
            if (this.isHost) {
                this.hostBuzzedTimeProp.setPendingValue(timestampStr);
            }
            else {
                this.guestBuzzedTimeProp.setPendingValue(timestampStr);
            }
            this.setStatusText("Buzzed! Validating entry processing...");
        }
        setupProcessButton() {
            if (!this.processButton)
                return;
            this.processButton.onTriggerUp.add(() => {
                this.hideAnswerFeedback();
                this.hasBuzzedThisRound = false;
                this.timerActive = false;
                this.localTimeRemaining = 0;
                if (this.timerText)
                    this.timerText.text = 'Waiting...';
                if (this.isHost) {
                    this.hostReadyProp.setPendingValue(true);
                }
                else {
                    this.guestReadyProp.setPendingValue(true);
                }
                this.setStatusText('Waiting for players...');
            });
        }
        evaluateHostQuestionFetch() {
            if (!this.isHost)
                return;
            const hostReady = this.hostReadyProp.currentValue ?? false;
            const guestReady = this.guestReadyProp.currentValue ?? false;
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
                this.hostReadyProp.setPendingValue(false);
                this.guestReadyProp.setPendingValue(false);
                // Flush matching metrics reset
                this.hostBuzzedTimeProp.setPendingValue('');
                this.guestBuzzedTimeProp.setPendingValue('');
                this.currentActiveBuzzerProp.setPendingValue('NONE');
                this.roundStateProp.setPendingValue('PLAYING');
                this.fetchAndSync();
            }
        }
        // ─── Supabase Fetch ────────────────────────────────────────────────────────
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
                    this.log(`Data parsing fault: ${e}`);
                }
            });
        }
        // ─── UI Helpers ────────────────────────────────────────────────────────────
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
                this.hasBuzzedThisRound = false;
                this.hideAnswerFeedback();
            }
            catch (e) {
                this.log(`UI data rendering fault: ${e}`);
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
        // ─── Text Component Traversal ──────────────────────────────────────────────
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
                print(`[MultiplayerTriviaManager] ${msg}`);
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