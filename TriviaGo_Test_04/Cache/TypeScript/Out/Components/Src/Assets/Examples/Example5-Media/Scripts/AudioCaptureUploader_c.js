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
// @input string storageBucket = "specs-bucket" {"hint":"Supabase Storage bucket name for audio chunks"}
// @input string storageFolder = "audio-recordings" {"hint":"Supabase Storage folder path for audio uploads"}
// @input Asset.AudioTrackAsset microphoneAsset {"hint":"Microphone audio track asset for recording"}
// @input float sampleRate = 16000 {"hint":"Audio sample rate (Hz) - Use 16000 for voice, higher rates may cause chipmunk effect if not supported", "widget":"slider", "min":8000, "max":48000, "step":1000}
// @input float chunkDurationMs = 1000 {"hint":"Audio chunk size in milliseconds", "widget":"slider", "min":100, "max":2000, "step":100}
// @input AssignableType_1 recordButton {"hint":"Button to start/stop audio recording"}
// @input Component.Text statusText {"hint":"Text component to display status"}
// @input Component.Text buttonText {"hint":"Text component to display button state (Start/Stop)"}
// @input bool enableDebugLogs = true {"hint":"Enable detailed debug logging"}
// @input bool testSingleChunk {"hint":"Test with single audio chunk capture before continuous"}
if (!global.BaseScriptComponent) {
    function BaseScriptComponent() {}
    global.BaseScriptComponent = BaseScriptComponent;
    global.BaseScriptComponent.prototype = Object.getPrototypeOf(script);
    global.BaseScriptComponent.prototype.__initialize = function () {};
    global.BaseScriptComponent.getTypeName = function () {
        throw new Error("Cannot get type name from the class, not decorated with @component");
    };
}
var Module = require("../../../../../../Modules/Src/Assets/Examples/Example5-Media/Scripts/AudioCaptureUploader");
Object.setPrototypeOf(script, Module.AudioCaptureUploader.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("snapCloudRequirements", []);
    checkUndefined("storageBucket", []);
    checkUndefined("storageFolder", []);
    checkUndefined("microphoneAsset", []);
    checkUndefined("sampleRate", []);
    checkUndefined("chunkDurationMs", []);
    checkUndefined("recordButton", []);
    checkUndefined("enableDebugLogs", []);
    checkUndefined("testSingleChunk", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
