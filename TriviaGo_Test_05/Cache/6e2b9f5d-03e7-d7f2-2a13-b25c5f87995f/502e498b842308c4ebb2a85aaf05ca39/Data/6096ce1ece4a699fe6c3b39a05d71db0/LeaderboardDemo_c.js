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
// @input AssignableType leaderboardExample {"hint":"Reference to the LeaderboardExample component"}
// @input AssignableType_1 createLeaderboardButton {"hint":"Button to create a new leaderboard"}
// @input AssignableType_2 loadLeaderboardButton {"hint":"Button to load a previous leaderboard"}
// @input AssignableType_3 submitScoreButton {"hint":"Reference to the Submit Score button with RectangleButton component"}
// @ui {"widget":"separator"}
// @ui {"widget":"label", "label":"<span style=\"color: #60A5FA;\">Optional Status Display</span>"}
// @ui {"widget":"label", "label":"<span style=\"color: #94A3B8; font-size: 11px;\">Optional text field to show status messages like \"Score submitted!\" or \"Loading...\"</span>"}
// @input Component.Text statusText {"hint":"(Optional) Text component for debug/status messages"}
// @ui {"widget":"separator"}
// @ui {"widget":"label", "label":"<span style=\"color: #60A5FA;\">Debug Settings</span>"}
// @input bool debug = true {"hint":"Enable debug logging to console"}
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
var Module = require("../../../../../Modules/Src/Packages/Leaderboard.lspkg/Scripts/LeaderboardDemo");
Object.setPrototypeOf(script, Module.LeaderboardDemo.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("leaderboardExample", []);
    checkUndefined("createLeaderboardButton", []);
    checkUndefined("loadLeaderboardButton", []);
    checkUndefined("debug", []);
    checkUndefined("enableLogging", []);
    checkUndefined("enableLoggingLifecycle", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
