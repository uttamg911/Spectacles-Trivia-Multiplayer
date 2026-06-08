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
// @input string storageBucket = "specs-bucket" {"hint":"Supabase Storage bucket name for composite uploads"}
// @input string videoStorageFolder = "composite-video" {"hint":"Storage folder for video frames"}
// @input string audioStorageFolder = "composite-audio" {"hint":"Storage folder for audio chunks"}
// @input string stitchedOutputFolder = "composite-stitched" {"hint":"Storage folder for final stitched video"}
// @input bool shareToSpotlight {"hint":"Enable sharing to Snapchat Spotlight after video is stitched"}
// @input AssignableType_1 captionInput {"hint":"Text input field for Spotlight caption"}
// @input string defaultCaption = "Captured with Spectacles ✨" {"hint":"Default caption for Spotlight post (used if no input provided)"}
// @input bool useVerticalCrop {"hint":"Default value for 9:16 vertical crop (can be toggled via Switch)"}
// @input AssignableType_2 verticalCropSwitch {"hint":"Switch to toggle 9:16 vertical crop for Spotlight/Reels format"}
// @input float imageFormat {"hint":"Image format for captured frames.\n\n⚡ JPG: Faster encoding, smaller files, recommended for smooth recording.\n\n⚠️ PNG: Lossless quality but CPU INTENSIVE - may cause stuttering during recording!", "widget":"combobox", "values":[{"label":"JPG (Recommended)", "value":0}, {"label":"PNG (CPU Intensive!)", "value":1}]}
// @input float frameQuality = 70 {"hint":"Video frame quality (1-100, higher = better quality). Only affects JPG format.", "widget":"slider", "min":1, "max":100, "step":1}
// @input float frameRate = 30 {"hint":"Frames per second for video capture", "widget":"slider", "min":1, "max":30, "step":1}
// @input float maxRecordingDuration = 30 {"hint":"Maximum recording duration in seconds", "widget":"slider", "min":5, "max":120, "step":5}
// @input AssignableType_3 cameraService {"hint":"Reference to CameraService (RECOMMENDED). Uses its camera to avoid multiple camera requests."}
// @input bool useCompositeTexture {"hint":"Default value for composite mode (can be toggled via Switch)"}
// @input Asset.Texture compositeTexture {"hint":"Pre-composed texture (with AR content) - used when useCompositeTexture is enabled"}
// @input Asset.AudioTrackAsset microphoneAsset {"hint":"Microphone audio track asset for recording"}
// @input float sampleRate = 44100 {"hint":"Audio sample rate (Hz)", "widget":"slider", "min":8000, "max":48000, "step":1000}
// @input float chunkDurationMs = 100 {"hint":"Audio chunk size in milliseconds", "widget":"slider", "min":50, "max":1000, "step":50}
// @input AssignableType_4 recordButton {"hint":"Button to start/stop composite recording"}
// @input AssignableType_5 compositeSwitch {"hint":"Switch to toggle between camera and composite capture mode"}
// @input Component.Text statusText {"hint":"Text component to display recording status"}
// @input Component.Text buttonText {"hint":"Text component to display button state"}
// @input Component.Image previewImage {"hint":"Image component to show camera preview"}
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
var Module = require("../../../../../../Modules/Src/Assets/Examples/Example5-Media/Scripts/CompositeCaptureUploader");
Object.setPrototypeOf(script, Module.CompositeCaptureUploader.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("snapCloudRequirements", []);
    checkUndefined("storageBucket", []);
    checkUndefined("videoStorageFolder", []);
    checkUndefined("audioStorageFolder", []);
    checkUndefined("stitchedOutputFolder", []);
    checkUndefined("shareToSpotlight", []);
    checkUndefined("defaultCaption", []);
    checkUndefined("useVerticalCrop", []);
    checkUndefined("imageFormat", []);
    checkUndefined("frameQuality", []);
    checkUndefined("frameRate", []);
    checkUndefined("maxRecordingDuration", []);
    checkUndefined("useCompositeTexture", []);
    checkUndefined("microphoneAsset", []);
    checkUndefined("sampleRate", []);
    checkUndefined("chunkDurationMs", []);
    checkUndefined("recordButton", []);
    checkUndefined("enableDebugLogs", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
