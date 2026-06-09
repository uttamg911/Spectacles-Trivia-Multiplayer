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
// @input string storageBucket = "specs-bucket" {"hint":"Supabase Storage bucket name for images"}
// @input AssignableType_1 cameraService {"hint":"Reference to CameraService (RECOMMENDED). Uses its camera to avoid multiple camera requests."}
// @input float imageQuality = 85 {"hint":"Image quality for JPEG compression (0-100)", "widget":"slider", "min":1, "max":100, "step":1}
// @input bool useCompositeTexture {"hint":"Default value for composite mode (can be toggled via Switch)"}
// @input Asset.Texture compositeTexture {"hint":"Pre-composed texture (with AR content) - used when useCompositeTexture is enabled"}
// @input AssignableType_2 captureButton {"hint":"Button to capture image (texture-based)"}
// @input AssignableType_3 stillCaptureButton {"hint":"Button to capture high-quality still image (Camera Module API)"}
// @input AssignableType_4 compositeSwitch {"hint":"Switch to toggle between camera and composite capture mode"}
// @input Component.Text statusText {"hint":"Text component to display status"}
// @input Component.Image previewImage {"hint":"Image component to display captured frame preview"}
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
var Module = require("../../../../../../Modules/Src/Assets/Examples/Example5-Media/Scripts/ImageCaptureUploader");
Object.setPrototypeOf(script, Module.ImageCaptureUploader.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("snapCloudRequirements", []);
    checkUndefined("storageBucket", []);
    checkUndefined("imageQuality", []);
    checkUndefined("useCompositeTexture", []);
    checkUndefined("captureButton", []);
    checkUndefined("enableDebugLogs", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
