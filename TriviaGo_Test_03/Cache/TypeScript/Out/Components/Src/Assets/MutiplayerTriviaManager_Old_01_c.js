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
// @input Component.ScriptComponent snapCloudRequirements
// @input string functionName = "[your-function-name]"
// @input string object
// @input string topic
// @input AssignableType processButton
// @input Component.Text questionText
// @input AssignableType_1 optionButton1
// @input AssignableType_2 optionButton2
// @input AssignableType_3 optionButton3
// @input AssignableType_4 optionButton4
// @input string optionButtonChildTextName
// @input Component.Text correctText
// @input Component.Text incorrectText
// @input Component.Text scoreValueText
// @input Component.Text statusText
// @input bool enableDebugLogs = true
if (!global.BaseScriptComponent) {
    function BaseScriptComponent() {}
    global.BaseScriptComponent = BaseScriptComponent;
    global.BaseScriptComponent.prototype = Object.getPrototypeOf(script);
    global.BaseScriptComponent.prototype.__initialize = function () {};
    global.BaseScriptComponent.getTypeName = function () {
        throw new Error("Cannot get type name from the class, not decorated with @component");
    };
}
var Module = require("../../../Modules/Src/Assets/MutiplayerTriviaManager_Old_01");
Object.setPrototypeOf(script, Module.MultiplayerTriviaManager.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("snapCloudRequirements", []);
    checkUndefined("functionName", []);
    checkUndefined("object", []);
    checkUndefined("topic", []);
    checkUndefined("processButton", []);
    checkUndefined("questionText", []);
    checkUndefined("optionButton1", []);
    checkUndefined("optionButton2", []);
    checkUndefined("optionButton3", []);
    checkUndefined("optionButton4", []);
    checkUndefined("optionButtonChildTextName", []);
    checkUndefined("correctText", []);
    checkUndefined("incorrectText", []);
    checkUndefined("scoreValueText", []);
    checkUndefined("statusText", []);
    checkUndefined("enableDebugLogs", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
