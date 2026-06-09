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
exports.GridContentCreator = void 0;
var __selfType = requireType("./GridContentCreatorLeaderboard");
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
 * Specs Inc. 2026
 * Grid content creator for leaderboard entries. Dynamically creates and manages leaderboard items
 * using GridLayout and prefab templates with support for rank, name, and score display.
 */
const RectangleButton_1 = require("SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton");
const ComponentUtils_1 = require("Utilities.lspkg/Scripts/Utils/ComponentUtils");
const Logger_1 = require("Utilities.lspkg/Scripts/Utils/Logger");
let GridContentCreator = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var GridContentCreator = _classThis = class extends _classSuper {
        constructor() {
            super();
            /**
             * Reference to the GridLayout component that will contain the items
             */
            this.gridLayout = this.gridLayout;
            /**
             * The prefab template for leaderboard items
             * Should have RectangleButton on root and Rank/Name/Score Text children
             */
            this.itemPrefab = this.itemPrefab;
            /**
             * Number of grid items to create and display
             */
            this.itemsCount = this.itemsCount;
            /**
             * Color for test data entries
             */
            this.testDataColor = this.testDataColor;
            /**
             * Color for regular entries
             */
            this.regularColor = this.regularColor;
            /**
             * Enable debug logging
             */
            this.debug = this.debug;
            this.enableLogging = this.enableLogging;
            this.enableLoggingLifecycle = this.enableLoggingLifecycle;
            /**
             * Internal references
             */
            this.leaderboardItems = [];
            /**
             * Maps of alternative names for text components
             */
            this.fieldNameMaps = {
                "Rank": ["Rank", "Position", "Placement", "RankText"],
                "Name": ["Name", "PlayerName", "NameText", "UserName"],
                "Score": ["Score", "ScoreText", "Points", "PointsText"]
            };
        }
        __initialize() {
            super.__initialize();
            /**
             * Reference to the GridLayout component that will contain the items
             */
            this.gridLayout = this.gridLayout;
            /**
             * The prefab template for leaderboard items
             * Should have RectangleButton on root and Rank/Name/Score Text children
             */
            this.itemPrefab = this.itemPrefab;
            /**
             * Number of grid items to create and display
             */
            this.itemsCount = this.itemsCount;
            /**
             * Color for test data entries
             */
            this.testDataColor = this.testDataColor;
            /**
             * Color for regular entries
             */
            this.regularColor = this.regularColor;
            /**
             * Enable debug logging
             */
            this.debug = this.debug;
            this.enableLogging = this.enableLogging;
            this.enableLoggingLifecycle = this.enableLoggingLifecycle;
            /**
             * Internal references
             */
            this.leaderboardItems = [];
            /**
             * Maps of alternative names for text components
             */
            this.fieldNameMaps = {
                "Rank": ["Rank", "Position", "Placement", "RankText"],
                "Name": ["Name", "PlayerName", "NameText", "UserName"],
                "Score": ["Score", "ScoreText", "Points", "PointsText"]
            };
        }
        onAwake() {
            // Initialize logger
            this.logger = new Logger_1.Logger("GridContentCreator", this.enableLogging || this.enableLoggingLifecycle, true);
            if (this.enableLoggingLifecycle) {
                this.logger.debug("LIFECYCLE: onAwake() - Component initializing");
            }
            this.logger.debug("[GridContentCreator] Initializing grid content for leaderboard display");
            // Delay initialization to next frame to ensure GridLayout is ready
            const delayedEvent = this.createEvent("DelayedCallbackEvent");
            delayedEvent.bind(() => {
                this.createGridItems();
            });
            delayedEvent.reset(0.1);
        }
        /**
         * Creates the grid items from prefab
         */
        createGridItems() {
            this.logger.debug("[GridContentCreator] Creating grid items");
            if (!this.gridLayout) {
                this.logger.debug("[GridContentCreator] ERROR: GridLayout reference is missing!");
                return;
            }
            if (!this.itemPrefab) {
                this.logger.debug("[GridContentCreator] ERROR: Item prefab reference is missing!");
                return;
            }
            // Get the GridLayout's parent object
            const gridParent = this.gridLayout.getSceneObject();
            // Clear any existing items
            this.leaderboardItems.forEach(item => {
                if (item) {
                    item.destroy();
                }
            });
            this.leaderboardItems = [];
            // Create new items from prefab
            for (let i = 0; i < this.itemsCount; i++) {
                // Instantiate prefab as child of GridLayout
                const item = this.itemPrefab.instantiate(gridParent);
                // Initialize the RectangleButton if it exists using Utilities
                const button = item.getComponent(RectangleButton_1.RectangleButton.getTypeName());
                if (button) {
                    const initialized = ComponentUtils_1.ComponentUtils.safeInitialize(button);
                    if (!initialized) {
                        this.logger.debug(`[GridContentCreator] Button ${i + 1} already initialized or initialization not needed`);
                    }
                }
                // Set default values
                this.updateItemWithEntry(item, {
                    name: "---",
                    score: 0,
                    rank: i + 1,
                    isTestData: false
                });
                // Store reference
                this.leaderboardItems.push(item);
                item.enabled = true;
            }
            // Initialize/re-layout the grid
            if (this.gridLayout.initialize) {
                this.gridLayout.initialize();
            }
            if (this.gridLayout.layout) {
                this.gridLayout.layout();
            }
            this.logger.debug(`[GridContentCreator] Created ${this.leaderboardItems.length} leaderboard item slots`);
        }
        /**
         * Clears all leaderboard items, resetting them to default state
         */
        clearAllItems() {
            this.logger.debug(`[GridContentCreator] Clearing all ${this.leaderboardItems.length} leaderboard items`);
            // Reset all items to default state
            for (let i = 0; i < this.leaderboardItems.length; i++) {
                const item = this.leaderboardItems[i];
                this.updateItemWithEntry(item, {
                    name: "---",
                    score: 0,
                    rank: i + 1,
                    isTestData: false
                });
            }
            this.logger.debug(`[GridContentCreator] All leaderboard items cleared`);
        }
        /**
         * Updates the leaderboard UI with the provided entries
         * @param entries Array of leaderboard entries with name, score, and rank
         */
        updateLeaderboardEntries(entries) {
            this.logger.debug(`[GridContentCreator] Updating UI with ${entries.length} leaderboard entries`);
            // Reset all items to default state first
            for (let i = 0; i < this.leaderboardItems.length; i++) {
                const item = this.leaderboardItems[i];
                this.updateItemWithEntry(item, {
                    name: "---",
                    score: 0,
                    rank: i + 1,
                    isTestData: false
                });
            }
            // Update items with entry data
            for (let i = 0; i < Math.min(entries.length, this.leaderboardItems.length); i++) {
                const entry = entries[i];
                const item = this.leaderboardItems[i];
                this.logger.debug(`[GridContentCreator] Updating item ${i + 1} with entry: rank=${entry.rank}, name=${entry.name}, score=${entry.score}`);
                this.updateItemWithEntry(item, entry);
            }
        }
        /**
         * Updates a single leaderboard item with entry data
         * @param item The item scene object to update
         * @param entry The leaderboard entry data
         */
        updateItemWithEntry(item, entry) {
            // Update Rank text
            this.updateItemText(item, "Rank", `#${entry.rank}`, entry.isTestData ? this.testDataColor : this.regularColor);
            // Update Name text
            this.updateItemText(item, "Name", entry.name, entry.isTestData ? this.testDataColor : this.regularColor);
            // Update Score text
            const scoreText = entry.score > 0 ? entry.score.toString() : "---";
            this.updateItemText(item, "Score", scoreText, entry.isTestData ? this.testDataColor : this.regularColor);
        }
        /**
         * Updates the text component in a child object with the specified name
         * @param parent Parent object containing the text component
         * @param baseChildName Base name of the child object with the text component
         * @param textValue New text value to set
         * @param color Color to set
         */
        updateItemText(parent, baseChildName, textValue, color) {
            // Get alternative names that might be used
            const alternativeNames = this.fieldNameMaps[baseChildName] || [baseChildName];
            let updated = false;
            // Try each alternative name
            for (const altName of alternativeNames) {
                // Find the child by name
                for (let i = 0; i < parent.getChildrenCount(); i++) {
                    const child = parent.getChild(i);
                    if (child.name === altName) {
                        // Get the text component and update it
                        const textComponent = child.getComponent("Component.Text");
                        if (textComponent) {
                            textComponent.text = textValue;
                            textComponent.textFill.color = color;
                            this.logger.debug(`[GridContentCreator] Updated ${baseChildName} text (using name '${altName}'): ${textValue}`);
                            updated = true;
                            break;
                        }
                    }
                }
                if (updated)
                    break;
            }
            // If we reach here and nothing was updated, no matching child was found
            if (!updated) {
                this.logger.debug(`[GridContentCreator] WARNING: Could not find any child for ${baseChildName} (tried ${alternativeNames.join(", ")})`);
            }
        }
    };
    __setFunctionName(_classThis, "GridContentCreator");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        GridContentCreator = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return GridContentCreator = _classThis;
})();
exports.GridContentCreator = GridContentCreator;
//# sourceMappingURL=GridContentCreatorLeaderboard.js.map