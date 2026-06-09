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
exports.EdgeFunctionImgProcessing = void 0;
var __selfType = requireType("./CustomEdgeFunctionObject");
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
let EdgeFunctionImgProcessing = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var EdgeFunctionImgProcessing = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.internetModule = require("LensStudio:InternetModule");
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.functionName = this.functionName; // set this to: random-trivia
            // ✅ CHANGE: what we send to the Edge Function is `object`, not `imageUrl`
            this.object = this.object; // set empty to get random across all objects
            // Output (not required by this edge function, but kept from your original script)
            this.outputImage = this.outputImage;
            this.processButton = this.processButton;
            this.enableDebugLogs = this.enableDebugLogs;
        }
        __initialize() {
            super.__initialize();
            this.internetModule = require("LensStudio:InternetModule");
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.functionName = this.functionName; // set this to: random-trivia
            // ✅ CHANGE: what we send to the Edge Function is `object`, not `imageUrl`
            this.object = this.object; // set empty to get random across all objects
            // Output (not required by this edge function, but kept from your original script)
            this.outputImage = this.outputImage;
            this.processButton = this.processButton;
            this.enableDebugLogs = this.enableDebugLogs;
        }
        onAwake() {
            this.log("CustomEdgeFunction initializing...");
            this.initializeService();
            this.setupProcessButton();
        }
        initializeService() {
            if (!this.snapCloudRequirements || !this.snapCloudRequirements.isConfigured()) {
                this.log("SnapCloudRequirements not configured");
                return;
            }
            if (!this.functionName || this.functionName === "[your-function-name]") {
                this.log("Function name not configured (set it to: random-trivia)");
                return;
            }
            const endpointUrl = `${this.snapCloudRequirements.getFunctionsApiUrl()}${this.functionName}`;
            this.log("Edge Function service initialized");
            this.log(`Endpoint: ${endpointUrl}`);
        }
        setupProcessButton() {
            if (!this.processButton) {
                this.log("No process button assigned");
                this.log("You can also call callFunction() manually");
                return;
            }
            this.log(`Process button assigned: ${this.processButton.name}`);
            this.processButton.onTriggerUp.add(() => {
                this.log("PROCESS BUTTON PRESSED!");
                this.callEdgeFunction();
            });
            this.log("Process button interaction setup complete");
        }
        callEdgeFunction() {
            try {
                const endpointUrl = `${this.snapCloudRequirements.getFunctionsApiUrl()}${this.functionName}`;
                this.log("Calling Edge Function (random-trivia)...");
                this.log(`Sending request to: ${endpointUrl}`);
                this.callEdgeFunctionWithObject();
            }
            catch (error) {
                this.log(`Error preparing request: ${error}`);
            }
        }
        // ✅ CHANGE: send { object: ... } as JSON body
        async callEdgeFunctionWithObject() {
            try {
                const endpointUrl = `${this.snapCloudRequirements.getFunctionsApiUrl()}${this.functionName}`;
                this.log(`Sending object filter: ${this.object ? this.object : "(none)"}`);
                const payload = {};
                if (this.object && this.object.trim().length > 0)
                    payload.object = this.object.trim();
                const request = RemoteServiceHttpRequest.create();
                request.url = endpointUrl;
                request.headers = this.snapCloudRequirements.getSupabaseHeaders();
                request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post;
                request.body = JSON.stringify(payload);
                this.log("Sending request...");
                this.internetModule.performHttpRequest(request, (response) => {
                    this.log(`Response Status: ${response.statusCode}`);
                    if (response.statusCode === 200) {
                        this.log("Edge Function responded successfully");
                        try {
                            const result = JSON.parse(response.body);
                            // ✅ Matches your Edge Function response shape
                            if (result.ok === true) {
                                this.log("Received random Trivia row ✅");
                                if (result.object !== undefined)
                                    this.log(`object filter: ${result.object}`);
                                if (result.record) {
                                    // Logs full Trivia row
                                    this.log(`Trivia Row: ${JSON.stringify(result.record)}`);
                                    // Optional convenience fields (only if present)
                                    if (result.record.id !== undefined)
                                        this.log(`id: ${result.record.id}`);
                                    if (result.record.question !== undefined)
                                        this.log(`question: ${result.record.question}`);
                                }
                                else {
                                    this.log("Trivia is empty (record is null)");
                                }
                                if (result.totalCount !== undefined)
                                    this.log(`totalCount: ${result.totalCount}`);
                            }
                            else {
                                this.log(`Unexpected response: ${response.body}`);
                            }
                        }
                        catch (parseError) {
                            this.log(`Error parsing response JSON: ${parseError}`);
                            this.log(`Raw response: ${response.body}`);
                        }
                    }
                    else {
                        this.log(`Edge Function Error (${response.statusCode}): ${response.body}`);
                    }
                });
            }
            catch (error) {
                this.log(`Error calling Edge Function: ${error}`);
            }
        }
        // Kept from your original script but note:
        // random-trivia does NOT return a processed image URL.
        // You can remove these if you no longer need image display.
        downloadAndDisplayProcessedImage(imageUrl) {
            try {
                this.log(`Downloading processed image from: ${imageUrl}`);
                const remoteMediaModule = require("LensStudio:RemoteMediaModule");
                const resource = this.internetModule.makeResourceFromUrl(imageUrl);
                if (!resource) {
                    this.log("Failed to create resource from URL");
                    return;
                }
                remoteMediaModule.loadResourceAsImageTexture(resource, (texture) => {
                    this.log("Processed image downloaded successfully!");
                    this.applyProcessedTexture(texture);
                }, (error) => {
                    this.log(`Failed to download processed image: ${error}`);
                });
            }
            catch (error) {
                this.log(`Error downloading processed image: ${error}`);
            }
        }
        applyProcessedTexture(texture) {
            try {
                if (this.outputImage) {
                    this.outputImage.enabled = true;
                    this.outputImage.mainPass.baseTex = texture;
                    this.log("Processed image applied to output component");
                }
                else {
                    this.log("No output image component assigned");
                }
            }
            catch (error) {
                this.log(`Error applying processed texture: ${error}`);
            }
        }
        onError(statusCode, errorBody) {
            this.log(`Edge Function call failed with status ${statusCode}`);
            this.log(`Error details: ${errorBody}`);
        }
        callFunction() {
            this.callEdgeFunction();
        }
        // ✅ CHANGE: provide a different object value and call
        callFunctionWithObject(objectValue) {
            this.object = objectValue;
            this.callEdgeFunction();
        }
        log(message) {
            if (this.enableDebugLogs) {
                print(`[CustomEdgeFunction] ${message}`);
            }
        }
    };
    __setFunctionName(_classThis, "EdgeFunctionImgProcessing");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        EdgeFunctionImgProcessing = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return EdgeFunctionImgProcessing = _classThis;
})();
exports.EdgeFunctionImgProcessing = EdgeFunctionImgProcessing;
//# sourceMappingURL=CustomEdgeFunctionObject.js.map