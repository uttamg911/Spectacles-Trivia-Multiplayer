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
// @input AssignableType snapCloudRequirements {"hint":"Reference to SnapCloudRequirements for centralized Supabase configuration"}
// @input string streamingChannelName = "live-audio-stream" {"hint":"Supabase Realtime channel name for live audio streaming"}
// @input Asset.AudioTrackAsset microphoneAsset {"hint":"Microphone audio track asset for streaming"}
// @input float sampleRate = 16000 {"hint":"Audio sample rate (Hz) - Use 16000 for voice, higher rates may not be supported", "widget":"slider", "min":8000, "max":48000, "step":1000}
// @input float chunkSizeMs = 500 {"hint":"Audio chunk size (milliseconds)", "widget":"slider", "min":100, "max":1000, "step":100}
// @input float compressionLevel = 3 {"hint":"Audio compression level (0-9, higher = more compression)", "widget":"slider", "min":0, "max":9, "step":1}
// @input AssignableType_1 streamButton {"hint":"Button to start/stop audio streaming"}
// @input Component.Text statusText {"hint":"Text component to display streaming status"}
// @input Component.Text buttonText {"hint":"Text component to display button state (Start Stream/Stop Stream)"}
// @input bool enableDebugLogs = true {"hint":"Enable detailed debug logging"}
if (!global.BaseScriptComponent) {
    function BaseScriptComponent() {}
    global.BaseScriptComponent = BaseScriptComponent;
    global.BaseScriptComponent.prototype = Object.getPrototypeOf(script);
    global.BaseScriptComponent.prototype.__initialize = function () {};
    global.BaseScriptComponent.getTypeName = function () {
        throw new Error("Cannot get type name from the class, not decorated with @component");
    };
}
var Module = require("../../../../../../Modules/Src/Assets/Examples/Example5-Media/Scripts/AudioStreamingController");
Object.setPrototypeOf(script, Module.AudioStreamingController.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("snapCloudRequirements", []);
    checkUndefined("streamingChannelName", []);
    checkUndefined("microphoneAsset", []);
    checkUndefined("sampleRate", []);
    checkUndefined("chunkSizeMs", []);
    checkUndefined("compressionLevel", []);
    checkUndefined("streamButton", []);
    checkUndefined("enableDebugLogs", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
