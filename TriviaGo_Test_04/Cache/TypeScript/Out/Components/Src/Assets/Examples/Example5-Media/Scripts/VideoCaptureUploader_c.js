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
// @input string storageBucket = "specs-bucket" {"hint":"Supabase Storage bucket name for video frames"}
// @input AssignableType_1 cameraService {"hint":"Reference to CameraService (RECOMMENDED). Uses its camera to avoid multiple camera requests."}
// @input float captureFrameRate {"hint":"Target FPS for capture. Set to 0 for MAX rate (captures every camera frame via onNewFrame)", "widget":"slider", "min":0, "max":30, "step":1}
// @input bool useHighQuality {"hint":"JPEG quality (lower = smaller files, faster uploads). Low recommended for video."}
// @input float maxRecordingDuration = 30 {"hint":"Maximum recording duration in seconds", "widget":"slider", "min":1, "max":60, "step":1}
// @input bool useCompositeTexture {"hint":"Default value for composite mode (can be toggled via Switch)"}
// @input Asset.Texture compositeTexture {"hint":"Pre-composed texture (with AR content) - used when useCompositeTexture is enabled"}
// @input AssignableType_2 recordButton {"hint":"Button to start/stop recording"}
// @input AssignableType_3 compositeSwitch {"hint":"Switch to toggle between camera and composite capture mode"}
// @input Component.Text statusText {"hint":"Text component to display status"}
// @input Component.Text buttonText {"hint":"Text component to display button state (Start/Stop)"}
// @input Component.Image previewImage {"hint":"Image component to display captured frame preview"}
// @input bool enableDebugLogs {"hint":"Enable detailed debug logging (disable for better performance)"}
if (!global.BaseScriptComponent) {
    function BaseScriptComponent() {}
    global.BaseScriptComponent = BaseScriptComponent;
    global.BaseScriptComponent.prototype = Object.getPrototypeOf(script);
    global.BaseScriptComponent.prototype.__initialize = function () {};
    global.BaseScriptComponent.getTypeName = function () {
        throw new Error("Cannot get type name from the class, not decorated with @component");
    };
}
var Module = require("../../../../../../Modules/Src/Assets/Examples/Example5-Media/Scripts/VideoCaptureUploader");
Object.setPrototypeOf(script, Module.VideoCaptureUploader.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("snapCloudRequirements", []);
    checkUndefined("storageBucket", []);
    checkUndefined("captureFrameRate", []);
    checkUndefined("useHighQuality", []);
    checkUndefined("maxRecordingDuration", []);
    checkUndefined("useCompositeTexture", []);
    checkUndefined("recordButton", []);
    checkUndefined("enableDebugLogs", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
