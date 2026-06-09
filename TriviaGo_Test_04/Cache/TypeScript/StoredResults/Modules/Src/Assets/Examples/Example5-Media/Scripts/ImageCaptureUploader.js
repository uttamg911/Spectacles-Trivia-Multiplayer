"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageCaptureUploader = void 0;
var __selfType = requireType("./ImageCaptureUploader");
function component(target) {
    target.getTypeName = function () { return __selfType; };
    if (target.prototype.hasOwnProperty("getTypeName"))
        return;
    Object.defineProperty(target.prototype, "getTypeName", {
        value: function () { return __selfType; },
        configurable: true,
        writable: true
    });
}
const supabase_snapcloud_1 = require("SupabaseClient.lspkg/supabase-snapcloud");
/**
 * ImageCaptureUploader - Simple single image capture and upload to Supabase
 *
 * CAMERA SETUP:
 * - Assign CameraService reference to use the shared camera (RECOMMENDED - avoids conflicts)
 * - Or leave empty to request own camera (may conflict with CameraService)
 */
let ImageCaptureUploader = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var ImageCaptureUploader = _classThis = class extends _classSuper {
        constructor() {
            super();
            // Core Modules (only used as fallback if CameraService not provided)
            this.cameraModule = require("LensStudio:CameraModule");
            // Supabase Configuration
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.storageBucket = this.storageBucket;
            // Camera Configuration - USE CameraService to avoid conflicts!
            this.cameraService = this.cameraService;
            // Fallback camera ID (only used if CameraService not provided)
            this.cameraIdToUse = CameraModule.CameraId.Default_Color;
            this.imageQuality = this.imageQuality;
            // Composite Image Configuration
            this.useCompositeTexture = this.useCompositeTexture;
            this.compositeTexture = this.compositeTexture;
            // UI Components
            this.captureButton = this.captureButton;
            this.stillCaptureButton = this.stillCaptureButton;
            this.compositeSwitch = this.compositeSwitch;
            this.statusText = this.statusText;
            this.previewImage = this.previewImage;
            // Debug Configuration
            this.enableDebugLogs = this.enableDebugLogs;
            this.isCameraReady = false;
            this.isCapturing = false;
            this.isAuthenticated = false;
        }
        __initialize() {
            super.__initialize();
            // Core Modules (only used as fallback if CameraService not provided)
            this.cameraModule = require("LensStudio:CameraModule");
            // Supabase Configuration
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.storageBucket = this.storageBucket;
            // Camera Configuration - USE CameraService to avoid conflicts!
            this.cameraService = this.cameraService;
            // Fallback camera ID (only used if CameraService not provided)
            this.cameraIdToUse = CameraModule.CameraId.Default_Color;
            this.imageQuality = this.imageQuality;
            // Composite Image Configuration
            this.useCompositeTexture = this.useCompositeTexture;
            this.compositeTexture = this.compositeTexture;
            // UI Components
            this.captureButton = this.captureButton;
            this.stillCaptureButton = this.stillCaptureButton;
            this.compositeSwitch = this.compositeSwitch;
            this.statusText = this.statusText;
            this.previewImage = this.previewImage;
            // Debug Configuration
            this.enableDebugLogs = this.enableDebugLogs;
            this.isCameraReady = false;
            this.isCapturing = false;
            this.isAuthenticated = false;
        }
        onAwake() {
            this.log("ImageCaptureUploader initializing...");
            // Validate requirements
            if (!this.snapCloudRequirements) {
                this.logError("SnapCloudRequirements not configured! Please assign in Inspector.");
                return;
            }
            // Initialize on start - button/switch initialization must happen after components are awake
            this.createEvent("OnStartEvent").bind(() => {
                this.setupUIHandlers();
                this.initializeSupabaseAuthentication();
            });
            this.updateStatus("Ready to capture");
        }
        /**
         * Setup UI button and switch handlers - must be called after components are awake
         */
        setupUIHandlers() {
            // Setup button handlers - call initialize() first to ensure events are ready
            if (this.captureButton) {
                this.captureButton.initialize();
                this.captureButton.onTriggerUp.add(() => {
                    this.onCaptureButtonPressed();
                });
                this.log(" Capture button handler registered");
            }
            if (this.stillCaptureButton) {
                this.stillCaptureButton.initialize();
                this.stillCaptureButton.onTriggerUp.add(() => {
                    this.onStillCaptureButtonPressed();
                });
                this.log(" Still capture button handler registered");
            }
            // Setup composite mode switch handler - call initialize() first
            if (this.compositeSwitch) {
                this.compositeSwitch.initialize();
                // Handle switch value changes
                this.compositeSwitch.onValueChange.add((value) => {
                    const isComposite = value === 1;
                    this.log(`Composite switch changed to: ${isComposite}`);
                    this.setUseCompositeTexture(isComposite);
                });
                this.log(`Composite switch initialized (default: ${this.useCompositeTexture})`);
            }
        }
        /**
         * Initialize Supabase authentication
         */
        async initializeSupabaseAuthentication() {
            this.log("=== AUTHENTICATION START ===");
            if (!this.snapCloudRequirements || !this.snapCloudRequirements.isConfigured()) {
                this.logError("SnapCloudRequirements not configured");
                return;
            }
            const supabaseProject = this.snapCloudRequirements.getSupabaseProject();
            this.log(`Supabase URL: ${supabaseProject.url}`);
            // Create Supabase client
            const options = {
                realtime: {
                    heartbeatIntervalMs: 2500
                }
            };
            this.supabaseClient = (0, supabase_snapcloud_1.createClient)(supabaseProject.url, supabaseProject.publicToken, options);
            this.log("Supabase client created");
            if (this.supabaseClient) {
                await this.signInUser();
            }
            this.log("=== AUTHENTICATION END ===");
            this.log(`Final authentication status: ${this.isAuthenticated ? "AUTHENTICATED" : "NOT AUTHENTICATED"}`);
            // Initialize camera after authentication
            this.initializeCamera();
        }
        /**
         * Sign in user using Snap Cloud authentication (with retry logic)
         * Handles OIDC token errors which may be transient on device startup
         */
        async signInUser(retryCount = 0) {
            const maxRetries = 3;
            this.log(`Attempting Snap Cloud authentication... (attempt ${retryCount + 1}/${maxRetries + 1})`);
            try {
                const { data, error } = await this.supabaseClient.auth.signInWithIdToken({
                    provider: "snapchat",
                    token: ""
                });
                if (error) {
                    this.logError("Sign in error: " + JSON.stringify(error));
                    // Check if there's an existing session even if signIn failed
                    // This can happen if OIDC token isn't ready yet but a previous session exists
                    try {
                        const { data: sessionData } = await this.supabaseClient.auth.getSession();
                        if (sessionData?.session) {
                            const user = sessionData.session.user;
                            if (user?.id) {
                                this.uid = typeof user.id === "string" ? user.id : JSON.stringify(user.id).replace(/^"(.*)"$/, "$1");
                                this.isAuthenticated = true;
                                this.log(` Found existing session for user: ${this.uid}`);
                                return true;
                            }
                        }
                    }
                    catch (sessionError) {
                        this.log("No existing session found");
                    }
                    // Retry on retryable errors (including OIDC token errors)
                    // OIDC token errors are often transient and resolve after a short delay
                    if (retryCount < maxRetries && (error.name === "AuthRetryableFetchError" || error.status === 0)) {
                        // Use longer delay for OIDC token errors (they may need more time to become available)
                        const delaySeconds = error.status === 0 ? 1.0 : 0.5;
                        this.log(`Retrying authentication in ${delaySeconds}s... (attempt ${retryCount + 1}/${maxRetries})`);
                        this.log("Note: OIDC token errors are often transient and resolve after device initialization");
                        await this.delay(delaySeconds);
                        return await this.signInUser(retryCount + 1);
                    }
                    this.isAuthenticated = false;
                    return false;
                }
                else {
                    const { user, session } = data;
                    // Extract uid similar to TableConnector approach
                    if (user?.id) {
                        // Handle both string and already-stringified cases
                        this.uid = typeof user.id === "string" ? user.id : JSON.stringify(user.id).replace(/^"(.*)"$/, "$1");
                        this.isAuthenticated = true;
                        this.log(` Authenticated as user: ${this.uid}`);
                        if (session) {
                            this.log(`Session exists: YES`);
                        }
                        return true;
                    }
                    else {
                        this.logError("User ID not found in authentication response");
                        this.isAuthenticated = false;
                        return false;
                    }
                }
            }
            catch (error) {
                this.logError(`Authentication exception: ${error}`);
                // Retry on exceptions (may be OIDC token related)
                if (retryCount < maxRetries) {
                    const delaySeconds = 1.0; // Longer delay for exceptions
                    this.log(`Retrying authentication in ${delaySeconds}s... (attempt ${retryCount + 1}/${maxRetries})`);
                    await this.delay(delaySeconds);
                    return await this.signInUser(retryCount + 1);
                }
                this.isAuthenticated = false;
                return false;
            }
        }
        /**
         * Verify authentication status and retry if needed
         * This is called before uploads to ensure we have a valid session
         */
        async ensureAuthenticated() {
            this.log("Verifying authentication status...");
            // Check if we have a valid session first
            if (this.supabaseClient) {
                try {
                    const { data: { session }, error } = await this.supabaseClient.auth.getSession();
                    if (session && session.user) {
                        // Update uid if we have a session but weren't marked as authenticated
                        if (!this.isAuthenticated || !this.uid) {
                            const user = session.user;
                            if (user?.id) {
                                this.uid = typeof user.id === "string" ? user.id : JSON.stringify(user.id).replace(/^"(.*)"$/, "$1");
                                this.isAuthenticated = true;
                                this.log(` Found valid session for user: ${this.uid}`);
                            }
                        }
                        return true;
                    }
                    else if (error) {
                        this.log(`Session check error: ${JSON.stringify(error)}`);
                    }
                }
                catch (error) {
                    this.log(`Session check exception: ${error}`);
                }
            }
            // If not authenticated or session invalid, retry authentication
            if (this.supabaseClient) {
                this.log("No valid session found, attempting authentication...");
                const success = await this.signInUser();
                if (success) {
                    this.log(" Authentication successful");
                }
                else {
                    this.logError(" Authentication failed - upload may not work");
                    this.log("Note: OIDC token errors are often transient. Try again in a few seconds.");
                }
                return success;
            }
            this.logError("Supabase client not initialized");
            return false;
        }
        /**
         * Initialize camera - requests camera for raw capture
         * Note: For AR content, use the composite texture option instead
         */
        initializeCamera() {
            try {
                this.log("Initializing camera...");
                // PREFERRED: Use CameraService's camera (avoids conflicts)
                if (this.cameraService) {
                    this.log(" Using CameraService's camera (no conflicts)");
                    this.cameraTexture = this.cameraService.cameraTexture;
                    this.cameraTextureProvider = this.cameraService.cameraTextureProvider;
                    if (!this.cameraTexture) {
                        this.logError("CameraService camera texture not available yet - it may not have initialized");
                        this.updateStatus("Waiting for CameraService...");
                        return;
                    }
                    const width = this.cameraTexture.getWidth();
                    const height = this.cameraTexture.getHeight();
                    this.log(`CameraService texture dimensions: ${width}x${height}`);
                    if (width > 0 && height > 0) {
                        this.isCameraReady = true;
                        this.log(` Camera ready from CameraService: ${width}x${height}`);
                        this.updateStatus("Camera ready - tap to capture");
                    }
                    // Show appropriate preview texture
                    this.updatePreviewTexture();
                    this.log("Camera initialized via CameraService");
                    return;
                }
                // FALLBACK: Request own camera (may conflict with CameraService!)
                this.log("⚠️ No CameraService provided - requesting own camera (may conflict!)");
                const cameraRequest = CameraModule.createCameraRequest();
                cameraRequest.cameraId = this.cameraIdToUse;
                this.cameraTexture = this.cameraModule.requestCamera(cameraRequest);
                this.log(`Camera texture received: ${this.cameraTexture ? "YES" : "NO"}`);
                if (!this.cameraTexture) {
                    this.logError("Failed to get camera texture");
                    this.updateStatus("Camera request failed");
                    return;
                }
                // Get the texture provider to track when frames are available
                this.cameraTextureProvider = this.cameraTexture.control;
                // Set up callback for when first frame is ready
                if (this.cameraTextureProvider) {
                    this.cameraTextureProvider.onNewFrame.add(() => {
                        if (!this.isCameraReady) {
                            const width = this.cameraTexture.getWidth();
                            const height = this.cameraTexture.getHeight();
                            if (width > 0 && height > 0) {
                                this.isCameraReady = true;
                                this.log(`Camera ready! Frame size: ${width}x${height}`);
                                this.updateStatus("Camera ready - tap to capture");
                            }
                        }
                    });
                }
                // Show appropriate preview texture
                this.updatePreviewTexture();
                this.log("Camera initialized successfully");
                this.updateStatus("Waiting for camera...");
            }
            catch (error) {
                this.logError(`Failed to initialize camera: ${error}`);
                this.updateStatus("Camera initialization failed");
            }
        }
        /**
         * Wait for camera texture to be ready (have non-zero dimensions)
         * Returns true if ready, false if timeout
         */
        async waitForCameraReady(maxWaitMs = 3000) {
            if (this.isCameraReady) {
                return true;
            }
            const startTime = Date.now();
            const checkInterval = 0.1; // 100ms
            while (Date.now() - startTime < maxWaitMs) {
                // Check if camera texture has valid dimensions
                if (this.cameraTexture) {
                    const width = this.cameraTexture.getWidth();
                    const height = this.cameraTexture.getHeight();
                    if (width > 0 && height > 0) {
                        this.isCameraReady = true;
                        this.log(`Camera texture ready: ${width}x${height}`);
                        return true;
                    }
                }
                await this.delay(checkInterval);
            }
            this.logError(`Camera texture not ready after ${maxWaitMs}ms`);
            return false;
        }
        /**
         * Wait for the next frame to complete rendering
         * This is necessary for Render Target textures which may have dimensions
         * but no actual pixel data until the GPU completes rendering to them
         */
        waitForNextFrame() {
            return new Promise((resolve) => {
                // Use LateUpdateEvent to wait until end of current frame
                const lateUpdateEvent = this.createEvent("LateUpdateEvent");
                lateUpdateEvent.bind(() => {
                    // Remove the event after it fires once
                    lateUpdateEvent.enabled = false;
                    resolve();
                });
            });
        }
        /**
         * Handle capture button press (texture-based)
         */
        onCaptureButtonPressed() {
            if (this.isCapturing) {
                this.log("Capture already in progress, ignoring button press");
                return;
            }
            this.captureImage();
        }
        /**
         * Handle still capture button press (Camera Module API)
         */
        onStillCaptureButtonPressed() {
            if (this.isCapturing) {
                this.log("Capture already in progress, ignoring button press");
                return;
            }
            this.captureStillImage();
        }
        /**
         * Capture a single image and upload
         */
        async captureImage() {
            this.log("Starting image capture...");
            this.isCapturing = true;
            this.updateStatus("Capturing...");
            try {
                // Determine which texture to use
                let textureToCapture;
                if (this.useCompositeTexture && this.compositeTexture) {
                    // Use the pre-composed texture (AR content included)
                    textureToCapture = this.compositeTexture;
                    this.log("Using composite texture (AR content included)");
                    this.updateStatus("Capturing composite image...");
                    // Check if composite texture is loaded
                    const width = textureToCapture.getWidth();
                    const height = textureToCapture.getHeight();
                    if (width === 0 || height === 0) {
                        this.logError(`Composite texture not loaded (${width}x${height})`);
                        this.updateStatus("Composite texture not ready");
                        return;
                    }
                    // Log texture type info for debugging
                    const textureControl = textureToCapture.control;
                    this.log(`Composite texture dimensions: ${width}x${height}`);
                    this.log(`Composite texture control type: ${textureControl ? textureControl.getTypeName() : "none"}`);
                    // Check if this is a RenderTargetProvider (which needs a camera rendering to it)
                    if (textureControl) {
                        const controlType = textureControl.getTypeName();
                        if (controlType === "RenderTargetProvider") {
                            this.log("⚠️ Composite texture is a Render Target - ensure a camera is rendering to it");
                            this.log("HINT: The Render Target must have a Camera component with 'Render Target' set to this texture");
                        }
                    }
                    // For Render Target textures, wait for the next frame to ensure content is rendered
                    // This is necessary because Render Targets may have dimensions but no pixel data
                    // until the GPU completes rendering to them
                    this.log("Waiting for composite texture to be rendered...");
                    await this.waitForNextFrame();
                    await this.waitForNextFrame(); // Wait an extra frame for Render Targets
                    this.log("Frames complete, attempting to encode composite texture...");
                }
                else {
                    // Use camera texture (raw camera feed)
                    if (!this.cameraTexture) {
                        this.logError("Camera not initialized");
                        this.updateStatus("Camera not ready");
                        return;
                    }
                    // Wait for camera to be ready if it isn't
                    if (!this.isCameraReady) {
                        this.log("Waiting for camera to be ready...");
                        this.updateStatus("Waiting for camera...");
                        const ready = await this.waitForCameraReady(3000);
                        if (!ready) {
                            this.logError("Camera texture not ready - try again in a moment");
                            this.updateStatus("Camera not ready - try again");
                            return;
                        }
                    }
                    textureToCapture = this.cameraTexture;
                    this.log("Using camera texture (raw camera feed)");
                    this.updateStatus("Capturing camera image...");
                    // Double-check texture dimensions
                    const width = textureToCapture.getWidth();
                    const height = textureToCapture.getHeight();
                    if (width === 0 || height === 0) {
                        this.logError(`Camera texture has invalid dimensions: ${width}x${height}`);
                        this.updateStatus("Camera not ready");
                        return;
                    }
                    this.log(`Camera texture dimensions: ${width}x${height}`);
                }
                // Convert texture to JPEG data using Base64
                // For composite textures, retry up to 3 times with frame delays if encoding fails
                let imageData;
                const isComposite = this.useCompositeTexture && this.compositeTexture;
                const maxRetries = isComposite ? 3 : 1;
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        imageData = await this.textureToJPEG(textureToCapture);
                        break; // Success, exit retry loop
                    }
                    catch (encodeError) {
                        if (isComposite && attempt < maxRetries) {
                            this.log(`Composite texture encoding failed (attempt ${attempt}/${maxRetries}), waiting for next frame...`);
                            await this.waitForNextFrame();
                            this.log("Retrying composite texture encoding...");
                        }
                        else if (isComposite) {
                            // All retries failed for composite - provide guidance and offer fallback
                            this.logError(" Composite texture encoding failed after all retries");
                            this.log("═══════════════════════════════════════════════════════════════");
                            this.log("COMPOSITE TEXTURE TROUBLESHOOTING:");
                            this.log("1. Ensure a Camera component has 'Render Target' set to this texture");
                            this.log("2. The Camera must be actively rendering each frame");
                            this.log("3. Check that the Render Target texture format is compatible");
                            this.log("4. Try using 'Still Capture' button for high-quality images instead");
                            this.log("═══════════════════════════════════════════════════════════════");
                            // Offer to fall back to camera texture
                            if (this.cameraTexture && this.isCameraReady) {
                                this.log("Attempting fallback to camera texture...");
                                this.updateStatus("Trying camera fallback...");
                                try {
                                    imageData = await this.textureToJPEG(this.cameraTexture);
                                    this.log(" Fallback to camera texture successful!");
                                    // Update to indicate this was a fallback
                                    textureToCapture = this.cameraTexture;
                                    break;
                                }
                                catch (fallbackError) {
                                    this.logError(`Camera fallback also failed: ${fallbackError}`);
                                    throw encodeError; // Re-throw original error
                                }
                            }
                            else {
                                throw encodeError; // Re-throw on final attempt
                            }
                        }
                        else {
                            throw encodeError; // Re-throw for non-composite
                        }
                    }
                }
                // Generate unique filename with appropriate prefix
                // Note: if we fell back to camera, still use the original setting for naming
                const fileName = this.generateImageFileName();
                // Upload to Supabase
                const uploadSuccess = await this.uploadImageToSupabase(fileName, imageData);
                if (uploadSuccess) {
                    const captureType = this.useCompositeTexture ? "composite image" : "camera image";
                    this.log(`${captureType} captured and uploaded successfully!`);
                    this.updateStatus(`${captureType} uploaded!`);
                }
                else {
                    this.logError("Failed to upload image");
                    this.updateStatus("Upload failed");
                }
            }
            catch (error) {
                this.logError(`Image capture failed: ${error}`);
                this.updateStatus("Capture failed");
            }
            finally {
                this.isCapturing = false;
            }
        }
        /**
         * Capture high-quality still image using Camera Module API
         */
        async captureStillImage() {
            this.log("Starting high-quality still image capture...");
            this.isCapturing = true;
            this.updateStatus("Capturing still image...");
            try {
                // Check if still image capture is available
                this.log("Checking Camera Module availability...");
                if (!this.cameraModule) {
                    throw new Error("Camera Module not initialized");
                }
                // Create image request using Camera Module API
                this.log("Creating image request...");
                const imageRequest = CameraModule.createImageRequest();
                imageRequest.cameraId = this.cameraIdToUse;
                this.log(`Set camera ID to: ${this.cameraIdToUse}`);
                this.log("Requesting still image from Camera Module...");
                // Request the high-quality still image
                const imageFrame = await this.cameraModule.requestImage(imageRequest);
                // Log timestamp if available
                const timestamp = imageFrame.timestampMillis;
                if (timestamp !== undefined) {
                    this.log(`Still image captured successfully at timestamp: ${timestamp}ms`);
                }
                else {
                    this.log("Still image captured successfully");
                }
                // Get the texture from the image frame
                const stillTexture = imageFrame.texture;
                if (!stillTexture) {
                    throw new Error("Received null texture from image frame");
                }
                this.log(`Still texture dimensions: ${stillTexture.getWidth()}x${stillTexture.getHeight()}`);
                // Show in preview if available
                if (this.previewImage && stillTexture) {
                    this.previewImage.mainPass.baseTex = stillTexture;
                    this.log("Updated preview with still image");
                }
                // Convert texture to JPEG data
                this.log("Converting still image to JPEG...");
                const imageData = await this.textureToJPEG(stillTexture);
                // Generate filename for still image
                const fileName = this.generateStillImageFileName();
                // Upload to Supabase
                this.log("Uploading still image to Supabase...");
                const uploadSuccess = await this.uploadImageToSupabase(fileName, imageData);
                if (uploadSuccess) {
                    this.log("High-quality still image captured and uploaded successfully!");
                    this.updateStatus("Still image uploaded!");
                }
                else {
                    this.logError("Failed to upload still image");
                    this.updateStatus("Still upload failed");
                }
            }
            catch (error) {
                this.logError(`Still image capture failed: ${error}`);
                // Provide more helpful error messages
                const errorStr = error.toString();
                if (errorStr.includes("not supported") || errorStr.includes("not available")) {
                    this.updateStatus("Still capture not supported");
                    this.log("HINT: Still image capture requires camera permissions");
                    this.log("HINT: Check that your lens has 'Request Camera' capability enabled");
                    this.log("HINT: Try using the regular capture button instead");
                }
                else if (errorStr.includes("requirements") || errorStr.includes("permission")) {
                    this.updateStatus("Camera permission required");
                    this.log("HINT: Enable 'Request Camera' in Project Info > Capabilities");
                }
                else {
                    this.updateStatus(`Capture error: ${errorStr}`);
                }
            }
            finally {
                this.isCapturing = false;
            }
        }
        /**
         * Convert texture to JPEG data using Base64 encoding
         */
        async textureToJPEG(texture) {
            return new Promise((resolve, reject) => {
                try {
                    this.log("Converting texture to JPEG using Base64.encodeTextureAsync...");
                    const width = texture.getWidth();
                    const height = texture.getHeight();
                    this.log(`Texture dimensions: ${width}x${height}`);
                    // Validate texture is loaded before encoding
                    if (width === 0 || height === 0) {
                        const errorMsg = `Texture not loaded (dimensions: ${width}x${height}). The texture must be loaded before encoding.`;
                        this.logError(errorMsg);
                        reject(new Error(errorMsg));
                        return;
                    }
                    // Use Base64.encodeTextureAsync to get the real image data
                    Base64.encodeTextureAsync(texture, (encodedString) => {
                        this.log(`Successfully encoded texture to Base64 (${encodedString.length} characters)`);
                        try {
                            // Convert base64 string to Uint8Array
                            const binaryData = this.base64ToUint8Array(encodedString);
                            this.log(`Converted to ${binaryData.length} bytes of binary data`);
                            resolve(binaryData);
                        }
                        catch (conversionError) {
                            this.logError(`Failed to convert Base64 to Uint8Array: ${conversionError}`);
                            reject(conversionError);
                        }
                    }, () => {
                        this.logError("Base64.encodeTextureAsync failed - texture may not be loaded");
                        reject(new Error("Base64 encoding failed - ensure texture is loaded"));
                    }, CompressionQuality.HighQuality, EncodingType.Jpg);
                }
                catch (error) {
                    this.logError(`Error in textureToJPEG: ${error}`);
                    reject(error);
                }
            });
        }
        /**
         * Convert Base64 string to Uint8Array for binary upload
         */
        base64ToUint8Array(base64String) {
            const base64Data = base64String.includes(",") ? base64String.split(",")[1] : base64String;
            const binaryString = this.decodeBase64(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        }
        /**
         * Simple Base64 decoder
         */
        decodeBase64(base64) {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
            let result = "";
            let i = 0;
            base64 = base64.replace(/[^A-Za-z0-9+/]/g, "");
            while (i < base64.length) {
                const encoded1 = chars.indexOf(base64.charAt(i++));
                const encoded2 = chars.indexOf(base64.charAt(i++));
                const encoded3 = chars.indexOf(base64.charAt(i++));
                const encoded4 = chars.indexOf(base64.charAt(i++));
                const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
                result += String.fromCharCode((bitmap >> 16) & 255);
                if (encoded3 !== 64) {
                    result += String.fromCharCode((bitmap >> 8) & 255);
                }
                if (encoded4 !== 64) {
                    result += String.fromCharCode(bitmap & 255);
                }
            }
            return result;
        }
        /**
         * Upload image to Supabase storage
         */
        async uploadImageToSupabase(fileName, data) {
            try {
                this.log(`Uploading image to ${fileName}`);
                // Ensure we're authenticated before upload
                const isAuth = await this.ensureAuthenticated();
                if (!isAuth || !this.supabaseClient) {
                    this.logError("Supabase client not initialized or not authenticated");
                    return false;
                }
                this.log(`Data size: ${data.length} bytes`);
                this.log(`Bucket: ${this.storageBucket}`);
                this.log(`File path: ${fileName}`);
                const { data: uploadData, error } = await this.supabaseClient.storage
                    .from(this.storageBucket)
                    .upload(fileName, data, {
                    contentType: "image/jpeg",
                    upsert: true
                });
                if (error) {
                    this.logError(` Upload failed: ${JSON.stringify(error)}`);
                    return false;
                }
                else {
                    this.log(` Image uploaded successfully!`);
                    this.log(`Upload data: ${JSON.stringify(uploadData)}`);
                    return true;
                }
            }
            catch (error) {
                this.logError(`Failed to upload image: ${error}`);
                return false;
            }
        }
        /**
         * Generate unique image filename (texture-based capture)
         */
        generateImageFileName() {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 9);
            const prefix = this.useCompositeTexture ? "composite" : "camera";
            return `images/${prefix}_image_${timestamp}_${random}.jpg`;
        }
        /**
         * Generate unique filename for still image capture
         */
        generateStillImageFileName() {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 9);
            return `images/still_image_${timestamp}_${random}.jpg`;
        }
        /**
         * Update preview texture based on current mode
         */
        updatePreviewTexture() {
            if (this.previewImage) {
                if (this.useCompositeTexture && this.compositeTexture) {
                    // Show composite texture in preview
                    this.previewImage.mainPass.baseTex = this.compositeTexture;
                    this.log("Preview updated: showing composite texture");
                }
                else if (this.cameraTexture) {
                    // Show camera texture in preview
                    this.previewImage.mainPass.baseTex = this.cameraTexture;
                    this.log("Preview updated: showing camera texture");
                }
            }
        }
        /**
         * Switch between camera and composite texture modes
         */
        setUseCompositeTexture(useComposite) {
            this.useCompositeTexture = useComposite;
            this.log(`Switched to ${useComposite ? "composite" : "camera"} texture mode`);
            this.updatePreviewTexture();
            // Update status to reflect current mode
            const mode = useComposite ? "composite" : "camera";
            this.updateStatus(`Ready - ${mode} mode active`);
        }
        /**
         * Get current capture mode
         */
        isUsingCompositeTexture() {
            return this.useCompositeTexture && !!this.compositeTexture;
        }
        /**
         * Update status text
         */
        updateStatus(message) {
            if (this.statusText) {
                this.statusText.text = message;
            }
            this.log(`Status: ${message}`);
        }
        /**
         * Delay utility using DelayedCallbackEvent (Lens Studio alternative to setTimeout)
         */
        delay(seconds) {
            return new Promise((resolve) => {
                const delayEvent = this.createEvent("DelayedCallbackEvent");
                delayEvent.bind(() => {
                    resolve();
                });
                delayEvent.reset(seconds);
            });
        }
        /**
         * Logging helpers
         */
        log(message) {
            if (this.enableDebugLogs) {
                print(`[ImageCaptureUploader] ${message}`);
            }
        }
        logError(message) {
            print(`[ImageCaptureUploader] ERROR: ${message}`);
        }
    };
    __setFunctionName(_classThis, "ImageCaptureUploader");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ImageCaptureUploader = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ImageCaptureUploader = _classThis;
})();
exports.ImageCaptureUploader = ImageCaptureUploader;
//# sourceMappingURL=ImageCaptureUploader.js.map