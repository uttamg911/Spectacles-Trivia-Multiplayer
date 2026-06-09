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
exports.CompositeStreamingController = void 0;
var __selfType = requireType("./CompositeStreamingController");
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
const CaptureUtilities_1 = require("./CaptureUtilities");
/**
 * CompositeStreamingController - Synchronized live video and audio streaming
 *
 * COMPOSITE STREAMING: Streams both video frames and audio chunks simultaneously
 * via Supabase Realtime with synchronized session IDs for real-time viewing/listening.
 *
 * KEY FEATURES:
 * - Shared session ID for video and audio streams
 * - Synchronized timestamps for proper alignment
 * - Real-time transmission via Supabase Realtime
 * - Frame markers and audio chunks for streaming reconstruction
 */
let CompositeStreamingController = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var CompositeStreamingController = _classThis = class extends _classSuper {
        constructor() {
            super();
            // Supabase Configuration
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.streamingChannelName = this.streamingChannelName;
            // Video Configuration
            this.streamQuality = this.streamQuality;
            this.streamFPS = this.streamFPS;
            this.resolutionScale = this.resolutionScale;
            // Camera Configuration - USE CameraService to avoid conflicts!
            this.cameraService = this.cameraService;
            // Composite Texture Configuration
            this.useCompositeTexture = this.useCompositeTexture;
            this.compositeTexture = this.compositeTexture;
            // Audio Configuration
            this.microphoneAsset = this.microphoneAsset;
            this.sampleRate = this.sampleRate;
            this.chunkSizeMs = this.chunkSizeMs;
            this.compressionLevel = this.compressionLevel;
            // UI Components
            this.streamButton = this.streamButton;
            this.compositeSwitch = this.compositeSwitch;
            this.statusText = this.statusText;
            this.buttonText = this.buttonText;
            this.previewImage = this.previewImage;
            // Debug Configuration
            this.enableDebugLogs = this.enableDebugLogs;
            // Private State
            this.isStreaming = false;
            this.streamSessionId = "";
            this.streamStartTime = 0;
            // Video streaming state
            this.frameCount = 0;
            this.lastFrameTime = 0;
            // Audio streaming state
            this.audioChunkCount = 0;
            this.lastAudioChunkTime = 0;
            this.isRealtimeConnected = false;
        }
        __initialize() {
            super.__initialize();
            // Supabase Configuration
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.streamingChannelName = this.streamingChannelName;
            // Video Configuration
            this.streamQuality = this.streamQuality;
            this.streamFPS = this.streamFPS;
            this.resolutionScale = this.resolutionScale;
            // Camera Configuration - USE CameraService to avoid conflicts!
            this.cameraService = this.cameraService;
            // Composite Texture Configuration
            this.useCompositeTexture = this.useCompositeTexture;
            this.compositeTexture = this.compositeTexture;
            // Audio Configuration
            this.microphoneAsset = this.microphoneAsset;
            this.sampleRate = this.sampleRate;
            this.chunkSizeMs = this.chunkSizeMs;
            this.compressionLevel = this.compressionLevel;
            // UI Components
            this.streamButton = this.streamButton;
            this.compositeSwitch = this.compositeSwitch;
            this.statusText = this.statusText;
            this.buttonText = this.buttonText;
            this.previewImage = this.previewImage;
            // Debug Configuration
            this.enableDebugLogs = this.enableDebugLogs;
            // Private State
            this.isStreaming = false;
            this.streamSessionId = "";
            this.streamStartTime = 0;
            // Video streaming state
            this.frameCount = 0;
            this.lastFrameTime = 0;
            // Audio streaming state
            this.audioChunkCount = 0;
            this.lastAudioChunkTime = 0;
            this.isRealtimeConnected = false;
        }
        onAwake() {
            this.log("CompositeStreamingController initializing...");
            // Initialize utilities
            this.videoCapture = new CaptureUtilities_1.VideoCaptureUtility(this.enableDebugLogs);
            this.audioCapture = new CaptureUtilities_1.AudioCaptureUtility(this.enableDebugLogs);
            this.supabaseAuth = new CaptureUtilities_1.SupabaseAuthUtility(this.enableDebugLogs);
            // Validate requirements
            if (!this.snapCloudRequirements) {
                this.logError("SnapCloudRequirements not configured! Please assign in Inspector.");
                return;
            }
            if (!this.microphoneAsset) {
                this.logError("MicrophoneAsset not configured! Please assign an AudioTrackAsset in Inspector.");
                return;
            }
            // Initialize on start - button/switch initialization must happen after components are awake
            this.createEvent("OnStartEvent").bind(() => {
                this.setupUIHandlers();
                this.initializeCompositeStreaming();
            });
            // Cleanup on destroy
            this.createEvent("OnDestroyEvent").bind(() => {
                this.cleanup();
            });
            this.updateStatus("Ready for composite streaming");
            this.updateButtonText();
        }
        /**
         * Setup UI button and switch handlers - must be called after components are awake
         */
        setupUIHandlers() {
            // Setup button handler - call initialize() first to ensure events are ready
            if (this.streamButton) {
                this.streamButton.initialize();
                this.streamButton.onTriggerUp.add(() => {
                    this.onStreamButtonPressed();
                });
                this.log(" Stream button handler registered");
            }
            // Setup composite mode switch handler - call initialize() first
            if (this.compositeSwitch) {
                this.compositeSwitch.initialize();
                this.compositeSwitch.onValueChange.add((value) => {
                    const isComposite = value === 1;
                    this.log(`Composite switch changed to: ${isComposite}`);
                    this.useCompositeTexture = isComposite;
                    this.updatePreview();
                });
                this.log(`Composite switch initialized (default: ${this.useCompositeTexture})`);
            }
        }
        /**
         * Initialize composite streaming system
         */
        async initializeCompositeStreaming() {
            this.log("=== COMPOSITE STREAMING INITIALIZATION START ===");
            // Initialize Supabase authentication with Realtime options
            const authSuccess = await this.supabaseAuth.initializeAndAuthenticate(this.snapCloudRequirements);
            if (!authSuccess) {
                this.updateStatus("Authentication failed");
                return;
            }
            // Initialize video capture - prefer CameraService to avoid conflicts
            let videoSuccess = false;
            if (this.cameraService && this.cameraService.cameraTexture) {
                videoSuccess = this.videoCapture.initializeCameraFromService(this.cameraService.cameraTexture, this.cameraService.cameraTextureProvider);
            }
            else {
                this.log("⚠️ No CameraService provided - using fallback camera");
                videoSuccess = this.videoCapture.initializeCamera();
            }
            if (!videoSuccess) {
                this.updateStatus("Video initialization failed");
                return;
            }
            // Show preview (composite or camera)
            this.updatePreview();
            // Initialize audio capture
            const audioSuccess = this.audioCapture.initializeAudio(this.microphoneAsset, this.sampleRate);
            if (!audioSuccess) {
                this.updateStatus("Audio initialization failed");
                return;
            }
            // Create audio update event
            this.audioUpdateEvent = this.createEvent("UpdateEvent");
            this.audioUpdateEvent.bind(() => {
                this.processAudioForStreaming();
            });
            this.audioUpdateEvent.enabled = false;
            // Initialize Realtime channel
            await this.initializeRealtimeChannel();
            this.log("=== COMPOSITE STREAMING INITIALIZATION COMPLETE ===");
        }
        /**
         * Initialize Supabase Realtime channel for composite streaming
         */
        async initializeRealtimeChannel() {
            try {
                this.log("Initializing Supabase Realtime channel for composite streaming...");
                this.log(`Streaming channel: ${this.streamingChannelName}`);
                const supabaseClient = this.supabaseAuth.getSupabaseClient();
                if (!supabaseClient) {
                    this.logError("Supabase client not initialized");
                    return;
                }
                // Create realtime channel for composite streaming
                this.realtimeChannel = supabaseClient.channel(this.streamingChannelName, {
                    config: {
                        broadcast: { self: false } // Don't receive own broadcasts
                    }
                });
                // Listen for viewer connections and control messages
                this.realtimeChannel
                    .on("broadcast", { event: "viewer-joined" }, (msg) => {
                    this.log(`New composite viewer joined: ${msg.payload.viewerId}`);
                })
                    .on("broadcast", { event: "viewer-left" }, (msg) => {
                    this.log(`Composite viewer left: ${msg.payload.viewerId}`);
                })
                    .on("broadcast", { event: "stream-control" }, (msg) => {
                    this.handleStreamControl(msg.payload);
                });
                // Subscribe to channel
                this.realtimeChannel.subscribe(async (status) => {
                    this.log(`Composite streaming channel status: ${status}`);
                    if (status === "SUBSCRIBED") {
                        this.log(" Composite streaming channel connected successfully!");
                        this.isRealtimeConnected = true;
                        this.updateStatus("Ready for composite streaming");
                        // Send stream initialization message
                        this.sendStreamInitMessage();
                    }
                    else if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                        this.log("Composite streaming channel closed or error occurred");
                        this.isRealtimeConnected = false;
                        this.updateStatus("Streaming channel disconnected");
                    }
                });
            }
            catch (error) {
                this.logError(`Failed to initialize composite streaming channel: ${error}`);
                this.updateStatus("Streaming channel initialization failed");
            }
        }
        /**
         * Send composite stream initialization message
         */
        sendStreamInitMessage() {
            this.log(`Composite stream channel: ${this.streamingChannelName}`);
            // Send composite stream initialization
            this.sendStreamMessage({
                event: "composite-stream-init",
                payload: {
                    channelName: this.streamingChannelName,
                    streamerId: this.supabaseAuth.getUserId() || "spectacles_user",
                    timestamp: Date.now(),
                    settings: {
                        video: {
                            fps: this.streamFPS,
                            quality: this.streamQuality,
                            resolution: this.resolutionScale
                        },
                        audio: {
                            sampleRate: this.sampleRate,
                            chunkSizeMs: this.chunkSizeMs,
                            compression: this.compressionLevel
                        }
                    }
                }
            });
        }
        /**
         * Handle stream control messages
         */
        handleStreamControl(payload) {
            switch (payload.action) {
                case "request-higher-quality":
                    this.log("Viewer requested higher quality");
                    this.streamQuality = Math.min(this.streamQuality + 20, 100);
                    break;
                case "request-lower-quality":
                    this.log("Viewer requested lower quality due to bandwidth");
                    this.streamQuality = Math.max(this.streamQuality - 20, 20);
                    break;
                case "mute-audio":
                    this.log("Audio muted by viewer/admin");
                    // Could implement audio muting here
                    break;
                case "stop-stream":
                    this.log("Composite stream stopped by viewer/admin");
                    this.stopStreaming();
                    break;
                default:
                    this.log(`Unknown composite stream control action: ${payload.action}`);
            }
        }
        /**
         * Handle stream button press
         */
        onStreamButtonPressed() {
            if (this.isStreaming) {
                this.stopStreaming();
            }
            else {
                this.startStreaming();
            }
            this.updateButtonText();
        }
        /**
         * Start synchronized video and audio streaming
         */
        startStreaming() {
            if (!this.isRealtimeConnected) {
                this.logError("Realtime not ready for streaming");
                this.updateStatus("Streaming not ready");
                return;
            }
            const cameraTextureProvider = this.videoCapture.getCameraTextureProvider();
            if (!cameraTextureProvider) {
                this.logError("Camera not ready for streaming");
                this.updateStatus("Camera not ready");
                return;
            }
            this.log("Starting composite streaming...");
            this.isStreaming = true;
            this.streamSessionId = CaptureUtilities_1.SessionUtility.generateSessionId("composite_stream");
            this.streamStartTime = Date.now();
            this.frameCount = 0;
            this.audioChunkCount = 0;
            this.lastFrameTime = 0;
            this.lastAudioChunkTime = 0;
            this.updateStatus("Streaming video + audio live...");
            this.updateButtonText();
            // Start audio streaming
            this.audioCapture.startRecording();
            this.audioUpdateEvent.enabled = true;
            // Calculate frame interval based on desired FPS
            const frameInterval = 1000 / this.streamFPS;
            // Start video streaming (Remote ARsistance pattern)
            this.frameRegistration = cameraTextureProvider.onNewFrame.add(() => {
                const currentTime = Date.now();
                // Check if we should stream this frame based on FPS
                if (currentTime - this.lastFrameTime >= frameInterval) {
                    this.lastFrameTime = currentTime;
                    this.streamVideoFrame(currentTime);
                }
            });
            // Notify viewers that composite stream started
            this.sendStreamMessage({
                event: "composite-stream-started",
                payload: {
                    sessionId: this.streamSessionId,
                    timestamp: Date.now(),
                    streamType: "composite"
                }
            });
            this.log("Composite streaming started successfully");
        }
        /**
         * Stream video frame via Realtime
         */
        async streamVideoFrame(timestamp) {
            if (!this.isStreaming)
                return;
            this.frameCount++;
            try {
                // Choose between composite texture or camera texture
                let textureToStream;
                let textureSource;
                if (this.useCompositeTexture && this.compositeTexture) {
                    textureToStream = this.compositeTexture;
                    textureSource = "composite";
                }
                else {
                    textureToStream = this.videoCapture.getCameraTexture();
                    textureSource = "camera";
                }
                if (!textureToStream) {
                    this.logError(`${textureSource} texture not available for streaming`);
                    return;
                }
                // Convert texture to base64 with frame marker (Remote ARsistance pattern)
                const base64Frame = await this.textureToBase64(textureToStream);
                const frameData = base64Frame + "|||FRAME_END|||";
                // Send video frame via Realtime broadcast
                this.sendStreamMessage({
                    event: "composite-video-frame",
                    payload: {
                        sessionId: this.streamSessionId,
                        frameNumber: this.frameCount,
                        timestamp: timestamp,
                        frameData: frameData,
                        metadata: {
                            fps: this.streamFPS,
                            quality: this.streamQuality,
                            resolution: this.resolutionScale,
                            source: textureSource // Track whether using camera or composite
                        }
                    }
                });
            }
            catch (error) {
                this.logError(`Failed to stream video frame ${this.frameCount}: ${error}`);
            }
        }
        /**
         * Process and stream audio
         */
        processAudioForStreaming() {
            if (!this.isStreaming)
                return;
            const audioFrame = this.audioCapture.processAudioFrame();
            if (!audioFrame)
                return;
            // Check if enough time has passed for audio chunk
            const currentTime = Date.now();
            if (currentTime - this.lastAudioChunkTime >= this.chunkSizeMs) {
                this.streamAudioChunk(currentTime);
                this.lastAudioChunkTime = currentTime;
            }
        }
        /**
         * Stream audio chunk via Realtime
         */
        streamAudioChunk(timestamp) {
            try {
                this.audioChunkCount++;
                // Get current audio buffer
                const audioFrames = this.audioCapture.getCurrentAudioBuffer();
                if (audioFrames.length === 0)
                    return;
                // Combine audio frames and convert to base64
                const combinedAudio = this.combineAudioFrames(audioFrames);
                const audioData = this.audioArrayToBase64(combinedAudio);
                // Send audio chunk via Realtime broadcast
                this.sendStreamMessage({
                    event: "composite-audio-chunk",
                    payload: {
                        sessionId: this.streamSessionId,
                        chunkNumber: this.audioChunkCount,
                        timestamp: timestamp,
                        audioData: audioData,
                        sampleRate: this.sampleRate,
                        samples: combinedAudio.length
                    }
                });
                // Clear the audio buffer after streaming
                this.audioCapture.clearAudioBuffer();
            }
            catch (error) {
                this.logError(`Failed to stream audio chunk ${this.audioChunkCount}: ${error}`);
            }
        }
        /**
         * Convert texture to base64 for streaming
         */
        async textureToBase64(texture) {
            return new Promise((resolve, reject) => {
                try {
                    const compressionQuality = this.streamQuality > 70 ? CompressionQuality.HighQuality : CompressionQuality.IntermediateQuality;
                    Base64.encodeTextureAsync(texture, (encodedString) => {
                        resolve(encodedString);
                    }, () => {
                        reject(new Error("Base64 encoding failed"));
                    }, compressionQuality, EncodingType.Jpg);
                }
                catch (error) {
                    reject(error);
                }
            });
        }
        /**
         * Combine audio frames into single Float32Array
         */
        combineAudioFrames(frames) {
            if (frames.length === 0)
                return new Float32Array(0);
            let totalSamples = 0;
            for (const frame of frames) {
                totalSamples += frame.length;
            }
            const combined = new Float32Array(totalSamples);
            let offset = 0;
            for (const frame of frames) {
                combined.set(frame, offset);
                offset += frame.length;
            }
            return combined;
        }
        /**
         * Convert Float32Array audio data to WAV format base64 for streaming (same as AudioStreamingController)
         */
        audioArrayToBase64(audioArray) {
            // Convert Float32Array to WAV format
            const wavData = this.audioArrayToWav(audioArray);
            // Convert WAV data to base64 for transmission
            return this.uint8ArrayToBase64(wavData);
        }
        /**
         * Convert Float32Array to WAV format Uint8Array (same as AudioStreamingController)
         */
        audioArrayToWav(audioArray) {
            const totalSamples = audioArray.length;
            // Convert Float32 audio to 16-bit PCM for WAV
            const pcmData = new Int16Array(totalSamples);
            for (let i = 0; i < totalSamples; i++) {
                // Convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767)
                const sample = Math.max(-1, Math.min(1, audioArray[i]));
                pcmData[i] = sample * 32767;
            }
            // Create WAV header
            const wavHeader = this.createWavHeader(totalSamples, this.sampleRate, 1, 16);
            // Combine header and PCM data
            const wavData = new Uint8Array(wavHeader.length + pcmData.length * 2);
            wavData.set(wavHeader, 0);
            wavData.set(new Uint8Array(pcmData.buffer), wavHeader.length);
            return wavData;
        }
        /**
         * Create WAV file header (same as AudioStreamingController)
         */
        createWavHeader(numSamples, sampleRate, channels, bitsPerSample) {
            const byteRate = sampleRate * channels * (bitsPerSample / 8);
            const blockAlign = channels * (bitsPerSample / 8);
            const dataSize = numSamples * channels * (bitsPerSample / 8);
            const fileSize = 36 + dataSize;
            const header = new ArrayBuffer(44);
            const view = new DataView(header);
            // RIFF chunk descriptor
            view.setUint32(0, 0x52494646, false); // "RIFF"
            view.setUint32(4, fileSize, true); // File size
            view.setUint32(8, 0x57415645, false); // "WAVE"
            // fmt sub-chunk
            view.setUint32(12, 0x666d7420, false); // "fmt "
            view.setUint32(16, 16, true); // Sub-chunk size
            view.setUint16(20, 1, true); // Audio format (1 = PCM)
            view.setUint16(22, channels, true); // Number of channels
            view.setUint32(24, sampleRate, true); // Sample rate
            view.setUint32(28, byteRate, true); // Byte rate
            view.setUint16(32, blockAlign, true); // Block align
            view.setUint16(34, bitsPerSample, true); // Bits per sample
            // data sub-chunk
            view.setUint32(36, 0x64617461, false); // "data"
            view.setUint32(40, dataSize, true); // Data size
            return new Uint8Array(header);
        }
        /**
         * Convert Uint8Array to base64 string
         */
        uint8ArrayToBase64(bytes) {
            // Convert to binary string
            let binary = "";
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            // Simple base64 encoding
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
            let result = "";
            let i = 0;
            while (i < binary.length) {
                const a = binary.charCodeAt(i++);
                const b = i < binary.length ? binary.charCodeAt(i++) : 0;
                const c = i < binary.length ? binary.charCodeAt(i++) : 0;
                const bitmap = (a << 16) | (b << 8) | c;
                result += chars.charAt((bitmap >> 18) & 63);
                result += chars.charAt((bitmap >> 12) & 63);
                result += i - 2 < binary.length ? chars.charAt((bitmap >> 6) & 63) : "=";
                result += i - 1 < binary.length ? chars.charAt(bitmap & 63) : "=";
            }
            return result;
        }
        /**
         * Stop composite streaming
         */
        stopStreaming() {
            if (!this.isStreaming)
                return;
            this.log("Stopping composite streaming...");
            this.isStreaming = false;
            // Stop video streaming
            if (this.frameRegistration) {
                const cameraTextureProvider = this.videoCapture.getCameraTextureProvider();
                if (cameraTextureProvider) {
                    cameraTextureProvider.onNewFrame.remove(this.frameRegistration);
                }
                this.frameRegistration = null;
            }
            // Stop audio streaming
            this.audioCapture.stopRecording();
            this.audioUpdateEvent.enabled = false;
            // Notify viewers that composite stream ended
            this.sendStreamMessage({
                event: "composite-stream-ended",
                payload: {
                    sessionId: this.streamSessionId,
                    timestamp: Date.now(),
                    totalFrames: this.frameCount,
                    totalAudioChunks: this.audioChunkCount,
                    duration: Date.now() - this.streamStartTime
                }
            });
            const duration = (Date.now() - this.streamStartTime) / 1000;
            this.log(`Composite streaming complete: ${this.frameCount} frames, ${this.audioChunkCount} audio chunks in ${duration.toFixed(1)}s`);
            this.updateStatus(`Stream ended: ${this.frameCount} frames + ${this.audioChunkCount} audio chunks`);
            this.updateButtonText();
        }
        /**
         * Send message via Supabase Realtime
         */
        sendStreamMessage(message) {
            if (this.realtimeChannel && this.isRealtimeConnected) {
                try {
                    this.realtimeChannel.send({
                        type: "broadcast",
                        event: message.event,
                        payload: message.payload
                    });
                }
                catch (error) {
                    this.logError(`Failed to send composite stream message: ${error}`);
                }
            }
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
         * Update button text based on streaming state
         */
        updateButtonText() {
            if (this.buttonText) {
                if (this.isStreaming) {
                    this.buttonText.text = "Stop Composite Stream";
                }
                else {
                    this.buttonText.text = "Start Composite Stream";
                }
            }
        }
        /**
         * Update preview to show what will be streamed
         */
        updatePreview() {
            if (this.previewImage) {
                if (this.useCompositeTexture && this.compositeTexture) {
                    this.previewImage.mainPass.baseTex = this.compositeTexture;
                    this.log("Preview: showing composite texture (AR content included)");
                }
                else {
                    const cameraTexture = this.videoCapture.getCameraTexture();
                    if (cameraTexture) {
                        this.previewImage.mainPass.baseTex = cameraTexture;
                        this.log("Preview: showing camera texture");
                    }
                }
            }
        }
        /**
         * Cleanup resources
         */
        cleanup() {
            // Stop streaming if active
            if (this.isStreaming) {
                this.stopStreaming();
            }
            // Close Realtime connection
            if (this.realtimeChannel && this.isRealtimeConnected) {
                this.log("Closing composite streaming channel...");
                const supabaseClient = this.supabaseAuth.getSupabaseClient();
                if (supabaseClient) {
                    supabaseClient.removeChannel(this.realtimeChannel);
                }
                this.isRealtimeConnected = false;
            }
        }
        /**
         * Logging helpers
         */
        log(message) {
            if (this.enableDebugLogs) {
                print(`[CompositeStreamingController] ${message}`);
            }
        }
        logError(message) {
            print(`[CompositeStreamingController] ERROR: ${message}`);
        }
    };
    __setFunctionName(_classThis, "CompositeStreamingController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CompositeStreamingController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CompositeStreamingController = _classThis;
})();
exports.CompositeStreamingController = CompositeStreamingController;
//# sourceMappingURL=CompositeStreamingController.js.map