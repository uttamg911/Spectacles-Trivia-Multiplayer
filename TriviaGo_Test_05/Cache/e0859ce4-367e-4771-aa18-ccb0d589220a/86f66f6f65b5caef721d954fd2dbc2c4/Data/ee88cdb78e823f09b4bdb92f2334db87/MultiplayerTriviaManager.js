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
 * FINAL FIX: Proper ready flag syncing with host-owned entity
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
            this.gameSyncEntity = null;
            // Host-owned: game state
            this.jsonQuestionProp = StorageProperty_1.StorageProperty.manualString('jsonQuestion', '');
            this.timerStartTokenProp = StorageProperty_1.StorageProperty.manualString('timerStartToken', '');
            this.hostScoreProp = StorageProperty_1.StorageProperty.manualInt('hostScore', 0);
            this.guestScoreProp = StorageProperty_1.StorageProperty.manualInt('guestScore', 0);
            this.gameStateProp = StorageProperty_1.StorageProperty.manualString('gameState', 'LOADING');
            this.hostBuzzedAtProp = StorageProperty_1.StorageProperty.manualString('hostBuzzedAt', '');
            this.guestBuzzedAtProp = StorageProperty_1.StorageProperty.manualString('guestBuzzedAt', '');
            // SEPARATE entities for ready flags (so each can write their own)
            this.hostReadySyncEntity = null;
            this.guestReadySyncEntity = null;
            this.hostReadyProp = StorageProperty_1.StorageProperty.manualBool('hostReady', false);
            this.guestReadyProp = StorageProperty_1.StorageProperty.manualBool('guestReady', false);
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
            this.gameSyncEntity = null;
            // Host-owned: game state
            this.jsonQuestionProp = StorageProperty_1.StorageProperty.manualString('jsonQuestion', '');
            this.timerStartTokenProp = StorageProperty_1.StorageProperty.manualString('timerStartToken', '');
            this.hostScoreProp = StorageProperty_1.StorageProperty.manualInt('hostScore', 0);
            this.guestScoreProp = StorageProperty_1.StorageProperty.manualInt('guestScore', 0);
            this.gameStateProp = StorageProperty_1.StorageProperty.manualString('gameState', 'LOADING');
            this.hostBuzzedAtProp = StorageProperty_1.StorageProperty.manualString('hostBuzzedAt', '');
            this.guestBuzzedAtProp = StorageProperty_1.StorageProperty.manualString('guestBuzzedAt', '');
            // SEPARATE entities for ready flags (so each can write their own)
            this.hostReadySyncEntity = null;
            this.guestReadySyncEntity = null;
            this.hostReadyProp = StorageProperty_1.StorageProperty.manualBool('hostReady', false);
            this.guestReadyProp = StorageProperty_1.StorageProperty.manualBool('guestReady', false);
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
            const sessionController = SessionController_1.SessionController.getInstance();
            const localUser = sessionController.getLocalUserInfo();
            this.localPlayerId = localUser
                ? (localUser.userId || localUser.getUserId?.())
                : 'localPlayer';
            this.isHost = sessionController.isHost?.() || false;
            if (!this.isHost && sessionController.getCreatorId) {
                this.isHost = (sessionController.getCreatorId() === this.localPlayerId);
            }
            this.log(`Connected as ${this.isHost ? '✓ HOST' : '✗ GUEST'}`);
            this.setStatusText(this.isHost ? 'Host' : 'Guest');
            // ── GAME STATE ENTITY (host-owned) ────────────────────────────────────
            const gameNetworkId = { customNetworkId: 'triviaGame_v2', networkIdType: 'Custom' };
            this.gameSyncEntity = new SyncEntity_1.SyncEntity(this, new StoragePropertySet_1.StoragePropertySet([
                this.jsonQuestionProp,
                this.timerStartTokenProp,
                this.hostScoreProp,
                this.guestScoreProp,
                this.gameStateProp,
                this.hostBuzzedAtProp,
                this.guestBuzzedAtProp,
            ]), true, // Host always owns this
            'Session', gameNetworkId);
            // ── HOST READY ENTITY (host-owned, host writes it) ──────────────────
            const hostReadyNetworkId = { customNetworkId: 'triviaHostReady', networkIdType: 'Custom' };
            this.hostReadySyncEntity = new SyncEntity_1.SyncEntity(this, new StoragePropertySet_1.StoragePropertySet([this.hostReadyProp]), this.isHost, // Only host owns/writes this
            'Session', hostReadyNetworkId);
            // ── GUEST READY ENTITY (guest-owned, guest writes it) ────────────────
            const guestReadyNetworkId = { customNetworkId: 'triviaGuestReady', networkIdType: 'Custom' };
            this.guestReadySyncEntity = new SyncEntity_1.SyncEntity(this, new StoragePropertySet_1.StoragePropertySet([this.guestReadyProp]), !this.isHost, // Only guest owns/writes this
            'Session', guestReadyNetworkId);
            this.log(`Created entities: game (host), hostReady (${this.isHost ? 'WRITE' : 'read'}), guestReady (${!this.isHost ? 'WRITE' : 'read'})`);
            this.setupPropertyListeners();
            this.setupProcessButton();
        }
        setupPropertyListeners() {
            // Load question
            this.jsonQuestionProp.onAnyChange.add(() => {
                const json = this.jsonQuestionProp.currentValue;
                if (json)
                    this.parseAndApplyJson(json);
            });
            // Start timer
            this.timerStartTokenProp.onAnyChange.add(() => {
                const token = this.timerStartTokenProp.currentValue ?? '';
                if (!token)
                    return;
                const duration = parseFloat(token.split(':')[0]);
                if (duration > 0) {
                    this.localTimeRemaining = duration;
                    this.timerActive = true;
                    this.log(`⏱️ Timer: ${duration}s`);
                }
            });
            // BUZZER: Freeze timer when EITHER player buzzes
            this.hostBuzzedAtProp.onAnyChange.add(() => {
                if (this.hostBuzzedAtProp.currentValue) {
                    this.timerActive = false;
                    this.log(`🔴 HOST BUZZED - Timer frozen everywhere`);
                }
            });
            this.guestBuzzedAtProp.onAnyChange.add(() => {
                if (this.guestBuzzedAtProp.currentValue) {
                    this.timerActive = false;
                    this.log(`🟢 GUEST BUZZED - Timer frozen everywhere`);
                }
            });
            // SCORES: Update everywhere
            this.hostScoreProp.onAnyChange.add(() => {
                const score = this.hostScoreProp.currentValue ?? 0;
                this.log(`📊 Host score: ${score}`);
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
                this.log(`📊 Guest score: ${score}`);
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
            // Ready flags - host listens for both
            this.hostReadyProp.onAnyChange.add(() => {
                const isReady = this.hostReadyProp.currentValue ?? false;
                this.log(`hostReady changed: ${isReady}`);
                if (this.isHost) {
                    this.tryStartNewRound();
                }
            });
            this.guestReadyProp.onAnyChange.add(() => {
                const isReady = this.guestReadyProp.currentValue ?? false;
                this.log(`guestReady changed: ${isReady}`);
                if (this.isHost) {
                    this.tryStartNewRound();
                }
            });
        }
        tryStartNewRound() {
            if (!this.isHost)
                return;
            const hostReady = this.hostReadyProp.currentValue ?? false;
            const guestReady = this.guestReadyProp.currentValue ?? false;
            this.log(`Checking ready: host=${hostReady}, guest=${guestReady}`);
            const sessionController = SessionController_1.SessionController.getInstance();
            const currentUsers = sessionController.getUsers?.() || [];
            let hasRemoteOpponent = false;
            for (let i = 0; i < currentUsers.length; i++) {
                const u = currentUsers[i];
                if (u && (u.userId || u.getUserId?.()) !== this.localPlayerId) {
                    hasRemoteOpponent = true;
                    break;
                }
            }
            this.log(`hasRemoteOpponent=${hasRemoteOpponent}`);
            // If multiplayer, need both ready. If singleplayer, only host ready.
            const roomReady = hasRemoteOpponent ? (hostReady && guestReady) : hostReady;
            if (roomReady) {
                this.log(`✅ Both ready! Loading question...`);
                this.hostReadyProp.setPendingValue(false);
                this.guestReadyProp.setPendingValue(false);
                this.hostBuzzedAtProp.setPendingValue('');
                this.guestBuzzedAtProp.setPendingValue('');
                this.gameStateProp.setPendingValue('PLAYING');
                this.fetchAndSync();
            }
            else {
                this.log(`⏳ Waiting for opponent...`);
            }
        }
        onUpdate() {
            if (this.isHost) {
                this.evaluateBuzzer();
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
                    this.gameStateProp.setPendingValue('TIMEOUT');
                }
            }
            else {
                if (this.timerText)
                    this.timerText.text = this.localTimeRemaining.toFixed(1) + 's';
            }
        }
        evaluateBuzzer() {
            if (!this.isHost)
                return;
            if (this.gameStateProp.currentValue !== 'PLAYING')
                return;
            const hostBuzz = this.hostBuzzedAtProp.currentValue || '';
            const guestBuzz = this.guestBuzzedAtProp.currentValue || '';
            if (!hostBuzz && !guestBuzz)
                return;
            this.log(`🏁 Evaluating buzz...`);
            let winner;
            let chosenOption;
            if (hostBuzz && !guestBuzz) {
                winner = 'HOST';
                chosenOption = parseInt(hostBuzz.split(':')[1]);
            }
            else if (guestBuzz && !hostBuzz) {
                winner = 'GUEST';
                chosenOption = parseInt(guestBuzz.split(':')[1]);
            }
            else {
                const hostTime = parseInt(hostBuzz.split(':')[0]);
                const guestTime = parseInt(guestBuzz.split(':')[0]);
                winner = hostTime <= guestTime ? 'HOST' : 'GUEST';
                chosenOption = winner === 'HOST'
                    ? parseInt(hostBuzz.split(':')[1])
                    : parseInt(guestBuzz.split(':')[1]);
            }
            this.log(`Winner: ${winner}, Option: ${chosenOption}`);
            const isCorrect = chosenOption === this.correctAnswer;
            const hostScore = this.hostScoreProp.currentValue ?? 0;
            const guestScore = this.guestScoreProp.currentValue ?? 0;
            if (isCorrect) {
                if (winner === 'HOST') {
                    this.hostScoreProp.setPendingValue(hostScore + this.REWARD_POINTS);
                }
                else {
                    this.guestScoreProp.setPendingValue(guestScore + this.REWARD_POINTS);
                }
                this.gameStateProp.setPendingValue('CORRECT');
            }
            else {
                if (winner === 'HOST') {
                    this.hostScoreProp.setPendingValue(Math.max(0, hostScore - this.PENALTY_POINTS));
                }
                else {
                    this.guestScoreProp.setPendingValue(Math.max(0, guestScore - this.PENALTY_POINTS));
                }
                this.gameStateProp.setPendingValue('INCORRECT');
            }
            this.hostBuzzedAtProp.setPendingValue('');
            this.guestBuzzedAtProp.setPendingValue('');
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
            if (this.gameStateProp.currentValue !== 'PLAYING')
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
                this.setStatusText('Incorrect! Syncing…');
            }
            const timestamp = `${Date.now()}:${index}`;
            if (this.isHost) {
                this.log(`🔴 HOST buzz: ${timestamp}`);
                this.hostBuzzedAtProp.setPendingValue(timestamp);
            }
            else {
                this.log(`🟢 GUEST buzz: ${timestamp}`);
                this.guestBuzzedAtProp.setPendingValue(timestamp);
            }
        }
        setupProcessButton() {
            if (!this.processButton)
                return;
            this.processButton.onTriggerUp.add(() => {
                this.log(`⏭️ ${this.isHost ? 'HOST' : 'GUEST'} clicked NEXT`);
                this.hideAnswerFeedback();
                this.localHasAnsweredPhase = false;
                this.timerActive = false;
                this.localTimeRemaining = 0;
                if (this.timerText)
                    this.timerText.text = 'Waiting…';
                this.setStatusText('Waiting for opponent…');
                if (this.isHost) {
                    this.hostReadyProp.setPendingValue(true);
                }
                else {
                    this.guestReadyProp.setPendingValue(true);
                }
            });
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
                    if (result.ok && result.record) {
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
                this.log(`UI error: ${e}`);
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