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
// @input AssignableType gridLayout {"hint":"GridLayout component that will contain the leaderboard items"}
// @input Asset.ObjectPrefab itemPrefab {"hint":"Prefab with RectangleButton and Rank/Name/Score Text children"}
// @input float itemsCount = 10 {"hint":"Number of leaderboard entries to display"}
// @input vec4 testDataColor = {1,0.7,0.7,1} {"hint":"Color for test data entries"}
// @input vec4 regularColor = {1,1,1,1} {"hint":"Color for regular entries"}
// @input bool debug {"hint":"Enable debug logging"}
// @ui {"widget":"separator"}
// @ui {"widget":"label", "label":"<span style=\"color: #60A5FA;\">Logging Configuration</span>"}
// @ui {"widget":"label", "label":"<span style=\"color: #94A3B8; font-size: 11px;\">Control logging output for this script instance</span>"}
// @input bool enableLogging {"hint":"Enable general logging (animation cycles, events, etc.)"}
// @input bool enableLoggingLifecycle {"hint":"Enable lifecycle logging (onAwake, onStart, onUpdate, onDestroy, etc.)"}
if (!global.BaseScriptComponent) {
    function BaseScriptComponent() {}
    global.BaseScriptComponent = BaseScriptComponent;
    global.BaseScriptComponent.prototype = Object.getPrototypeOf(script);
    global.BaseScriptComponent.prototype.__initialize = function () {};
    global.BaseScriptComponent.getTypeName = function () {
        throw new Error("Cannot get type name from the class, not decorated with @component");
    };
}
var Module = require("../../../../../Modules/Src/Assets/Leaderboard.lspkg/Scripts/GridContentCreatorLeaderboard");
Object.setPrototypeOf(script, Module.GridContentCreator.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("gridLayout", []);
    checkUndefined("itemPrefab", []);
    checkUndefined("itemsCount", []);
    checkUndefined("testDataColor", []);
    checkUndefined("regularColor", []);
    checkUndefined("debug", []);
    checkUndefined("enableLogging", []);
    checkUndefined("enableLoggingLifecycle", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
