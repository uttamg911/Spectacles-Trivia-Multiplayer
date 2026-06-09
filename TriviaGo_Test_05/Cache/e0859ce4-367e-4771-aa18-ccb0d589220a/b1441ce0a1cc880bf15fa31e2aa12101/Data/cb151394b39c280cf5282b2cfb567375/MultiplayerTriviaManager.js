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
 * MultiplayerTriviaManager.ts — v2.2
 *
 * Changes from v2.1:
 *   - Integrated EdgeFunctionRoastById: fetches a roast when a player answers incorrectly
 *   - TriviaRecord now includes `id` — the question's primary key is stored as
 *     currentQuestionId and passed to the roast fetcher so the roast matches the question
 *   - roast1 is shown to the player who answered wrong first (initial buzz)
 *   - roast2 is shown when the steal attempt also fails
 *   - New inputs: roastFetcher (EdgeFunctionRoastById), roastText (Text to display roast)
 *   - roastText is cleared when a new question loads
 */
const SessionController_1 = require("SpectaclesSyncKit.lspkg/Core/SessionController");
const SyncEntity_1 = require("SpectaclesSyncKit.lspkg/Core/SyncEntity");
const StorageProperty_1 = require("SpectaclesSyncKit.lspkg/Core/StorageProperty");
const StoragePropertySet_1 = require("SpectaclesSyncKit.lspkg/Core/StoragePropertySet");
const MSG_GUEST_BUZZ = 'GUEST_BUZZ';
const MSG_GUEST_RESUME = 'GUEST_RESUME';
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
            this.nextRoundDelaySeconds = this.nextRoundDelaySeconds;
            this.enableDebugLogs = this.enableDebugLogs;
            // ── Roast integration ─────────────────────────────────────────────────────
            this.roastFetcherComponent = this.roastFetcherComponent;
            // @input
            // @hint("EdgeFunctionRoastById component — fetches roast text by question id")
            // public roastFetcher: EdgeFunctionRoastById
            this.roastText = this.roastText;
            // ── SyncEntity ────────────────────────────────────────────────────────────
            this.gameSyncEntity = null;
            this.jsonQuestionProp = StorageProperty_1.StorageProperty.manualString('jsonQuestion', '');
            this.timerStartTokenProp = StorageProperty_1.StorageProperty.manualString('timerStartToken', '');
            this.roundStateProp = StorageProperty_1.StorageProperty.manualString('roundState', 'PLAYING');
            this.currentActiveBuzzerProp = StorageProperty_1.StorageProperty.manualString('currentActiveBuzzer', 'NONE');
            this.hostScoreProp = StorageProperty_1.StorageProperty.manualInt('hostScore', 0);
            this.guestScoreProp = StorageProperty_1.StorageProperty.manualInt('guestScore', 0);
            this.hostBuzzedTimeProp = StorageProperty_1.StorageProperty.manualString('hostBuzzedTime', '');
            this.guestBuzzedTimeProp = StorageProperty_1.StorageProperty.manualString('guestBuzzedTime', '');
            // ── Local state ───────────────────────────────────────────────────────────
            this.correctAnswer = 0;
            this.currentQuestionId = 0; // ← tracks the active question's PK
            this.localScore = 0;
            this.localHasAnsweredPhase = false;
            this.turnProcessed = false;
            this.nextRoundCountdown = 0;
            this.nextRoundCountdownActive = false;
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
            this.nextRoundDelaySeconds = this.nextRoundDelaySeconds;
            this.enableDebugLogs = this.enableDebugLogs;
            // ── Roast integration ─────────────────────────────────────────────────────
            this.roastFetcherComponent = this.roastFetcherComponent;
            // @input
            // @hint("EdgeFunctionRoastById component — fetches roast text by question id")
            // public roastFetcher: EdgeFunctionRoastById
            this.roastText = this.roastText;
            // ── SyncEntity ────────────────────────────────────────────────────────────
            this.gameSyncEntity = null;
            this.jsonQuestionProp = StorageProperty_1.StorageProperty.manualString('jsonQuestion', '');
            this.timerStartTokenProp = StorageProperty_1.StorageProperty.manualString('timerStartToken', '');
            this.roundStateProp = StorageProperty_1.StorageProperty.manualString('roundState', 'PLAYING');
            this.currentActiveBuzzerProp = StorageProperty_1.StorageProperty.manualString('currentActiveBuzzer', 'NONE');
            this.hostScoreProp = StorageProperty_1.StorageProperty.manualInt('hostScore', 0);
            this.guestScoreProp = StorageProperty_1.StorageProperty.manualInt('guestScore', 0);
            this.hostBuzzedTimeProp = StorageProperty_1.StorageProperty.manualString('hostBuzzedTime', '');
            this.guestBuzzedTimeProp = StorageProperty_1.StorageProperty.manualString('guestBuzzedTime', '');
            // ── Local state ───────────────────────────────────────────────────────────
            this.correctAnswer = 0;
            this.currentQuestionId = 0; // ← tracks the active question's PK
            this.localScore = 0;
            this.localHasAnsweredPhase = false;
            this.turnProcessed = false;
            this.nextRoundCountdown = 0;
            this.nextRoundCountdownActive = false;
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
            if (this.roastText)
                this.roastText.enabled = false;
            this.createEvent("UpdateEvent").bind(() => this.onUpdate());
            SessionController_1.SessionController.getInstance().notifyOnReady(() => this.onSessionReady());
        }
        onSessionReady() {
            const sc = SessionController_1.SessionController.getInstance();
            this.localPlayerId = sc.getLocalUserId() ?? 'localPlayer';
            this.isHost = sc.isHost() === true;
            this.log(`Session ready — isHost:${this.isHost} localId:${this.localPlayerId}`);
            this.setStatusText(this.isHost ? 'Host — starting…' : 'Guest — waiting…');
            const gameNetworkId = { customNetworkId: 'triviaGameState', networkIdType: 'Custom' };
            this.gameSyncEntity = new SyncEntity_1.SyncEntity(this, new StoragePropertySet_1.StoragePropertySet([
                this.jsonQuestionProp,
                this.timerStartTokenProp,
                this.roundStateProp,
                this.currentActiveBuzzerProp,
                this.hostScoreProp,
                this.guestScoreProp,
                this.hostBuzzedTimeProp,
                this.guestBuzzedTimeProp,
            ]), true, 'Session', gameNetworkId);
            this.setupScoreboardCrossTalk();
            this.jsonQuestionProp.onAnyChange.add(() => {
                const raw = this.jsonQuestionProp.currentValue;
                if (raw)
                    this.parseAndApplyJson(raw);
            });
            this.timerStartTokenProp.onAnyChange.add(() => {
                const token = this.timerStartTokenProp.currentValue ?? '';
                if (!token)
                    return;
                const duration = parseFloat(token.split(':')[0]);
                if (duration > 0) {
                    this.localTimeRemaining = duration;
                    this.timerActive = true;
                    this.turnProcessed = false;
                    this.nextRoundCountdownActive = false;
                    this.log(`Timer started: ${duration}s`);
                }
            });
            this.hostBuzzedTimeProp.onAnyChange.add(() => {
                if (this.hostBuzzedTimeProp.currentValue) {
                    this.timerActive = false;
                    this.log('Timer frozen: hostBuzzedTime');
                }
            });
            this.guestBuzzedTimeProp.onAnyChange.add(() => {
                if (this.guestBuzzedTimeProp.currentValue) {
                    this.timerActive = false;
                    this.log('Timer frozen: guestBuzzedTime');
                }
            });
            this.roundStateProp.onAnyChange.add(() => this.handleRoundStateChange());
            this.currentActiveBuzzerProp.onAnyChange.add(() => this.handleBuzzerStateChange());
            if (this.isHost) {
                sc.onMessageReceived.add((_session, _userId, message, _senderInfo) => this.onHostReceivedMessage(message));
                this.scheduleNextRound(2);
            }
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Round scheduling
        // ───────────────────────────────────────────────────────────────────────────
        scheduleNextRound(delaySecs) {
            if (!this.isHost)
                return;
            this.log(`Next round in ${delaySecs}s`);
            const delayEvent = this.createEvent('DelayedCallbackEvent');
            delayEvent.bind(() => this.startNextRound());
            delayEvent.reset(delaySecs);
        }
        startNextRound() {
            if (!this.isHost)
                return;
            this.hostBuzzedTimeProp.setPendingValue('');
            this.guestBuzzedTimeProp.setPendingValue('');
            this.currentActiveBuzzerProp.setPendingValue('NONE');
            this.roundStateProp.setPendingValue('PLAYING');
            this.fetchAndSync();
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Guest → Host messaging
        // ───────────────────────────────────────────────────────────────────────────
        onHostReceivedMessage(message) {
            this.log(`Host received: ${message}`);
            if (message === MSG_GUEST_RESUME) {
                if (this.roundStateProp.currentValue === 'PAUSED') {
                    this.startNextRound();
                }
                return;
            }
            if (message.startsWith(MSG_GUEST_BUZZ + ':')) {
                const parts = message.split(':');
                if (parts.length >= 3) {
                    this.guestBuzzedTimeProp.setPendingValue(`${parts[1]}:${parts[2]}`);
                }
            }
        }
        guestSendMessage(message) {
            const session = SessionController_1.SessionController.getInstance().getSession();
            if (!session) {
                this.log('ERROR: session null');
                return;
            }
            session.sendMessage(message);
            this.log(`Guest sent: ${message}`);
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Round state handler
        // ───────────────────────────────────────────────────────────────────────────
        handleRoundStateChange() {
            const state = this.roundStateProp.currentValue;
            if (state === 'REVEAL_CORRECT') {
                this.timerActive = false;
                this.hideAnswerFeedback();
                if (this.correctText)
                    this.correctText.enabled = true;
                this.nextRoundCountdown = this.nextRoundDelaySeconds;
                this.nextRoundCountdownActive = true;
                if (this.isHost)
                    this.scheduleNextRound(this.nextRoundDelaySeconds);
            }
            else if (state === 'REVEAL_INCORRECT') {
                this.timerActive = false;
                this.hideAnswerFeedback();
                if (this.incorrectText)
                    this.incorrectText.enabled = true;
                this.nextRoundCountdown = this.nextRoundDelaySeconds;
                this.nextRoundCountdownActive = true;
                if (this.isHost)
                    this.scheduleNextRound(this.nextRoundDelaySeconds);
            }
            else if (state === 'PAUSED') {
                this.timerActive = false;
                this.nextRoundCountdownActive = false;
                this.hideAnswerFeedback();
                if (this.timerText)
                    this.timerText.text = 'Paused';
                this.setStatusText('No answer — tap any option to continue');
            }
        }
        handleBuzzerStateChange() {
            const activeBuzzer = this.currentActiveBuzzerProp.currentValue;
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
        // ───────────────────────────────────────────────────────────────────────────
        // Host-authoritative buzzer evaluation
        // ───────────────────────────────────────────────────────────────────────────
        evaluateBuzzerRaceAuthoritative() {
            if (!this.isHost)
                return;
            if (this.roundStateProp.currentValue !== 'PLAYING')
                return;
            if (this.turnProcessed)
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
                this.turnProcessed = true;
                if (hostTime <= guestTime) {
                    this.processTurnAuthoritative('HOST', hostOpt);
                }
                else {
                    this.processTurnAuthoritative('GUEST', guestOpt);
                }
            }
            else if (activeBuzzer === 'HOST_ONLY' && hostToken) {
                this.turnProcessed = true;
                this.processTurnAuthoritative('HOST', parseInt(hostToken.split(':')[1]));
            }
            else if (activeBuzzer === 'GUEST_ONLY' && guestToken) {
                this.turnProcessed = true;
                this.processTurnAuthoritative('GUEST', parseInt(guestToken.split(':')[1]));
            }
        }
        processTurnAuthoritative(player, chosenOption) {
            this.timerActive = false;
            const isCorrect = chosenOption === this.correctAnswer;
            const currentHostScore = this.hostScoreProp.currentValue ?? 0;
            const currentGuestScore = this.guestScoreProp.currentValue ?? 0;
            const activeBuzzer = this.currentActiveBuzzerProp.currentValue;
            this.log(`Turn: player=${player} option=${chosenOption} correct=${isCorrect}`);
            if (isCorrect) {
                if (player === 'HOST') {
                    this.hostScoreProp.setPendingValue(currentHostScore + this.REWARD_POINTS);
                }
                else {
                    this.guestScoreProp.setPendingValue(currentGuestScore + this.REWARD_POINTS);
                }
                this.roundStateProp.setPendingValue('REVEAL_CORRECT');
            }
            else {
                if (player === 'HOST') {
                    this.hostScoreProp.setPendingValue(Math.max(0, currentHostScore - this.PENALTY_POINTS));
                }
                else {
                    this.guestScoreProp.setPendingValue(Math.max(0, currentGuestScore - this.PENALTY_POINTS));
                }
                if (activeBuzzer === 'NONE') {
                    // First wrong answer — fetch roast1 for the player who buzzed wrong,
                    // keyed to the current question id so the roast matches the question
                    this.triggerRoastForWrongAnswer(player, 'roast1');
                    this.hostBuzzedTimeProp.setPendingValue('');
                    this.guestBuzzedTimeProp.setPendingValue('');
                    this.turnProcessed = false;
                    const nextTarget = (player === 'HOST') ? 'GUEST_ONLY' : 'HOST_ONLY';
                    this.currentActiveBuzzerProp.setPendingValue(nextTarget);
                }
                else {
                    // Steal attempt also failed — fetch roast2 for the stealing player
                    this.triggerRoastForWrongAnswer(player, 'roast2');
                    this.roundStateProp.setPendingValue('REVEAL_INCORRECT');
                }
            }
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Roast integration
        // ───────────────────────────────────────────────────────────────────────────
        /**
         * Fetches and displays a roast for the player who answered incorrectly.
         *
         * roastField = 'roast1' → used when the first buzzer answers wrong (steal window opens)
         * roastField = 'roast2' → used when the steal attempt also fails (round ends)
         *
         * The roast is fetched by the current question's primary key (currentQuestionId)
         * so that the roast text is contextually matched to the question being played.
         *
         * Only the device whose player got roasted shows the roast — avoids showing
         * the same text on both screens.
         */
        get roastFetcher() {
            return this.roastFetcherComponent;
        }
        triggerRoastForWrongAnswer(wrongPlayer, roastField) {
            if (!this.roastFetcher) {
                this.log('roastFetcher not assigned — skipping roast');
                return;
            }
            const isMyTurn = (wrongPlayer === 'HOST' && this.isHost)
                || (wrongPlayer === 'GUEST' && !this.isHost);
            if (!isMyTurn) {
                this.log(`Roast is for ${wrongPlayer}, not showing on this device`);
                return;
            }
            this.log(`Fetching ${roastField} for question id:${this.currentQuestionId}`);
            // Point the fetcher at the current question's id
            this.roastFetcher.callFunctionWithId(this.currentQuestionId);
            // callFunctionWithId fetches and logs — we also display in roastText if wired up.
            // We hook into the result by calling the specific field method directly.
            // Because EdgeFunctionRoastById.fetchRoast1/2 use the stored this.id,
            // and we just set it above via callFunctionWithId, calling the field
            // method fetches the correct record and field.
            if (roastField === 'roast1') {
                this.roastFetcher.fetchRoast1();
            }
            else {
                this.roastFetcher.fetchRoast2();
            }
            // Show the roastText container — actual text is populated by the fetcher's
            // response callback. If you want to display it here, extend
            // EdgeFunctionRoastById with an onRoastReceived callback (see note below).
            if (this.roastText) {
                this.roastText.enabled = true;
            }
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Scoreboard
        // ───────────────────────────────────────────────────────────────────────────
        setupScoreboardCrossTalk() {
            this.hostScoreProp.onAnyChange.add(() => {
                const score = this.hostScoreProp.currentValue ?? 0;
                this.log(`hostScore → ${score}`);
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
                this.log(`guestScore → ${score}`);
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
        // Frame update
        // ───────────────────────────────────────────────────────────────────────────
        onUpdate() {
            if (this.isHost) {
                this.evaluateBuzzerRaceAuthoritative();
            }
            if (this.timerActive) {
                this.localTimeRemaining -= getDeltaTime();
                if (this.localTimeRemaining <= 0) {
                    this.localTimeRemaining = 0;
                    this.timerActive = false;
                    if (this.timerText)
                        this.timerText.text = '';
                    if (this.isHost) {
                        this.turnProcessed = true;
                        this.roundStateProp.setPendingValue('PAUSED');
                    }
                }
                else {
                    if (this.timerText)
                        this.timerText.text = this.localTimeRemaining.toFixed(1) + 's';
                }
            }
            if (this.nextRoundCountdownActive) {
                this.nextRoundCountdown -= getDeltaTime();
                if (this.nextRoundCountdown <= 0) {
                    this.nextRoundCountdownActive = false;
                    if (this.timerText)
                        this.timerText.text = '';
                    this.setStatusText('Loading…');
                }
                else {
                    if (this.timerText) {
                        this.timerText.text = `Next in ${this.nextRoundCountdown.toFixed(1)}s`;
                    }
                }
            }
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Input — answer buttons
        // ───────────────────────────────────────────────────────────────────────────
        setupAnswerButtons() {
            this.optionButton1?.onTriggerUp.add(() => this.checkUserAnswer(1));
            this.optionButton2?.onTriggerUp.add(() => this.checkUserAnswer(2));
            this.optionButton3?.onTriggerUp.add(() => this.checkUserAnswer(3));
            this.optionButton4?.onTriggerUp.add(() => this.checkUserAnswer(4));
        }
        checkUserAnswer(index) {
            const currentState = this.roundStateProp.currentValue;
            if (currentState === 'PAUSED') {
                this.setStatusText('Resuming…');
                if (this.isHost) {
                    this.startNextRound();
                }
                else {
                    this.guestSendMessage(MSG_GUEST_RESUME);
                }
                return;
            }
            if (this.localHasAnsweredPhase)
                return;
            if (currentState !== 'PLAYING')
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
            if (this.isHost) {
                this.hostBuzzedTimeProp.setPendingValue(`${Date.now()}:${index}`);
            }
            else {
                this.guestSendMessage(`${MSG_GUEST_BUZZ}:${Date.now()}:${index}`);
            }
        }
        // ───────────────────────────────────────────────────────────────────────────
        // Supabase fetch
        // ───────────────────────────────────────────────────────────────────────────
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
                    this.log(`Parse fault: ${e}`);
                }
            });
        }
        // ───────────────────────────────────────────────────────────────────────────
        // UI helpers
        // ───────────────────────────────────────────────────────────────────────────
        parseAndApplyJson(jsonStr) {
            try {
                const record = JSON.parse(jsonStr);
                // Store the question's primary key so the roast fetcher uses it
                this.currentQuestionId = Number(record.id ?? 0);
                this.correctAnswer = Number(record.answer ?? 0);
                if (this.questionText)
                    this.questionText.text = String(record.question ?? '');
                this.setOptionText(0, String(record.option1 ?? ''));
                this.setOptionText(1, String(record.option2 ?? ''));
                this.setOptionText(2, String(record.option3 ?? ''));
                this.setOptionText(3, String(record.option4 ?? ''));
                this.localHasAnsweredPhase = false;
                this.hideAnswerFeedback();
                // Clear the roast from the previous round
                if (this.roastText) {
                    this.roastText.enabled = false;
                    this.roastText.text = '';
                }
                this.log(`Question loaded — id:${this.currentQuestionId} answer:${this.correctAnswer}`);
            }
            catch (e) {
                this.log(`UI render fault: ${e}`);
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