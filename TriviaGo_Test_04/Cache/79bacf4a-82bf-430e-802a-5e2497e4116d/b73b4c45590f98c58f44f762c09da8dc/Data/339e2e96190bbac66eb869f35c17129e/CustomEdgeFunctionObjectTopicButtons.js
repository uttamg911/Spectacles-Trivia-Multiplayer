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
exports.CustomEdgeFunctionObjectTopicUI = void 0;
var __selfType = requireType("./CustomEdgeFunctionObjectTopicButtons");
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
let CustomEdgeFunctionObjectTopicUI = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var CustomEdgeFunctionObjectTopicUI = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.internetModule = require("LensStudio:InternetModule");
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.functionName = this.functionName;
            this.object = this.object;
            this.topic = this.topic;
            this.enableDebugLogs = this.enableDebugLogs;
            this.processButton = this.processButton;
            this.questionText = this.questionText;
            this.logText = this.logText;
            this.optionButton1 = this.optionButton1;
            this.optionButton2 = this.optionButton2;
            this.optionButton3 = this.optionButton3;
            this.optionButton4 = this.optionButton4;
            this.optionButtonChildTextName = this.optionButtonChildTextName;
            this.optionTexts = [null, null, null, null];
            this.correctAnswer = 0;
            this.isAnswerCorrect = false;
        }
        __initialize() {
            super.__initialize();
            this.internetModule = require("LensStudio:InternetModule");
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.functionName = this.functionName;
            this.object = this.object;
            this.topic = this.topic;
            this.enableDebugLogs = this.enableDebugLogs;
            this.processButton = this.processButton;
            this.questionText = this.questionText;
            this.logText = this.logText;
            this.optionButton1 = this.optionButton1;
            this.optionButton2 = this.optionButton2;
            this.optionButton3 = this.optionButton3;
            this.optionButton4 = this.optionButton4;
            this.optionButtonChildTextName = this.optionButtonChildTextName;
            this.optionTexts = [null, null, null, null];
            this.correctAnswer = 0;
            this.isAnswerCorrect = false;
        }
        onAwake() {
            this.initializeService();
            this.cacheOptionChildTextNodes();
            this.setupProcessButton();
            this.setupOptionButton1();
            this.setupOptionButton2();
            this.setupOptionButton3();
            this.setupOptionButton4();
            this.setQuestionText("");
            this.setOptionButtonsEnabled(false);
        }
        initializeService() {
            if (!this.snapCloudRequirements || !this.snapCloudRequirements.isConfigured()) {
                this.log("SnapCloudRequirements not configured");
                return;
            }
            if (!this.functionName || this.functionName === "[your-function-name]") {
                this.log("Function name not configured (set it to your Edge Function name)");
                return;
            }
        }
        setupProcessButton() {
            if (!this.processButton)
                return;
            this.processButton.onTriggerUp.add(() => {
                this.fetchTriviaAndUpdateUI();
                this.logText.text = "";
            });
        }
        setupOptionButton1() {
            if (!this.optionButton1)
                return;
            this.optionButton1.onTriggerUp.add(() => {
                this.checkUserAnswer(1);
                //this.fetchTriviaAndUpdateUI()
            });
        }
        setupOptionButton2() {
            if (!this.optionButton2)
                return;
            this.optionButton2.onTriggerUp.add(() => {
                this.checkUserAnswer(2);
                //this.fetchTriviaAndUpdateUI()
            });
        }
        setupOptionButton3() {
            if (!this.optionButton3)
                return;
            this.optionButton3.onTriggerUp.add(() => {
                this.checkUserAnswer(3);
                //this.fetchTriviaAndUpdateUI()
            });
        }
        setupOptionButton4() {
            if (!this.optionButton4)
                return;
            this.optionButton4.onTriggerUp.add(() => {
                this.checkUserAnswer(4);
                //this.fetchTriviaAndUpdateUI()
            });
        }
        checkUserAnswer(index) {
            this.isAnswerCorrect = index === this.correctAnswer;
            if (this.isAnswerCorrect)
                this.logText.text = "Correct";
            else
                this.logText.text = "Incorrect";
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
            const rootObj = btn.getSceneObject();
            if (!rootObj)
                return null;
            if (this.optionButtonChildTextName && this.optionButtonChildTextName.length > 0) {
                const namedObj = this.findChildByNameRecursive(rootObj, this.optionButtonChildTextName);
                if (namedObj) {
                    const t = namedObj.getComponent("Text");
                    if (t)
                        return t;
                }
            }
            return this.findFirstTextInDescendants(rootObj);
        }
        // ✅ FIXED: getChildrenCount / getChild
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
            const rootText = root.getComponent("Text");
            if (rootText)
                return rootText;
            const count = root.getChildrenCount();
            for (let i = 0; i < count; i++) {
                const child = root.getChild(i);
                if (!child)
                    continue;
                const childText = child.getComponent("Text");
                if (childText)
                    return childText;
                const deeper = this.findFirstTextInDescendants(child);
                if (deeper)
                    return deeper;
            }
            return null;
        }
        fetchTriviaAndUpdateUI() {
            try {
                const endpointUrl = `${this.snapCloudRequirements.getFunctionsApiUrl()}${this.functionName}`;
                const objectTrimmed = this.object ? this.object.trim() : "";
                const topicTrimmed = this.topic ? this.topic.trim() : "";
                const payload = {};
                if (objectTrimmed.length > 0)
                    payload.object = objectTrimmed;
                if (topicTrimmed.length > 0)
                    payload.topic = topicTrimmed;
                const request = RemoteServiceHttpRequest.create();
                request.url = endpointUrl;
                request.headers = this.snapCloudRequirements.getSupabaseHeaders();
                request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post;
                request.body = JSON.stringify(payload);
                this.internetModule.performHttpRequest(request, (response) => {
                    if (response.statusCode !== 200) {
                        this.log(`Edge Function error body: ${response.body}`);
                        return;
                    }
                    this.handleEdgeFunctionResponse(response.body);
                });
            }
            catch (e) {
                this.log(`Error preparing request: ${e}`);
            }
        }
        handleEdgeFunctionResponse(body) {
            try {
                const result = JSON.parse(body);
                if (result.ok !== true) {
                    this.log(`Edge Function returned ok=false`);
                    return;
                }
                const record = result.record;
                if (!record) {
                    this.setQuestionText("No trivia found.");
                    this.setOptionButtonsEnabled(false);
                    return;
                }
                this.correctAnswer = Number(record.answer ?? 0);
                this.setQuestionText(String(record.question ?? ""));
                const optionCount = Number(record.optionCount ?? 0);
                this.setOptionText(0, record.option1 ?? "");
                this.setOptionText(1, record.option2 ?? "");
                this.setOptionText(2, record.option3 ?? "");
                this.setOptionText(3, record.option4 ?? "");
                this.optionButton1.enabled = optionCount >= 1;
                this.optionButton2.enabled = optionCount >= 2;
                this.optionButton3.enabled = optionCount >= 3;
                this.optionButton4.enabled = optionCount >= 4;
            }
            catch (e) {
                this.log(`Error parsing Edge Function response JSON: ${e}`);
            }
        }
        setQuestionText(textValue) {
            if (!this.questionText)
                return;
            this.questionText.text = textValue;
        }
        setOptionButtonsEnabled(enabled) {
            if (this.optionButton1)
                this.optionButton1.enabled = enabled;
            if (this.optionButton2)
                this.optionButton2.enabled = enabled;
            if (this.optionButton3)
                this.optionButton3.enabled = enabled;
            if (this.optionButton4)
                this.optionButton4.enabled = enabled;
        }
        setOptionText(index, value) {
            const t = this.optionTexts[index];
            if (!t)
                return;
            t.text = String(value ?? "");
        }
        log(message) {
            if (this.enableDebugLogs) {
                print(`[CustomEdgeFunctionObjectTopicUI] ${message}`);
            }
        }
    };
    __setFunctionName(_classThis, "CustomEdgeFunctionObjectTopicUI");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CustomEdgeFunctionObjectTopicUI = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CustomEdgeFunctionObjectTopicUI = _classThis;
})();
exports.CustomEdgeFunctionObjectTopicUI = CustomEdgeFunctionObjectTopicUI;
//# sourceMappingURL=CustomEdgeFunctionObjectTopicButtons.js.map