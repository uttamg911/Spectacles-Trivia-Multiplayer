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
 * Drop this on a SceneObject alongside your existing UI script.
 */
const SessionController_1 = require("SpectaclesSyncKit.lspkg/Core/SessionController");
const SyncEntity_1 = require("SpectaclesSyncKit.lspkg/Core/SyncEntity");
const StorageProperty_1 = require("SpectaclesSyncKit.lspkg/Core/StorageProperty");
const StoragePropertySet_1 = require("SpectaclesSyncKit.lspkg/Core/StoragePropertySet");
// ─────────────────────────────────────────────────────────────────────────────
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
            // ── Supabase config ────────────────────────────────────────────────────────
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.functionName = this.functionName;
            this.object = this.object;
            this.topic = this.topic;
            // ── UI inputs ──────────────────────────────────────────────────────────────
            this.processButton = this.processButton;
            this.questionText = this.questionText;
            this.optionButton1 = this.optionButton1;
            this.optionButton2 = this.optionButton2;
            this.optionButton3 = this.optionButton3;
            this.optionButton4 = this.optionButton4;
            this.optionButtonChildTextName = this.optionButtonChildTextName;
            this.correctText = this.correctText;
            this.incorrectText = this.incorrectText;
            this.scoreValueText = this.scoreValueText;
            /** Optional: show connection / host status */
            this.statusText = this.statusText;
            this.enableDebugLogs = this.enableDebugLogs;
            // ── Sync Kit objects ───────────────────────────────────────────────────────
            this.gameSyncEntity = null;
            this.scoreSyncEntity = null;
            // ── Synced question fields ────────────────────────────────────────────────
            this.questionProp = StorageProperty_1.StorageProperty.manualString('question', '');
            this.option1Prop = StorageProperty_1.StorageProperty.manualString('option1', '');
            this.option2Prop = StorageProperty_1.StorageProperty.manualString('option2', '');
            this.option3Prop = StorageProperty_1.StorageProperty.manualString('option3', '');
            this.option4Prop = StorageProperty_1.StorageProperty.manualString('option4', '');
            this.optionCountProp = StorageProperty_1.StorageProperty.manualInt('optionCount', 0);
            this.correctAnswerProp = StorageProperty_1.StorageProperty.manualInt('correctAnswer', 0);
            this.revisionProp = StorageProperty_1.StorageProperty.manualInt('revision', 0);
            // ── Per-player score ───────────────────────────────────────────────────────
            this.myScoreProp = StorageProperty_1.StorageProperty.manualInt('score', 0);
            // ── Local state ───────────────────────────────────────────────────────────
            this.correctAnswer = 0;
            this.localScore = 0;
            this.doOnce = true;
            this.correctAnswerSelected = false;
            this.POINTS = 10;
            this.optionTexts = [null, null, null, null];
            this.isHost = false;
            this.lastRevisionSeen = -1;
        }
        __initialize() {
            super.__initialize();
            this.internetModule = require('LensStudio:InternetModule');
            // ── Supabase config ────────────────────────────────────────────────────────
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.functionName = this.functionName;
            this.object = this.object;
            this.topic = this.topic;
            // ── UI inputs ──────────────────────────────────────────────────────────────
            this.processButton = this.processButton;
            this.questionText = this.questionText;
            this.optionButton1 = this.optionButton1;
            this.optionButton2 = this.optionButton2;
            this.optionButton3 = this.optionButton3;
            this.optionButton4 = this.optionButton4;
            this.optionButtonChildTextName = this.optionButtonChildTextName;
            this.correctText = this.correctText;
            this.incorrectText = this.incorrectText;
            this.scoreValueText = this.scoreValueText;
            /** Optional: show connection / host status */
            this.statusText = this.statusText;
            this.enableDebugLogs = this.enableDebugLogs;
            // ── Sync Kit objects ───────────────────────────────────────────────────────
            this.gameSyncEntity = null;
            this.scoreSyncEntity = null;
            // ── Synced question fields ────────────────────────────────────────────────
            this.questionProp = StorageProperty_1.StorageProperty.manualString('question', '');
            this.option1Prop = StorageProperty_1.StorageProperty.manualString('option1', '');
            this.option2Prop = StorageProperty_1.StorageProperty.manualString('option2', '');
            this.option3Prop = StorageProperty_1.StorageProperty.manualString('option3', '');
            this.option4Prop = StorageProperty_1.StorageProperty.manualString('option4', '');
            this.optionCountProp = StorageProperty_1.StorageProperty.manualInt('optionCount', 0);
            this.correctAnswerProp = StorageProperty_1.StorageProperty.manualInt('correctAnswer', 0);
            this.revisionProp = StorageProperty_1.StorageProperty.manualInt('revision', 0);
            // ── Per-player score ───────────────────────────────────────────────────────
            this.myScoreProp = StorageProperty_1.StorageProperty.manualInt('score', 0);
            // ── Local state ───────────────────────────────────────────────────────────
            this.correctAnswer = 0;
            this.localScore = 0;
            this.doOnce = true;
            this.correctAnswerSelected = false;
            this.POINTS = 10;
            this.optionTexts = [null, null, null, null];
            this.isHost = false;
            this.lastRevisionSeen = -1;
        }
        // ─────────────────────────────────────────────────────────────────────────
        // Lifecycle
        // ─────────────────────────────────────────────────────────────────────────
        onAwake() {
            this.cacheOptionChildTextNodes();
            this.setupAnswerButtons();
            this.hideAnswerFeedback();
            this.setStatusText('Connecting…');
            SessionController_1.SessionController.getInstance().notifyOnReady(() => this.onSessionReady());
        }
        onSessionReady() {
            this.log('Session ready');
            const gameNetworkId = {
                customNetworkId: 'triviaGameState',
                networkIdType: 'Custom'
            };
            this.gameSyncEntity = new SyncEntity_1.SyncEntity(this, new StoragePropertySet_1.StoragePropertySet([
                this.questionProp,
                this.option1Prop,
                this.option2Prop,
                this.option3Prop,
                this.option4Prop,
                this.optionCountProp,
                this.correctAnswerProp,
                this.revisionProp,
            ]), true, 'Session', gameNetworkId);
            this.gameSyncEntity.onEventReceived.add('requestQuestion', () => {
                if (this.isHost) {
                    this.log('Client requested next question — fetching…');
                    this.fetchAndSync();
                }
            });
            // Clients listen for data landing via currentValue
            this.revisionProp.onAnyChange.add(() => {
                const rev = this.revisionProp.currentValue ?? 0;
                if (rev > this.lastRevisionSeen) {
                    this.lastRevisionSeen = rev;
                    this.applyCurrentSyncedQuestion();
                }
            });
            const myConnectionId = SessionController_1.SessionController.getInstance()
                .getLocalUserInfo()?.connectionId ?? 'localPlayer';
            const scoreNetworkId = {
                customNetworkId: `score_${myConnectionId}`,
                networkIdType: 'Custom'
            };
            this.scoreSyncEntity = new SyncEntity_1.SyncEntity(this, new StoragePropertySet_1.StoragePropertySet([this.myScoreProp]), true, 'Session', scoreNetworkId);
            this.gameSyncEntity.notifyOnReady(() => {
                this.isHost = this.gameSyncEntity.canIModifyStore();
                this.log(`I am the ${this.isHost ? 'HOST' : 'CLIENT'}`);
                this.setStatusText(this.isHost ? 'Host – ready!' : 'Player – ready!');
                this.setupProcessButton();
                this.applyCurrentSyncedQuestion();
            });
        }
        // ─────────────────────────────────────────────────────────────────────────
        // Button wiring
        // ─────────────────────────────────────────────────────────────────────────
        setupProcessButton() {
            if (!this.processButton)
                return;
            this.processButton.onTriggerUp.add(() => {
                this.hideAnswerFeedback();
                this.resetAnswerState();
                if (this.isHost) {
                    this.fetchAndSync();
                }
                else {
                    this.gameSyncEntity?.sendEvent('requestQuestion');
                    this.setStatusText('Asking host for next question…');
                }
            });
        }
        setupAnswerButtons() {
            this.optionButton1?.onTriggerUp.add(() => this.checkUserAnswer(1));
            this.optionButton2?.onTriggerUp.add(() => this.checkUserAnswer(2));
            this.optionButton3?.onTriggerUp.add(() => this.checkUserAnswer(3));
            this.optionButton4?.onTriggerUp.add(() => this.checkUserAnswer(4));
        }
        // ─────────────────────────────────────────────────────────────────────────
        // Answer checking 
        // ─────────────────────────────────────────────────────────────────────────
        checkUserAnswer(index) {
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
            if (this.scoreValueText)
                this.scoreValueText.text = String(this.localScore);
        }
        // ─────────────────────────────────────────────────────────────────────────
        // Supabase fetch 
        // ─────────────────────────────────────────────────────────────────────────
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
                    this.log('Edge Function returned ok=false or missing record');
                    return;
                }
                const r = result.record;
                this.questionProp.setPendingValue(String(r.question ?? ''));
                this.option1Prop.setPendingValue(String(r.option1 ?? ''));
                this.option2Prop.setPendingValue(String(r.option2 ?? ''));
                this.option3Prop.setPendingValue(String(r.option3 ?? ''));
                this.option4Prop.setPendingValue(String(r.option4 ?? ''));
                this.optionCountProp.setPendingValue(Number(r.optionCount ?? 0));
                this.correctAnswerProp.setPendingValue(Number(r.answer ?? 0));
                const nextRev = (this.revisionProp.currentValue ?? 0) + 1;
                this.revisionProp.setPendingValue(nextRev);
                // Host directly updates local UI using the record parameters immediately
                this.applyQuestionDataDirectly(r);
            }
            catch (e) {
                this.log(`JSON parse error: ${e}`);
            }
        }
        // ─────────────────────────────────────────────────────────────────────────
        // UI helpers
        // ─────────────────────────────────────────────────────────────────────────
        /**
         * For the remote players: Reads directly from committed network .currentValue references
         */
        applyCurrentSyncedQuestion() {
            const count = this.optionCountProp.currentValue ?? 0;
            if (count === 0)
                return;
            this.correctAnswer = this.correctAnswerProp.currentValue ?? 0;
            if (this.questionText) {
                this.questionText.text = this.questionProp.currentValue ?? '';
            }
            this.setOptionText(0, this.option1Prop.currentValue ?? '');
            this.setOptionText(1, this.option2Prop.currentValue ?? '');
            this.setOptionText(2, this.option3Prop.currentValue ?? '');
            this.setOptionText(3, this.option4Prop.currentValue ?? '');
            this.resetAnswerState();
            this.hideAnswerFeedback();
            this.setStatusText(this.isHost ? 'Host' : 'Player');
        }
        /**
         * For the Host: Updates the text components instantly using database values
         */
        applyQuestionDataDirectly(r) {
            this.correctAnswer = Number(r.answer ?? 0);
            if (this.questionText) {
                this.questionText.text = String(r.question ?? '');
            }
            this.setOptionText(0, String(r.option1 ?? ''));
            this.setOptionText(1, String(r.option2 ?? ''));
            this.setOptionText(2, String(r.option3 ?? ''));
            this.setOptionText(3, String(r.option4 ?? ''));
            this.resetAnswerState();
            this.hideAnswerFeedback();
            this.setStatusText('Host');
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
        // ─────────────────────────────────────────────────────────────────────────
        // Child-text helpers
        // ─────────────────────────────────────────────────────────────────────────
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