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
 * Full Production Script - Fixed Host Freeze & Restored Guest Sync via Native Messaging.
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
            this.globalSyncEntity = null;
            // ── Synced Network Properties (Controlled Strictly By Host) ──────────────────
            this.jsonQuestionProp = StorageProperty_1.StorageProperty.manualString('jsonQuestion', '');
            this.timerStartTokenProp = StorageProperty_1.StorageProperty.manualString('timerStartToken', '');
            // ── Local State ────────────────────────────────────────────────────────────
            this.correctAnswer = 0;
            this.localScore = 0;
            this.hasAnsweredThisRound = false;
            this.correctAnswerSelected = false;
            this.POINTS = 10;
            this.optionTexts = [null, null, null, null];
            this.isHost = false;
            this.localPlayerId = '';
            this.opponentPlayerId = '';
            this.localTimeRemaining = 0;
            this.timerActive = false;
            // Ready tracking via simple message passing
            this.hostIsReady = false;
            this.guestIsReady = false;
            // Message Message IDs
            this.MSG_SCORE_UPDATE = 'TRIVIA_SCORE_UPDATE';
            this.MSG_READY_UP = 'TRIVIA_READY_UP';
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
            this.globalSyncEntity = null;
            // ── Synced Network Properties (Controlled Strictly By Host) ──────────────────
            this.jsonQuestionProp = StorageProperty_1.StorageProperty.manualString('jsonQuestion', '');
            this.timerStartTokenProp = StorageProperty_1.StorageProperty.manualString('timerStartToken', '');
            // ── Local State ────────────────────────────────────────────────────────────
            this.correctAnswer = 0;
            this.localScore = 0;
            this.hasAnsweredThisRound = false;
            this.correctAnswerSelected = false;
            this.POINTS = 10;
            this.optionTexts = [null, null, null, null];
            this.isHost = false;
            this.localPlayerId = '';
            this.opponentPlayerId = '';
            this.localTimeRemaining = 0;
            this.timerActive = false;
            // Ready tracking via simple message passing
            this.hostIsReady = false;
            this.guestIsReady = false;
            // Message Message IDs
            this.MSG_SCORE_UPDATE = 'TRIVIA_SCORE_UPDATE';
            this.MSG_READY_UP = 'TRIVIA_READY_UP';
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
            // 1. Core Global Room Entity
            const globalId = { customNetworkId: 'triviaGlobalRoomChannelPure', networkIdType: 'Custom' };
            this.globalSyncEntity = new SyncEntity_1.SyncEntity(this, new StoragePropertySet_1.StoragePropertySet([this.jsonQuestionProp, this.timerStartTokenProp]), true, 'Session', globalId);
            // 2. FIX: Native cross-talk Message Handlers (Completely replaces unstable Store logic)
            if (session.onMessageReceived) {
                session.onMessageReceived.add((messageId, senderId, payload) => {
                    this.handleIncomingNetworkMessage(messageId, senderId, payload);
                });
            }
            // Question updating logic
            this.jsonQuestionProp.onAnyChange.add(() => {
                const rawJson = this.jsonQuestionProp.currentValue;
                if (rawJson)
                    this.parseAndApplyJson(rawJson);
            });
            // Countdown clock sync
            this.timerStartTokenProp.onAnyChange.add(() => {
                const token = this.timerStartTokenProp.currentValue ?? '';
                if (!token || token === 'RESET') {
                    this.clearRoundUIForNextTurn();
                    return;
                }
                const duration = parseFloat(token.split(':')[0]);
                if (duration > 0) {
                    this.localTimeRemaining = duration;
                    this.timerActive = true;
                    this.log(`Timer started: ${duration}s`);
                }
            });
            this.setupProcessButton();
            this.globalSyncEntity.notifyOnReady(() => {
                this.log('Network layers stabilized.');
                this.discoverPlayers();
                const initialJson = this.jsonQuestionProp.currentValue;
                if (initialJson)
                    this.parseAndApplyJson(initialJson);
            });
        }
        // ─── Player Mapping Engine ─────────────────────────────────────────────────
        discoverPlayers() {
            const session = SessionController_1.SessionController.getInstance();
            const currentUsers = session.getUsers?.() || session.getConnectedUsers?.() || [];
            for (let i = 0; i < currentUsers.length; i++) {
                const u = currentUsers[i];
                if (u) {
                    const id = u.userId || u.getUserId?.();
                    if (id && id !== this.localPlayerId) {
                        this.opponentPlayerId = id;
                        this.log(`Opponent parsed into active memory: ${this.opponentPlayerId}`);
                        break;
                    }
                }
            }
        }
        // ─── Native Message Processors ─────────────────────────────────────────────
        handleIncomingNetworkMessage(messageId, senderId, payload) {
            if (senderId === this.localPlayerId)
                return; // Skip self mirror packets
            this.log(`Network Message Incoming -> ID: ${messageId} | From: ${senderId} | Data: ${payload}`);
            if (messageId === this.MSG_SCORE_UPDATE) {
                if (this.opponentScoreValueText) {
                    this.opponentScoreValueText.text = payload;
                }
            }
            if (messageId === this.MSG_READY_UP) {
                if (this.isHost) {
                    this.guestIsReady = (payload === 'true');
                    this.evaluateReadyUpRules();
                }
            }
        }
        evaluateReadyUpRules() {
            if (!this.isHost)
                return;
            if (!this.opponentPlayerId)
                this.discoverPlayers();
            this.log(`Host Rule Evaluation -> Local Host Ready: ${this.hostIsReady}, Remote Guest Ready: ${this.guestIsReady}`);
            const roomIsReady = this.opponentPlayerId ? (this.hostIsReady && this.guestIsReady) : this.hostIsReady;
            if (roomIsReady) {
                this.log('Both players flagged as ready. Requesting next data payload...');
                this.hostIsReady = false;
                this.guestIsReady = false;
                this.fetchAndSync();
            }
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
                this.onRoundTimerExpired();
            }
            else {
                if (this.timerText) {
                    this.timerText.text = this.localTimeRemaining.toFixed(1) + 's';
                }
            }
        }
        onRoundTimerExpired() {
            this.log('Round complete.');
            if (!this.correctAnswerSelected) {
                if (this.incorrectText)
                    this.incorrectText.enabled = true;
            }
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Buttons & Answer Logic
        // ───────────────────────────────────────────────────────────────────────────
        setupProcessButton() {
            if (!this.processButton)
                return;
            this.processButton.onTriggerUp.add(() => {
                this.log('Process button triggered.');
                const session = SessionController_1.SessionController.getInstance();
                if (this.isHost) {
                    // Host cleanly resets room layout via network property
                    this.timerStartTokenProp.setPendingValue('RESET');
                    this.hostIsReady = true;
                    this.setStatusText('Waiting for players...');
                    this.evaluateReadyUpRules();
                }
                else {
                    // Guest cleans local UI and instantly drops a native message directly to Host
                    this.clearRoundUIForNextTurn();
                    if (session.sendMessage) {
                        session.sendMessage(this.MSG_READY_UP, 'true');
                    }
                    this.setStatusText('Waiting for host...');
                }
            });
        }
        clearRoundUIForNextTurn() {
            this.hideAnswerFeedback();
            this.resetAnswerState();
            this.timerActive = false;
            this.localTimeRemaining = 0;
            if (this.timerText)
                this.timerText.text = 'Waiting...';
        }
        setupAnswerButtons() {
            this.optionButton1?.onTriggerUp.add(() => this.checkUserAnswer(1));
            this.optionButton2?.onTriggerUp.add(() => this.checkUserAnswer(2));
            this.optionButton3?.onTriggerUp.add(() => this.checkUserAnswer(3));
            this.optionButton4?.onTriggerUp.add(() => this.checkUserAnswer(4));
        }
        checkUserAnswer(index) {
            if (!this.timerActive && this.localTimeRemaining <= 0)
                return;
            if (this.hasAnsweredThisRound)
                return;
            const isCorrect = index === this.correctAnswer;
            if (isCorrect) {
                this.correctAnswerSelected = true;
                this.hasAnsweredThisRound = true;
                if (this.correctText)
                    this.correctText.enabled = true;
                if (this.incorrectText)
                    this.incorrectText.enabled = false;
                this.localScore += this.POINTS;
                this.syncScoreToNetwork();
            }
            else {
                if (this.incorrectText)
                    this.incorrectText.enabled = true;
                if (this.correctText)
                    this.correctText.enabled = false;
            }
        }
        syncScoreToNetwork() {
            this.log(`Syncing current player score via messaging pipeline: ${this.localScore}`);
            // Update local display immediately
            if (this.myScoreValueText)
                this.myScoreValueText.text = String(this.localScore);
            // Broadcast raw text score change to everyone else over completely open communications channel
            const session = SessionController_1.SessionController.getInstance();
            if (session.sendMessage) {
                session.sendMessage(this.MSG_SCORE_UPDATE, String(this.localScore));
            }
        }
        // ─── Supabase Fetch ────────────────────────────────────────────────────────
        fetchAndSync() {
            const cloud = this.snapCloudRequirements;
            if (!cloud?.isConfigured()) {
                this.log('SnapCloudRequirements not configured');
                return;
            }
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
                    this.log(`Edge Function error: ${response.body}`);
                    this.setStatusText('Error loading question');
                    return;
                }
                this.handleEdgeFunctionResponse(response.body);
            });
        }
        handleEdgeFunctionResponse(body) {
            try {
                const result = JSON.parse(body);
                if (result.ok !== true || !result.record)
                    return;
                const r = result.record;
                this.jsonQuestionProp.setPendingValue(JSON.stringify(r));
                this.timerStartTokenProp.setPendingValue(`${this.roundDurationSeconds}:${Date.now()}`);
            }
            catch (e) {
                this.log(`Data normalization fault: ${e}`);
            }
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
                this.resetAnswerState();
                this.hideAnswerFeedback();
                this.setStatusText(this.isHost ? 'Host' : 'Player');
            }
            catch (e) {
                this.log(`UI data rendering fault: ${e}`);
            }
        }
        resetAnswerState() {
            this.hasAnsweredThisRound = false;
            this.correctAnswerSelected = false;
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