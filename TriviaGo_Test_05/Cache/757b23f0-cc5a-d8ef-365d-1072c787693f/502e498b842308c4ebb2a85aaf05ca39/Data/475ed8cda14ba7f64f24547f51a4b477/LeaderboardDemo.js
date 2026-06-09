"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardDemo = void 0;
var __selfType = requireType("./LeaderboardDemo");
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
const Logger_1 = require("Utilities.lspkg/Scripts/Utils/Logger");
const decorators_1 = require("SnapDecorators.lspkg/decorators");
// Simple print-based logger
const log = {
    d: (msg) => print(msg),
    e: (msg) => print(`ERROR: ${msg}`)
};
let LeaderboardDemo = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    let _instanceExtraInitializers = [];
    let _onStart_decorators;
    var LeaderboardDemo = _classThis = class extends _classSuper {
        constructor() {
            super();
            /**
             * Reference to the LeaderboardExample component
             */
            this.leaderboardExample = (__runInitializers(this, _instanceExtraInitializers), this.leaderboardExample);
            /**
             * Button to create a new leaderboard
             */
            this.createLeaderboardButton = this.createLeaderboardButton;
            /**
             * Button to load a previous leaderboard
             */
            this.loadLeaderboardButton = this.loadLeaderboardButton;
            /**
             * Reference to the Submit Score button (must have RectangleButton component)
             */
            this.submitScoreButton = this.submitScoreButton;
            this.statusText = this.statusText;
            this.debug = this.debug;
            this.enableLogging = this.enableLogging;
            this.enableLoggingLifecycle = this.enableLoggingLifecycle;
        }
        __initialize() {
            super.__initialize();
            /**
             * Reference to the LeaderboardExample component
             */
            this.leaderboardExample = (__runInitializers(this, _instanceExtraInitializers), this.leaderboardExample);
            /**
             * Button to create a new leaderboard
             */
            this.createLeaderboardButton = this.createLeaderboardButton;
            /**
             * Button to load a previous leaderboard
             */
            this.loadLeaderboardButton = this.loadLeaderboardButton;
            /**
             * Reference to the Submit Score button (must have RectangleButton component)
             */
            this.submitScoreButton = this.submitScoreButton;
            this.statusText = this.statusText;
            this.debug = this.debug;
            this.enableLogging = this.enableLogging;
            this.enableLoggingLifecycle = this.enableLoggingLifecycle;
        }
        onAwake() {
            // Initialize logger
            this.logger = new Logger_1.Logger("LeaderboardDemo", this.enableLogging || this.enableLoggingLifecycle, true);
            if (this.enableLoggingLifecycle) {
                this.logger.debug("LIFECYCLE: onAwake() - Component initializing");
            }
            this.logger.debug("[LeaderboardDemo] Initializing");
            this.logger.debug("[LeaderboardDemo] Initializing");
        }
        /**
         * Called on start event
         */
        onStart() {
            this.logger.debug("[LeaderboardDemo] Start event triggered");
            this.logger.debug("[LeaderboardDemo] Start event triggered");
            this.validateReferences();
            this.setupButtonEvents();
            // Initialize with a default leaderboard name if needed
            if (!this.leaderboardExample.leaderboardName) {
                this.leaderboardExample.leaderboardName = "default_leaderboard";
            }
        }
        /**
         * Validates all required references
         */
        validateReferences() {
            if (!this.leaderboardExample) {
                this.logger.debug("[LeaderboardDemo] ERROR: LeaderboardExample reference is missing");
                return;
            }
            this.debug &&
                this.logger.debug("[LeaderboardDemo] LeaderboardExample reference is valid");
            // All fields are now optional or managed by LeaderboardExample
            this.logger.debug("[LeaderboardDemo] Validation complete");
            // Check button references
            if (!this.createLeaderboardButton) {
                this.logger.debug("[LeaderboardDemo] WARNING: Create Leaderboard button reference is missing");
            }
            if (!this.submitScoreButton) {
                this.logger.debug("[LeaderboardDemo] WARNING: Submit Score button reference is missing");
            }
        }
        /**
         * Sets up button click events using Spectacles Interaction Kit
         */
        setupButtonEvents() {
            // Create Leaderboard button
            if (this.createLeaderboardButton) {
                // Create an event callback function for the create leaderboard button
                const createLeaderboardCallback = () => {
                    this.updateStatusText("Creating leaderboard...");
                    // Create leaderboard (reads from user input in LeaderboardExample)
                    this.leaderboardExample.createLeaderboard(true, () => {
                        this.updateStatusText(`Created: ${this.leaderboardExample.leaderboardName}`);
                        this.leaderboardExample.clearAllItems();
                    });
                };
                // Add the event listener to the button onTriggerUp
                this.createLeaderboardButton.onTriggerUp.add(createLeaderboardCallback);
            }
            else {
                this.logger.debug("[LeaderboardDemo] WARNING: Create Leaderboard button not set");
            }
            // Submit Score button
            if (this.submitScoreButton) {
                // Create an event callback function for the submit score button
                const submitScoreCallback = () => {
                    this.updateStatusText("Submitting score...");
                    // Submit score (auto-generates score of 10 with user's name)
                    this.leaderboardExample.submitScore();
                    this.updateStatusText("Score submitted!");
                };
                // Add the event listener to the button onTriggerUp
                this.submitScoreButton.onTriggerUp.add(submitScoreCallback);
            }
            else {
                this.logger.debug("[LeaderboardDemo] WARNING: Submit Score button not set");
            }
            // Load Leaderboard button
            if (this.loadLeaderboardButton) {
                // Create an event callback function for the load leaderboard button
                const loadLeaderboardCallback = () => {
                    this.updateStatusText("Loading previous leaderboard...");
                    const leaderboards = this.leaderboardExample.getCreatedLeaderboards();
                    if (leaderboards.length === 0) {
                        this.updateStatusText("No previous leaderboards");
                        return;
                    }
                    // Get the most recent different leaderboard
                    let leaderboardToLoad = leaderboards[leaderboards.length - 1];
                    if (leaderboards.length > 1) {
                        for (let i = leaderboards.length - 1; i >= 0; i--) {
                            if (leaderboards[i] !== this.leaderboardExample.leaderboardName) {
                                leaderboardToLoad = leaderboards[i];
                                break;
                            }
                        }
                    }
                    this.leaderboardExample.loadLeaderboard(leaderboardToLoad, () => {
                        this.updateStatusText(`Loaded: ${leaderboardToLoad}`);
                    });
                };
                // Add the event listener to the button onTriggerUp
                this.loadLeaderboardButton.onTriggerUp.add(loadLeaderboardCallback);
            }
            else {
                this.logger.debug("[LeaderboardDemo] WARNING: Load Leaderboard button not set");
            }
        }
        /**
         * Helper method to update status text
         */
        updateStatusText(message) {
            if (this.statusText) {
                this.statusText.text = message;
            }
            this.logger.debug(`[LeaderboardDemo] ${message}`);
        }
    };
    __setFunctionName(_classThis, "LeaderboardDemo");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        _onStart_decorators = [decorators_1.bindStartEvent];
        __esDecorate(_classThis, null, _onStart_decorators, { kind: "method", name: "onStart", static: false, private: false, access: { has: obj => "onStart" in obj, get: obj => obj.onStart }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LeaderboardDemo = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LeaderboardDemo = _classThis;
})();
exports.LeaderboardDemo = LeaderboardDemo;
//# sourceMappingURL=LeaderboardDemo.js.map