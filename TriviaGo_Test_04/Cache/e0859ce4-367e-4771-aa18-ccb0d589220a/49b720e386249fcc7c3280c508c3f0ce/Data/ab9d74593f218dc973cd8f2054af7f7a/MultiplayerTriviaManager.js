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
 * Fully compliant, production-ready Lens Studio Spectacles Sync Kit controller.
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
            this.myPlayerSyncEntity = null;
            this.opponentPlayerSyncEntity = null;
            // ── Synced Network Properties ──────────────────────────────────────────────
            this.jsonQuestionProp = StorageProperty_1.StorageProperty.manualString('jsonQuestion', '');
            this.timerEndServerTimeProp = StorageProperty_1.StorageProperty.manualFloat('timerEndServerTime', 0.0);
            // Per-Player Properties (Isolated to individual player stores)
            this.myScoreProp = StorageProperty_1.StorageProperty.manualInt('score', 0);
            this.myReadyProp = StorageProperty_1.StorageProperty.manualBool('ready', false);
            // Track the mirrored opponent properties dynamically
            this.opponentScorePropRef = null;
            this.opponentReadyPropRef = null;
            // ── Local Simulation Variables ─────────────────────────────────────────────
            this.correctAnswer = 0;
            this.localScore = 0;
            this.doOnce = true;
            this.correctAnswerSelected = false;
            this.POINTS = 10;
            this.optionTexts = [null, null, null, null];
            this.isHost = false;
            this.localPlayerId = '';
            this.opponentPlayerId = '';
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
            this.myPlayerSyncEntity = null;
            this.opponentPlayerSyncEntity = null;
            // ── Synced Network Properties ──────────────────────────────────────────────
            this.jsonQuestionProp = StorageProperty_1.StorageProperty.manualString('jsonQuestion', '');
            this.timerEndServerTimeProp = StorageProperty_1.StorageProperty.manualFloat('timerEndServerTime', 0.0);
            // Per-Player Properties (Isolated to individual player stores)
            this.myScoreProp = StorageProperty_1.StorageProperty.manualInt('score', 0);
            this.myReadyProp = StorageProperty_1.StorageProperty.manualBool('ready', false);
            // Track the mirrored opponent properties dynamically
            this.opponentScorePropRef = null;
            this.opponentReadyPropRef = null;
            // ── Local Simulation Variables ─────────────────────────────────────────────
            this.correctAnswer = 0;
            this.localScore = 0;
            this.doOnce = true;
            this.correctAnswerSelected = false;
            this.POINTS = 10;
            this.optionTexts = [null, null, null, null];
            this.isHost = false;
            this.localPlayerId = '';
            this.opponentPlayerId = '';
            this.timerActive = false;
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Lifecycle & Initialization
        // ─────────────────────────────────────────────────────────────────────────
        onAwake() {
            this.cacheOptionChildTextNodes();
            this.setupAnswerButtons();
            this.hideAnswerFeedback();
            this.setStatusText('Connecting…');
            if (this.timerText)
                this.timerText.text = '';
            if (this.opponentScoreValueText)
                this.opponentScoreValueText.text = '0';
            // Set up native frame-rate independent Lens Studio Update loop binding
            this.createEvent("UpdateEvent").bind(() => this.onUpdate());
            SessionController_1.SessionController.getInstance().notifyOnReady(() => this.onSessionReady());
        }
        onSessionReady() {
            this.log('Session connection established');
            const session = SessionController_1.SessionController.getInstance();
            // Safely pull the local user ID string across version paradigms
            const localUser = session.getLocalUserInfo();
            this.localPlayerId = localUser ? (localUser.userId || localUser.getUserId?.()) : 'localPlayer';
            // 1. Base Game Sync Setup
            const gameNetworkId = { customNetworkId: 'triviaGameState', networkIdType: 'Custom' };
            this.gameSyncEntity = new SyncEntity_1.SyncEntity(this, new StoragePropertySet_1.StoragePropertySet([this.jsonQuestionProp, this.timerEndServerTimeProp]), true, 'Session', gameNetworkId);
            // React to fresh global database downloads
            this.jsonQuestionProp.onAnyChange.add(() => {
                const rawJson = this.jsonQuestionProp.currentValue;
                if (rawJson)
                    this.parseAndApplyJson(rawJson);
            });
            // React to synchronized network clocks
            this.timerEndServerTimeProp.onAnyChange.add(() => {
                if ((this.timerEndServerTimeProp.currentValue ?? 0) > 0) {
                    this.timerActive = true;
                }
            });
            // 2. Local Player Score and Ready State Store instantiation
            const myStoreId = { customNetworkId: `playerStore_${this.localPlayerId}`, networkIdType: 'Custom' };
            this.myPlayerSyncEntity = new SyncEntity_1.SyncEntity(this, new StoragePropertySet_1.StoragePropertySet([this.myScoreProp, this.myReadyProp]), true, 'Session', myStoreId);
            // 3. Dynamic Opponent Interception Subscriptions
            session.onUserJoinedSession.add((userInfo) => {
                if (userInfo) {
                    const oppId = userInfo.userId || userInfo.getUserId?.();
                    if (oppId && oppId !== this.localPlayerId) {
                        this.hookOpponentStore(oppId);
                    }
                }
            });
            // Host checks room configurations for ready states and runs persistent participant searches
            this.createReadyCheckHooks();
            this.gameSyncEntity.notifyOnReady(() => {
                this.isHost = this.gameSyncEntity.canIModifyStore();
                this.setStatusText(this.isHost ? 'Host – Ready' : 'Player – Ready');
                this.setupProcessButton();
                const initialJson = this.jsonQuestionProp.currentValue;
                if (initialJson)
                    this.parseAndApplyJson(initialJson);
            });
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Opponent Binding Engine
        // ───────────────────────────────────────────────────────────────────────────
        hookOpponentStore(opponentId) {
            if (this.opponentPlayerId === opponentId)
                return;
            this.opponentPlayerId = opponentId;
            this.log(`Mapping tracking references for opponent: ${opponentId}`);
            this.opponentScorePropRef = StorageProperty_1.StorageProperty.manualInt('score', 0);
            this.opponentReadyPropRef = StorageProperty_1.StorageProperty.manualBool('ready', false);
            const opponentStoreId = { customNetworkId: `playerStore_${opponentId}`, networkIdType: 'Custom' };
            this.opponentPlayerSyncEntity = new SyncEntity_1.SyncEntity(this, new StoragePropertySet_1.StoragePropertySet([this.opponentScorePropRef, this.opponentReadyPropRef]), false, // Read-only consumer pipeline
            'Session', opponentStoreId);
            this.opponentScorePropRef.onAnyChange.add(() => {
                if (this.opponentScoreValueText) {
                    const val = this.opponentScorePropRef.currentValue ?? 0;
                    this.opponentScoreValueText.text = String(val);
                    this.log(`Opponent score updated over network: ${val}`);
                }
            });
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Ready State Sync & Aggressive Scoreboard Discovery Loop
        // ───────────────────────────────────────────────────────────────────────────
        createReadyCheckHooks() {
            this.myReadyProp.onAnyChange.add(() => this.evaluateHostQuestionFetch());
            const timerEvent = this.createEvent("DelayedCallbackEvent");
            timerEvent.bind(() => {
                const session = SessionController_1.SessionController.getInstance();
                // If the opponent is not hooked yet, look for them in the room
                if (!this.opponentPlayerId) {
                    const currentUsers = session.getUsers?.() || session.getConnectedUsers?.() || [];
                    for (let i = 0; i < currentUsers.length; i++) {
                        const u = currentUsers[i];
                        if (u) {
                            const oppId = u.userId || u.getUserId?.();
                            if (oppId && oppId !== this.localPlayerId) {
                                this.hookOpponentStore(oppId);
                                break;
                            }
                        }
                    }
                }
                // If the opponent reference exists, attach the ready state hook
                if (this.opponentReadyPropRef) {
                    this.opponentReadyPropRef.onAnyChange.add(() => this.evaluateHostQuestionFetch());
                }
                else {
                    timerEvent.reset(0.5); // Re-run search every half second until opponent store links up
                }
            });
            timerEvent.reset(0.5);
        }
        evaluateHostQuestionFetch() {
            if (!this.isHost)
                return;
            const meReady = this.myReadyProp.currentValue ?? false;
            const opponentReady = this.opponentReadyPropRef ? (this.opponentReadyPropRef.currentValue ?? false) : false;
            this.log(`Evaluating room configurations: [Host Ready: ${meReady}] | [Opponent Ready: ${opponentReady}]`);
            const roomIsReady = this.opponentPlayerId.length > 0 ? (meReady && opponentReady) : meReady;
            if (roomIsReady) {
                this.log('All participants confirmed ready. Transitioning to active question fetch...');
                this.myReadyProp.setPendingValue(false);
                this.fetchAndSync();
            }
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Local Frame Update Loop
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
            this.log('Round timer hit deadline. Locking interactables.');
            if (!this.correctAnswerSelected && this.doOnce) {
                if (this.incorrectText)
                    this.incorrectText.enabled = true;
                this.doOnce = false;
            }
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Core Interface & Button Setup
        // ─────────────────────────────────────────────────────────────────────────
        setupProcessButton() {
            if (!this.processButton)
                return;
            this.processButton.onTriggerUp.add(() => {
                this.hideAnswerFeedback();
                this.resetAnswerState();
                // FIXED: Visual Timer Reset. Force the countdown text clear immediately for the player 
                this.timerActive = false;
                if (this.timerText)
                    this.timerText.text = 'Waiting...';
                this.log('Local player flagged ready state.');
                this.myReadyProp.setPendingValue(true);
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
                this.log('Attempted submission bypassed. Round has concluded.');
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
                    this.myScoreProp.setPendingValue(this.localScore);
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
                    this.myScoreProp.setPendingValue(this.localScore);
                }
            }
            if (this.myScoreValueText)
                this.myScoreValueText.text = String(this.localScore);
        }
        // ─── Supabase Data Fetch Execution ──────────────────────────────────────────
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
                if (result.ok !== true || !result.record) {
                    this.log('Edge Function verification mismatch');
                    return;
                }
                const r = result.record;
                const currentServerTime = SessionController_1.SessionController.getInstance().getServerTimeInSeconds() ?? 0;
                const endServerTimestamp = currentServerTime + this.roundDurationSeconds;
                this.timerEndServerTimeProp.setPendingValue(endServerTimestamp);
                this.jsonQuestionProp.setPendingValue(JSON.stringify(r));
                this.parseAndApplyJson(JSON.stringify(r));
            }
            catch (e) {
                this.log(`Data normalization crash: ${e}`);
            }
        }
        // ─── UI Application Blocks ──────────────────────────────────────────────────
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
                this.log(`UI data rendering payload fault: ${e}`);
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
        // ─── Text Node Graph Hierarchy Traversals ───────────────────────────────────
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