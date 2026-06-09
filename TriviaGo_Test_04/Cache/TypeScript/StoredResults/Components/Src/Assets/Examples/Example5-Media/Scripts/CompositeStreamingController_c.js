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
// @input string streamingChannelName = "composite-live-stream" {"hint":"Supabase Realtime channel name for composite streaming"}
// @input float streamQuality = 40 {"hint":"Stream quality (lower = better performance, higher = better quality)", "widget":"slider", "min":1, "max":100, "step":1}
// @input float streamFPS = 30 {"hint":"Frames per second for video streaming", "widget":"slider", "min":1, "max":30, "step":1}
// @input float resolutionScale = 0.6 {"hint":"Stream resolution scale (0.5 = half resolution)", "widget":"slider", "min":0.1, "max":1, "step":0.1}
// @input AssignableType_1 cameraService {"hint":"Reference to CameraService (RECOMMENDED). Uses its camera to avoid multiple camera requests."}
// @input bool useCompositeTexture {"hint":"Default value for composite mode (can be toggled via Switch)"}
// @input Asset.Texture compositeTexture {"hint":"Pre-composed texture (with AR content) - used when useCompositeTexture is enabled"}
// @input Asset.AudioTrackAsset microphoneAsset {"hint":"Microphone audio track asset for streaming"}
// @input float sampleRate = 16000 {"hint":"Audio quality (samples per second)", "widget":"slider", "min":8000, "max":48000, "step":1000}
// @input float chunkSizeMs = 100 {"hint":"Audio chunk size (milliseconds)", "widget":"slider", "min":50, "max":500, "step":50}
// @input float compressionLevel = 3 {"hint":"Audio compression level (0-9, higher = more compression)", "widget":"slider", "min":0, "max":9, "step":1}
// @input AssignableType_2 streamButton {"hint":"Button to start/stop composite streaming"}
// @input AssignableType_3 compositeSwitch {"hint":"Switch to toggle between camera and composite streaming mode"}
// @input Component.Text statusText {"hint":"Text component to display streaming status"}
// @input Component.Text buttonText {"hint":"Text component to display button state"}
// @input Component.Image previewImage {"hint":"Image component to show local preview"}
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
var Module = require("../../../../../../Modules/Src/Assets/Examples/Example5-Media/Scripts/CompositeStreamingController");
Object.setPrototypeOf(script, Module.CompositeStreamingController.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("snapCloudRequirements", []);
    checkUndefined("streamingChannelName", []);
    checkUndefined("streamQuality", []);
    checkUndefined("streamFPS", []);
    checkUndefined("resolutionScale", []);
    checkUndefined("useCompositeTexture", []);
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
