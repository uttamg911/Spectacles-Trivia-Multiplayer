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
 * Full Production Script - Fixed Ready States, Scoreboards, and Timer Desyncs.
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
            this.hostPlayerSyncEntity = null;
            this.guestPlayerSyncEntity = null;
            // ── Synced Network Properties ──────────────────────────────────────────────
            this.jsonQuestionProp = StorageProperty_1.StorageProperty.manualString('jsonQuestion', '');
            this.timerEndServerTimeProp = StorageProperty_1.StorageProperty.manualFloat('timerEndServerTime', 0.0);
            // Explicit global paths for the two designated player slots
            this.hostScoreProp = StorageProperty_1.StorageProperty.manualInt('hostScore', 0);
            this.hostReadyProp = StorageProperty_1.StorageProperty.manualBool('hostReady', false);
            this.guestScoreProp = StorageProperty_1.StorageProperty.manualInt('guestScore', 0);
            this.guestReadyProp = StorageProperty_1.StorageProperty.manualBool('guestReady', false);
            // ── Local Simulation Variables ─────────────────────────────────────────────
            this.correctAnswer = 0;
            this.localScore = 0;
            this.doOnce = true;
            this.correctAnswerSelected = false;
            this.POINTS = 10;
            this.optionTexts = [null, null, null, null];
            this.isHost = false;
            this.localPlayerId = '';
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
            this.hostPlayerSyncEntity = null;
            this.guestPlayerSyncEntity = null;
            // ── Synced Network Properties ──────────────────────────────────────────────
            this.jsonQuestionProp = StorageProperty_1.StorageProperty.manualString('jsonQuestion', '');
            this.timerEndServerTimeProp = StorageProperty_1.StorageProperty.manualFloat('timerEndServerTime', 0.0);
            // Explicit global paths for the two designated player slots
            this.hostScoreProp = StorageProperty_1.StorageProperty.manualInt('hostScore', 0);
            this.hostReadyProp = StorageProperty_1.StorageProperty.manualBool('hostReady', false);
            this.guestScoreProp = StorageProperty_1.StorageProperty.manualInt('guestScore', 0);
            this.guestReadyProp = StorageProperty_1.StorageProperty.manualBool('guestReady', false);
            // ── Local Simulation Variables ─────────────────────────────────────────────
            this.correctAnswer = 0;
            this.localScore = 0;
            this.doOnce = true;
            this.correctAnswerSelected = false;
            this.POINTS = 10;
            this.optionTexts = [null, null, null, null];
            this.isHost = false;
            this.localPlayerId = '';
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
            // Determine true room host role explicitly using the Session API
            this.isHost = session.isHost?.() || false;
            if (!this.isHost && session.getCreatorId) {
                this.isHost = (session.getCreatorId() === this.localPlayerId);
            }
            this.setStatusText(this.isHost ? 'Host' : 'Player/Guest');
            // 1. Global Shared Game Sync Setup
            const gameNetworkId = { customNetworkId: 'triviaGlobalState', networkIdType: 'Custom' };
            this.gameSyncEntity = new SyncEntity_1.SyncEntity(this, new StoragePropertySet_1.StoragePropertySet([this.jsonQuestionProp, this.timerEndServerTimeProp]), this.isHost, 'Session', gameNetworkId);
            // 2. Setup Static Host and Guest Data Channels
            const hostStoreId = { customNetworkId: 'trivia_fixed_host_store', networkIdType: 'Custom' };
            const guestStoreId = { customNetworkId: 'trivia_fixed_guest_store', networkIdType: 'Custom' };
            this.hostPlayerSyncEntity = new SyncEntity_1.SyncEntity(this, new StoragePropertySet_1.StoragePropertySet([this.hostScoreProp, this.hostReadyProp]), this.isHost, 'Session', hostStoreId);
            this.guestPlayerSyncEntity = new SyncEntity_1.SyncEntity(this, new StoragePropertySet_1.StoragePropertySet([this.guestScoreProp, this.guestReadyProp]), !this.isHost, 'Session', guestStoreId);
            // 3. Bind UI Score Tracking Update Loops
            this.setupScoreboardCrossTalk();
            // 4. Global Network Property Triggers
            this.jsonQuestionProp.onAnyChange.add(() => {
                const rawJson = this.jsonQuestionProp.currentValue;
                if (rawJson)
                    this.parseAndApplyJson(rawJson);
            });
            this.timerEndServerTimeProp.onAnyChange.add(() => {
                const targetTime = this.timerEndServerTimeProp.currentValue ?? 0;
                if (targetTime > 0) {
                    this.timerActive = true;
                }
            });
            // 5. Host-only Ready Evaluation Listeners
            this.hostReadyProp.onAnyChange.add(() => this.evaluateHostQuestionFetch());
            this.guestReadyProp.onAnyChange.add(() => this.evaluateHostQuestionFetch());
            this.setupProcessButton();
            this.gameSyncEntity.notifyOnReady(() => {
                const initialJson = this.jsonQuestionProp.currentValue;
                if (initialJson)
                    this.parseAndApplyJson(initialJson);
            });
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Scoreboard Cross-Talk Engine
        // ───────────────────────────────────────────────────────────────────────────
        setupScoreboardCrossTalk() {
            // Listen to Host Score changes over the network
            this.hostScoreProp.onAnyChange.add(() => {
                const score = this.hostScoreProp.currentValue ?? 0;
                if (this.isHost) {
                    if (this.myScoreValueText)
                        this.myScoreValueText.text = String(score);
                }
                else {
                    if (this.opponentScoreValueText)
                        this.opponentScoreValueText.text = String(score);
                }
            });
            // Listen to Guest/Player Score changes over the network
            this.guestScoreProp.onAnyChange.add(() => {
                const score = this.guestScoreProp.currentValue ?? 0;
                if (!this.isHost) {
                    if (this.myScoreValueText)
                        this.myScoreValueText.text = String(score);
                }
                else {
                    if (this.opponentScoreValueText)
                        this.opponentScoreValueText.text = String(score);
                }
            });
        }
        evaluateHostQuestionFetch() {
            if (!this.isHost)
                return;
            const hostReady = this.hostReadyProp.currentValue ?? false;
            const guestReady = this.guestReadyProp.currentValue ?? false;
            this.log(`Host evaluating ready states -> Host: ${hostReady}, Guest: ${guestReady}`);
            // Scan for presence of an actual remote opponent
            const session = SessionController_1.SessionController.getInstance();
            const currentUsers = session.getUsers?.() || session.getConnectedUsers?.() || [];
            let hasRemoteOpponent = false;
            for (let i = 0; i < currentUsers.length; i++) {
                const u = currentUsers[i];
                if (u) {
                    const id = u.userId || u.getUserId?.();
                    if (id && id !== this.localPlayerId) {
                        hasRemoteOpponent = true;
                        break;
                    }
                }
            }
            // Direct fix: Go immediately if alone, otherwise hold until both inputs land true
            const roomIsReady = hasRemoteOpponent ? (hostReady && guestReady) : hostReady;
            if (roomIsReady) {
                this.log('All active participants confirmed ready. Clearing flags and fetching next round...');
                this.hostReadyProp.setPendingValue(false);
                this.guestReadyProp.setPendingValue(false);
                this.fetchAndSync();
            }
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Frame Update Loop (Timer Sync Locked)
        // ───────────────────────────────────────────────────────────────────────────
        onUpdate() {
            if (!this.timerActive)
                return;
            const targetEndTime = this.timerEndServerTimeProp.currentValue ?? 0;
            if (targetEndTime === 0) {
                this.timerActive = false;
                return;
            }
            const currentTime = SessionController_1.SessionController.getInstance().getServerTimeInSeconds() ?? 0;
            const remainingTime = targetEndTime - currentTime;
            if (remainingTime <= 0) {
                this.timerActive = false;
                if (this.timerText)
                    this.timerText.text = '0.0s';
                this.onRoundTimerExpired();
            }
            else {
                if (this.timerText) {
                    this.timerText.text = remainingTime.toFixed(1) + 's';
                }
            }
        }
        onRoundTimerExpired() {
            this.log('Round complete.');
            if (!this.correctAnswerSelected && this.doOnce) {
                if (this.incorrectText)
                    this.incorrectText.enabled = true;
                this.doOnce = false;
            }
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Interface & Button Input Handlers
        // ───────────────────────────────────────────────────────────────────────────
        setupProcessButton() {
            if (!this.processButton)
                return;
            this.processButton.onTriggerUp.add(() => {
                this.hideAnswerFeedback();
                this.resetAnswerState();
                this.timerActive = false;
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
        setupAnswerButtons() {
            this.optionButton1?.onTriggerUp.add(() => this.checkUserAnswer(1));
            this.optionButton2?.onTriggerUp.add(() => this.checkUserAnswer(2));
            this.optionButton3?.onTriggerUp.add(() => this.checkUserAnswer(3));
            this.optionButton4?.onTriggerUp.add(() => this.checkUserAnswer(4));
        }
        checkUserAnswer(index) {
            const currentTime = SessionController_1.SessionController.getInstance().getServerTimeInSeconds() ?? 0;
            const targetEndTime = this.timerEndServerTimeProp.currentValue ?? 0;
            if (targetEndTime > 0 && currentTime >= targetEndTime) {
                return;
            }
            const isCorrect = index === this.correctAnswer;
            if (isCorrect) {
                this.correctAnswerSelected = true;
                if (this.correctText)
                    this.correctText.enabled = true;
                if (this.incorrectText)
                    this.incorrectText.enabled = false;
                if (this.doOnce) {
                    this.localScore += this.POINTS;
                    this.doOnce = false;
                    this.syncScoreToNetwork();
                }
            }
            else {
                if (this.incorrectText)
                    this.incorrectText.enabled = true;
                if (this.correctText)
                    this.correctText.enabled = false;
                if (this.correctAnswerSelected) {
                    this.localScore -= this.POINTS;
                    this.doOnce = true;
                    this.correctAnswerSelected = false;
                    this.syncScoreToNetwork();
                }
            }
        }
        syncScoreToNetwork() {
            if (this.isHost) {
                this.hostScoreProp.setPendingValue(this.localScore);
            }
            else {
                this.guestScoreProp.setPendingValue(this.localScore);
            }
        }
        // ─── Supabase Cloud Integration Fetch Execution ────────────────────────────
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
                const currentServerTime = SessionController_1.SessionController.getInstance().getServerTimeInSeconds() ?? 0;
                const endServerTimestamp = currentServerTime + this.roundDurationSeconds;
                // Host updates values over the network channel exclusively
                this.timerEndServerTimeProp.setPendingValue(endServerTimestamp);
                this.jsonQuestionProp.setPendingValue(JSON.stringify(r));
            }
            catch (e) {
                this.log(`Data normalization fault: ${e}`);
            }
        }
        // ─── UI Rendering Blocks ───────────────────────────────────────────────────
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
            this.doOnce = true;
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
        // ─── Text Component Traversals ─────────────────────────────────────────────
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