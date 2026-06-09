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
// @input SceneObject positionText {"hint":"Reference to the Position/Placement/Rank text object"}
// @input SceneObject nameText {"hint":"Reference to the Name text object"}
// @input SceneObject scoreText {"hint":"Reference to the Score text object"}
// @input bool highlightTestData = true {"hint":"Enable highlighting for test data"}
// @input vec4 testDataColor = {1,0.7,0.7,1} {"hint":"Test data highlight color"}
// @input vec4 regularColor = {1,1,1,1} {"hint":"Regular data color"}
// @input bool debug = true {"hint":"Enable debug logging"}
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
var Module = require("../../../../../Modules/Src/Assets/Leaderboard.lspkg/Scripts/LeaderboardItemExample");
Object.setPrototypeOf(script, Module.LeaderboardItemExample.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("positionText", []);
    checkUndefined("nameText", []);
    checkUndefined("scoreText", []);
    checkUndefined("highlightTestData", []);
    checkUndefined("testDataColor", []);
    checkUndefined("regularColor", []);
    checkUndefined("debug", []);
    checkUndefined("enableLogging", []);
    checkUndefined("enableLoggingLifecycle", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
