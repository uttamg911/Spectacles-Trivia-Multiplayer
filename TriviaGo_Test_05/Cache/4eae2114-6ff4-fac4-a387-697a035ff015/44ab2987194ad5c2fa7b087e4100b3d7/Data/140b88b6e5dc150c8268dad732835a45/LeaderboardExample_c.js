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
// @ui {"widget":"separator"}
// @ui {"widget":"label", "label":"<span style=\"color: #60A5FA;\">Grid Configuration</span>"}
// @ui {"widget":"label", "label":"<span style=\"color: #94A3B8; font-size: 11px;\">IMPORTANT ScrollWindow setup:</span>"}
// @ui {"widget":"label", "label":"<span style=\"color: #94A3B8; font-size: 11px;\">1. GridLayout should be child of ScrollWindow content area</span>"}
// @ui {"widget":"label", "label":"<span style=\"color: #94A3B8; font-size: 11px;\">2. GridLayout position should be at TOP of content (not centered)</span>"}
// @ui {"widget":"label", "label":"<span style=\"color: #94A3B8; font-size: 11px;\">3. Disable Scroll Snapping OR set Snap Region = cell height + gap</span>"}
// @input AssignableType scrollWindow {"hint":"(Optional) ScrollWindow component - will auto-update scroll dimensions as entries grow"}
// @input AssignableType_1 gridLayout {"hint":"Reference to GridLayout component that will display leaderboard entries"}
// @input Asset.ObjectPrefab itemPrefab {"hint":"Prefab template for leaderboard items (should have RectangleButton with Rank/Name/Score Text children)"}
// @ui {"widget":"separator"}
// @ui {"widget":"label", "label":"<span style=\"color: #60A5FA;\">Display Settings</span>"}
// @input float initialPlaceholderCount = 10 {"hint":"Number of placeholder buttons to show initially"}
// @input vec4 testDataColor = {1,0.7,0.7,1} {"hint":"Color for test data entries"}
// @input vec4 regularColor = {1,1,1,1} {"hint":"Color for regular entries"}
// @ui {"widget":"separator"}
// @ui {"widget":"label", "label":"<span style=\"color: #60A5FA;\">Debug Settings</span>"}
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
var Module = require("../../../../../Modules/Src/Assets/Leaderboard.lspkg/Scripts/LeaderboardExample");
Object.setPrototypeOf(script, Module.LeaderboardExample.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("gridLayout", []);
    checkUndefined("itemPrefab", []);
    checkUndefined("initialPlaceholderCount", []);
    checkUndefined("testDataColor", []);
    checkUndefined("regularColor", []);
    checkUndefined("debug", []);
    checkUndefined("enableLogging", []);
    checkUndefined("enableLoggingLifecycle", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
