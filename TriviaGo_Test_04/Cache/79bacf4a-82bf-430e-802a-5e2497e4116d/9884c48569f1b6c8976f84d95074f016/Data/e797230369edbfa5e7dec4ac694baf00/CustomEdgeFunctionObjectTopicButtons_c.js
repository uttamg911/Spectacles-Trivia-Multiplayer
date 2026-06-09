if (script.onAwake) {
    script.onAwake();
    return;
}
function checkUndefined(property, showIfData) {
    for (var i = 0; i < showIfData.length; i++) {
        if (showIfData[i][0] && script[showIfData[i][0]] != showIfData[i][1]) {
            return;
        }
    }
    if (script[property] == undefined) {
        throw new Error("Input " + property + " was not provided for the object " + script.getSceneObject().name);
    }
}
// @input AssignableType snapCloudRequirements
// @input string functionName = "[your-function-name]"
// @input string object
// @input string topic
// @input bool enableDebugLogs = true
// @input AssignableType_1 processButton
// @input Component.Text questionText
// @input Component.Text correctText
// @input Component.Text incorrectText
// @input Component.Text scoreValueText
// @input AssignableType_2 optionButton1
// @input AssignableType_3 optionButton2
// @input AssignableType_4 optionButton3
// @input AssignableType_5 optionButton4
// @input string optionButtonChildTextName
if (!global.BaseScriptComponent) {
    function BaseScriptComponent() {}
    global.BaseScriptComponent = BaseScriptComponent;
    global.BaseScriptComponent.prototype = Object.getPrototypeOf(script);
    global.BaseScriptComponent.prototype.__initialize = function () {};
    global.BaseScriptComponent.getTypeName = function () {
        throw new Error("Cannot get type name from the class, not decorated with @component");
    };
}
var Module = require("../../../../../Modules/Src/Assets/Examples/Example4-EdgeFunctions/CustomEdgeFunctionObjectTopicButtons");
Object.setPrototypeOf(script, Module.CustomEdgeFunctionObjectTopicUI.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("snapCloudRequirements", []);
    checkUndefined("functionName", []);
    checkUndefined("object", []);
    checkUndefined("topic", []);
    checkUndefined("enableDebugLogs", []);
    checkUndefined("processButton", []);
    checkUndefined("questionText", []);
    checkUndefined("correctText", []);
    checkUndefined("incorrectText", []);
    checkUndefined("scoreValueText", []);
    checkUndefined("optionButton1", []);
    checkUndefined("optionButton2", []);
    checkUndefined("optionButton3", []);
    checkUndefined("optionButton4", []);
    checkUndefined("optionButtonChildTextName", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
