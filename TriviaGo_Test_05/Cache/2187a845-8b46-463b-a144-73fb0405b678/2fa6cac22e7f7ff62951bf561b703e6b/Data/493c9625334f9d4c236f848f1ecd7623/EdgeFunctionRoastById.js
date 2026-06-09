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
exports.EdgeFunctionRoastById = void 0;
var __selfType = requireType("./EdgeFunctionRoastById");
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
let EdgeFunctionRoastById = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var EdgeFunctionRoastById = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.internetModule = require("LensStudio:InternetModule");
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.functionName = this.functionName;
            this.enableDebugLogs = this.enableDebugLogs;
            // Callback wired by MultiplayerTriviaManager to display roast on screen
            this.onRoastReceived = null;
            // Tracks the current question id set by the trivia manager
            this.id = 1;
        }
        __initialize() {
            super.__initialize();
            this.internetModule = require("LensStudio:InternetModule");
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.functionName = this.functionName;
            this.enableDebugLogs = this.enableDebugLogs;
            // Callback wired by MultiplayerTriviaManager to display roast on screen
            this.onRoastReceived = null;
            // Tracks the current question id set by the trivia manager
            this.id = 1;
        }
        onAwake() {
            this.log("EdgeFunctionRoastById initializing...");
            this.initializeService();
        }
        initializeService() {
            if (!this.snapCloudRequirements || !this.snapCloudRequirements.isConfigured()) {
                this.log("SnapCloudRequirements not configured");
                return;
            }
            if (!this.functionName || this.functionName === "[your-function-name]") {
                this.log("Function name not configured");
                return;
            }
            this.log(`Initialized — endpoint: ${this.snapCloudRequirements.getFunctionsApiUrl()}${this.functionName}`);
        }
        callEdgeFunctionByIdWithLabel(roastLabel, idValue) {
            try {
                if (!this.snapCloudRequirements || !this.snapCloudRequirements.isConfigured()) {
                    this.log("SnapCloudRequirements not configured");
                    return;
                }
                if (!this.functionName || this.functionName === "[your-function-name]") {
                    this.log("Function name not configured");
                    return;
                }
                const endpointUrl = `${this.snapCloudRequirements.getFunctionsApiUrl()}${this.functionName}?id=${idValue}`;
                this.log(`Calling ${roastLabel} for id:${idValue}`);
                const request = RemoteServiceHttpRequest.create();
                request.url = endpointUrl;
                request.headers = this.snapCloudRequirements.getSupabaseHeaders();
                request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post;
                request.body = JSON.stringify({ id: idValue });
                this.internetModule.performHttpRequest(request, (response) => {
                    this.log(`${roastLabel} → status ${response.statusCode}`);
                    if (!response.body) {
                        this.log(`${roastLabel} → empty body`);
                        return;
                    }
                    let parsed = null;
                    try {
                        parsed = JSON.parse(response.body);
                    }
                    catch (e) {
                        this.log(`${roastLabel} → not JSON`);
                        return;
                    }
                    if (parsed?.error) {
                        this.log(`${roastLabel} → error: ${parsed.error}`);
                        return;
                    }
                    const data = parsed?.data;
                    if (!data) {
                        this.log(`${roastLabel} → missing "data"`);
                        return;
                    }
                    const textValue = data?.[roastLabel];
                    if (typeof textValue === "string" && textValue.length > 0) {
                        this.log(`${roastLabel} → ${textValue}`);
                        if (this.onRoastReceived) {
                            this.onRoastReceived(textValue);
                        }
                    }
                    else {
                        this.log(`${roastLabel} → field not found. Keys: ${Object.keys(data).join(", ")}`);
                    }
                });
            }
            catch (error) {
                this.log(`Error (${roastLabel}): ${error}`);
            }
        }
        fetchRoast1() {
            this.callEdgeFunctionByIdWithLabel("roast1", this.id);
        }
        fetchRoast2() {
            this.callEdgeFunctionByIdWithLabel("roast2", this.id);
        }
        callFunctionWithId(idValue) {
            this.id = idValue;
        }
        log(message) {
            if (this.enableDebugLogs)
                print(`[EdgeFunctionRoastById] ${message}`);
        }
    };
    __setFunctionName(_classThis, "EdgeFunctionRoastById");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        EdgeFunctionRoastById = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return EdgeFunctionRoastById = _classThis;
})();
exports.EdgeFunctionRoastById = EdgeFunctionRoastById;
//# sourceMappingURL=EdgeFunctionRoastById.js.map