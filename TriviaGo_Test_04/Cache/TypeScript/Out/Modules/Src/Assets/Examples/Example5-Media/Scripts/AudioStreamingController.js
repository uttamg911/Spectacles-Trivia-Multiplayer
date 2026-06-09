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
exports.AudioStreamingController = void 0;
var __selfType = requireType("./AudioStreamingController");
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
/**
 * AudioStreamingController - Live audio streaming to Supabase Realtime for real-time communication
 * Based on VideoStreamingController pattern - streams audio for live listening, no storage
 *
 * KEY DIFFERENCE from AudioCaptureUploader:
 * - This STREAMS for live communication (no file storage)
 * - AudioCaptureUploader UPLOADS for audio files (stores files)
 */
let AudioStreamingController = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var AudioStreamingController = _classThis = class extends _classSuper {
        constructor() {
            super();
            // Core Modules (using same pattern as AudioCaptureUploader)
            // Supabase Configuration
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.streamingChannelName = this.streamingChannelName;
            // Audio Configuration
            this.microphoneAsset = this.microphoneAsset;
            this.sampleRate = this.sampleRate;
            this.chunkSizeMs = this.chunkSizeMs;
            this.compressionLevel = this.compressionLevel;
            // UI Components
            this.streamButton = this.streamButton;
            this.statusText = this.statusText;
            this.buttonText = this.buttonText;
            // Debug Configuration
            this.enableDebugLogs = this.enableDebugLogs;
            // Private State
            this.isStreaming = false;
            this.streamSessionId = "";
            this.chunkCount = 0;
            this.streamStartTime = 0;
            this.audioBuffer = [];
            this.numberOfSamples = 0;
            this.isAuthenticated = false;
            this.isRealtimeConnected = false;
        }
        __initialize() {
            super.__initialize();
            // Core Modules (using same pattern as AudioCaptureUploader)
            // Supabase Configuration
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.streamingChannelName = this.streamingChannelName;
            // Audio Configuration
            this.microphoneAsset = this.microphoneAsset;
            this.sampleRate = this.sampleRate;
            this.chunkSizeMs = this.chunkSizeMs;
            this.compressionLevel = this.compressionLevel;
            // UI Components
            this.streamButton = this.streamButton;
            this.statusText = this.statusText;
            this.buttonText = this.buttonText;
            // Debug Configuration
            this.enableDebugLogs = this.enableDebugLogs;
            // Private State
            this.isStreaming = false;
            this.streamSessionId = "";
            this.chunkCount = 0;
            this.streamStartTime = 0;
            this.audioBuffer = [];
            this.numberOfSamples = 0;
            this.isAuthenticated = false;
            this.isRealtimeConnected = false;
        }
        onAwake() {
            this.log("AudioStreamingController initializing...");
            // Calculate audio settings
            this.samplesPerChunk = Math.floor((this.sampleRate * this.chunkSizeMs) / 1000);
            this.targetChunkSize = this.samplesPerChunk * 4; // 4 bytes per Float32
            // Validate requirements
            if (!this.snapCloudRequirements) {
                this.logError("SnapCloudRequirements not configured! Please assign in Inspector.");
                return;
            }
            // Initialize on start - button initialization must happen after components are awake
            this.createEvent("OnStartEvent").bind(() => {
                this.setupUIHandlers();
                this.initializeSupabaseAuthentication();
            });
            // Cleanup on destroy
            this.createEvent("OnDestroyEvent").bind(() => {
                this.cleanup();
            });
            this.updateStatus("Ready to stream audio");
            this.updateButtonText();
        }
        /**
         * Setup UI button handlers - must be called after components are awake
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
        }
        /**
         * Initialize Supabase authentication
         */
        async initializeSupabaseAuthentication() {
            this.log("=== AUDIO STREAMING AUTHENTICATION START ===");
            if (!this.snapCloudRequirements || !this.snapCloudRequirements.isConfigured()) {
                this.logError("SnapCloudRequirements not configured");
                return;
            }
            const supabaseProject = this.snapCloudRequirements.getSupabaseProject();
            this.log(`Supabase URL: ${supabaseProject.url}`);
            // Create Supabase client
            const { createClient } = require("SupabaseClient.lspkg/supabase-snapcloud");
            const options = {
                realtime: {
                    heartbeatIntervalMs: 2500
                }
            };
            this.supabaseClient = createClient(supabaseProject.url, supabaseProject.publicToken, options);
            this.log("Supabase client created for audio streaming");
            if (this.supabaseClient) {
                await this.signInUser();
                this.initializeAudioInput();
                this.initializeRealtimeChannel();
            }
        }
        /**
         * Sign in user using Snap Cloud authentication
         */
        async signInUser() {
            this.log("Attempting Snap Cloud authentication for audio streaming...");
            try {
                const { data, error } = await this.supabaseClient.auth.signInWithIdToken({
                    provider: "snapchat",
                    token: ""
                });
                if (error) {
                    this.logError("Sign in error: " + JSON.stringify(error));
                    this.isAuthenticated = false;
                }
                else {
                    const { user } = data;
                    if (user?.id) {
                        this.uid = user.id;
                        this.isAuthenticated = true;
                        this.log(` Authenticated for audio streaming as user: ${this.uid}`);
                    }
                    else {
                        this.logError("User ID not found in authentication response");
                        this.isAuthenticated = false;
                    }
                }
            }
            catch (error) {
                this.logError(`Authentication exception: ${error}`);
                this.isAuthenticated = false;
            }
            this.log("=== AUDIO STREAMING AUTHENTICATION END ===");
        }
        /**
         * Initialize audio input for streaming
         */
        initializeAudioInput() {
            try {
                this.log("Initializing audio input for streaming...");
                if (!this.microphoneAsset) {
                    this.logError("MicrophoneAsset not configured! Please assign an AudioTrackAsset in Inspector.");
                    this.updateStatus("Audio asset missing");
                    return;
                }
                // Initialize microphone control and set sample rate
                this.microphoneControl = this.microphoneAsset.control;
                this.log(`Requested sample rate: ${this.sampleRate} Hz`);
                this.microphoneControl.sampleRate = this.sampleRate;
                // Read back the actual sample rate (may differ from requested)
                const actualSampleRate = this.microphoneControl.sampleRate;
                this.log(`Actual microphone sample rate: ${actualSampleRate} Hz`);
                if (actualSampleRate !== this.sampleRate) {
                    this.log(`⚠️ Sample rate mismatch! Requested ${this.sampleRate}, got ${actualSampleRate}`);
                    this.log(`Using actual rate ${actualSampleRate} to prevent pitch issues`);
                    this.sampleRate = actualSampleRate; // Use actual rate for correct playback
                }
                // Create audio update event for streaming
                this.audioUpdateEvent = this.createEvent("UpdateEvent");
                this.audioUpdateEvent.bind(() => {
                    this.processAudioForStreaming();
                });
                this.audioUpdateEvent.enabled = false;
                this.log(`Audio input initialized - Sample rate: ${this.sampleRate}Hz, Chunk size: ${this.chunkSizeMs}ms`);
                this.updateStatus(`Audio ready (${this.sampleRate} Hz)`);
            }
            catch (error) {
                this.logError(`Failed to initialize audio input: ${error}`);
                this.updateStatus("Audio initialization failed");
            }
        }
        /**
         * Initialize Supabase Realtime channel for live audio streaming
         */
        async initializeRealtimeChannel() {
            try {
                this.log("Initializing Supabase Realtime channel for audio streaming...");
                this.log(`Audio streaming channel: ${this.streamingChannelName}`);
                if (!this.supabaseClient) {
                    this.logError("Supabase client not initialized");
                    return;
                }
                // Create realtime channel for audio streaming
                this.realtimeChannel = this.supabaseClient.channel(this.streamingChannelName, {
                    config: {
                        broadcast: { self: false } // Don't receive own broadcasts
                    }
                });
                // Listen for listener connections and control messages
                this.realtimeChannel
                    .on("broadcast", { event: "listener-joined" }, (msg) => {
                    this.log(`Audio listener joined: ${msg.payload.listenerId}`);
                })
                    .on("broadcast", { event: "listener-left" }, (msg) => {
                    this.log(`Audio listener left: ${msg.payload.listenerId}`);
                })
                    .on("broadcast", { event: "stream-control" }, (msg) => {
                    this.handleStreamControl(msg.payload);
                });
                // Subscribe to channel
                this.realtimeChannel.subscribe(async (status) => {
                    this.log(`Audio streaming channel status: ${status}`);
                    if (status === "SUBSCRIBED") {
                        this.log(" Audio streaming channel connected successfully!");
                        this.isRealtimeConnected = true;
                        this.updateStatus("Ready to stream audio live");
                        // Send initial audio stream info
                        this.sendStreamMessage({
                            event: "audio-stream-init",
                            payload: {
                                channelName: this.streamingChannelName,
                                streamerId: this.uid || "spectacles_user",
                                timestamp: Date.now(),
                                audioSettings: {
                                    sampleRate: this.sampleRate,
                                    chunkSizeMs: this.chunkSizeMs,
                                    compression: this.compressionLevel
                                }
                            }
                        });
                    }
                    else if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                        this.log("Audio streaming channel closed or error occurred");
                        this.isRealtimeConnected = false;
                        this.updateStatus("Audio streaming channel disconnected");
                    }
                });
            }
            catch (error) {
                this.logError(`Failed to initialize audio streaming channel: ${error}`);
                this.updateStatus("Audio streaming channel initialization failed");
            }
        }
        /**
         * Handle stream control messages
         */
        handleStreamControl(payload) {
            switch (payload.action) {
                case "mute":
                    this.log("Audio stream muted by listener/admin");
                    this.stopStreaming();
                    break;
                case "adjust-quality":
                    this.log(`Audio quality adjustment requested: ${payload.quality}`);
                    // Could adjust compression level here
                    break;
                case "stop-stream":
                    this.log("Audio stream stopped by listener/admin");
                    this.stopStreaming();
                    break;
                default:
                    this.log(`Unknown audio stream control action: ${payload.action}`);
            }
        }
        /**
         * Handle stream button press - toggle streaming
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
         * Start live audio streaming
         */
        startStreaming() {
            if (!this.microphoneControl || !this.isRealtimeConnected) {
                this.logError("Audio input or Realtime not ready for streaming");
                this.updateStatus("Audio not ready for streaming");
                return;
            }
            this.log("Starting live audio streaming...");
            this.isStreaming = true;
            this.streamSessionId = this.generateSessionId();
            this.chunkCount = 0;
            this.streamStartTime = Date.now();
            this.audioBuffer = [];
            this.numberOfSamples = 0;
            this.updateStatus("Streaming audio live...");
            this.updateButtonText();
            // Start microphone and audio processing
            this.microphoneControl.start();
            this.audioUpdateEvent.enabled = true;
            // Start streaming interval with buffer management
            this.streamingInterval = this.createEvent("DelayedCallbackEvent");
            this.streamingInterval.bind(() => {
                // Only process if we have enough audio data for consistent chunks
                const targetSamples = (this.chunkSizeMs / 1000) * this.sampleRate;
                if (this.numberOfSamples >= targetSamples * 0.8) {
                    // 80% of target for smoother streaming
                    this.processAudioChunk();
                }
                else {
                    this.log(`Skipping chunk - insufficient samples: ${this.numberOfSamples}/${targetSamples}`);
                }
                if (this.isStreaming) {
                    // Continue streaming with consistent timing
                    this.streamingInterval.reset(this.chunkSizeMs / 1000);
                }
            });
            this.streamingInterval.reset(this.chunkSizeMs / 1000);
            // Notify listeners that audio stream started
            this.sendStreamMessage({
                event: "audio-stream-started",
                payload: {
                    sessionId: this.streamSessionId,
                    timestamp: Date.now()
                }
            });
            this.log("Audio streaming started successfully");
        }
        /**
         * Process and stream audio chunk
         */
        processAudioChunk() {
            if (!this.isStreaming || this.audioBuffer.length === 0)
                return;
            try {
                this.chunkCount++;
                this.log(`=== PROCESSING AUDIO STREAMING CHUNK ${this.chunkCount} ===`);
                this.log(`Audio buffer frames: ${this.audioBuffer.length}`);
                this.log(`Total samples buffered: ${this.numberOfSamples}`);
                // Combine all buffered audio frames
                const combinedAudio = this.combineAudioFrames(this.audioBuffer);
                this.log(`Combined audio samples: ${combinedAudio.length}`);
                // Convert Float32Array to base64 for transmission
                const audioData = this.audioArrayToBase64(combinedAudio);
                this.log(`Base64 data size: ${audioData.length} characters`);
                // Stream audio data via Realtime (match HTML listener expectations)
                this.sendStreamMessage({
                    event: "audio-chunk",
                    payload: {
                        sessionId: this.streamSessionId,
                        chunkNumber: this.chunkCount,
                        timestamp: Date.now(),
                        data: audioData, // WAV format base64 data
                        metadata: {
                            sampleRate: this.sampleRate,
                            samples: combinedAudio.length,
                            format: "wav",
                            channels: 1,
                            bitsPerSample: 16
                        }
                    }
                });
                this.log(` Audio chunk ${this.chunkCount} streamed successfully (WAV format)`);
                this.log(`=== STREAMING CHUNK ${this.chunkCount} COMPLETE ===`);
                // Update status with streaming info
                const duration = Math.floor((Date.now() - this.streamStartTime) / 1000);
                const chunkDurationMs = ((combinedAudio.length / this.sampleRate) * 1000).toFixed(1);
                this.updateStatus(`Streaming: ${this.chunkCount} chunks (${duration}s) - Last: ${chunkDurationMs}ms`);
                // Clear the buffer after streaming
                this.audioBuffer = [];
                this.numberOfSamples = 0;
            }
            catch (error) {
                this.logError(`Failed to process audio chunk ${this.chunkCount}: ${error}`);
            }
        }
        /**
         * Process audio for streaming (called every update when streaming)
         */
        processAudioForStreaming() {
            if (!this.isStreaming || !this.microphoneControl)
                return;
            const frameSize = this.microphoneControl.maxFrameSize;
            let audioFrame = new Float32Array(frameSize);
            // Get audio frame shape
            const audioFrameShape = this.microphoneControl.getAudioFrame(audioFrame);
            // If no audio data, return early
            if (audioFrameShape.x === 0) {
                return;
            }
            // Reduce the subarray size to the actual data
            audioFrame = audioFrame.subarray(0, audioFrameShape.x);
            // Add to buffer for streaming
            this.audioBuffer.push(audioFrame);
            this.numberOfSamples += audioFrameShape.x;
        }
        /**
         * Combine audio frames into single Float32Array
         */
        combineAudioFrames(frames) {
            if (frames.length === 0)
                return new Float32Array(0);
            // Calculate total samples
            let totalSamples = 0;
            for (const frame of frames) {
                totalSamples += frame.length;
            }
            // Create combined array
            const combined = new Float32Array(totalSamples);
            let offset = 0;
            for (const frame of frames) {
                combined.set(frame, offset);
                offset += frame.length;
            }
            return combined;
        }
        /**
         * Convert Float32Array audio data to WAV format base64 for streaming
         */
        audioArrayToBase64(audioArray) {
            // Convert Float32Array to WAV format (similar to AudioCaptureUploader)
            const wavData = this.audioArrayToWav(audioArray);
            // Convert WAV data to base64 for transmission
            return this.uint8ArrayToBase64(wavData);
        }
        /**
         * Convert Float32Array to WAV format Uint8Array
         */
        audioArrayToWav(audioArray) {
            const totalSamples = audioArray.length;
            this.log(`Converting ${totalSamples} samples to WAV for streaming`);
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
            const durationSeconds = totalSamples / this.sampleRate;
            this.log(`Created WAV chunk: ${totalSamples} samples, ${durationSeconds.toFixed(3)}s duration`);
            return wavData;
        }
        /**
         * Create WAV file header
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
         * Stop live audio streaming
         */
        stopStreaming() {
            if (!this.isStreaming)
                return;
            this.log("Stopping live audio streaming...");
            this.isStreaming = false;
            // Stop microphone recording
            if (this.microphoneControl) {
                this.microphoneControl.stop();
            }
            if (this.audioUpdateEvent) {
                this.audioUpdateEvent.enabled = false;
            }
            // Stop streaming interval
            if (this.streamingInterval) {
                // The interval will stop itself on next iteration when isStreaming is false
                this.streamingInterval = null;
            }
            // Notify listeners that audio stream ended
            this.sendStreamMessage({
                event: "audio-stream-ended",
                payload: {
                    sessionId: this.streamSessionId,
                    timestamp: Date.now(),
                    totalChunks: this.chunkCount,
                    duration: Date.now() - this.streamStartTime
                }
            });
            const duration = (Date.now() - this.streamStartTime) / 1000;
            this.log(`Audio streaming complete: ${this.chunkCount} chunks in ${duration.toFixed(1)}s`);
            this.updateStatus(`Stream ended: ${this.chunkCount} chunks streamed`);
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
                    this.logError(`Failed to send audio stream message: ${error}`);
                }
            }
        }
        /**
         * Generate unique session ID
         */
        generateSessionId() {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 9);
            return `audio_stream_${timestamp}_${random}`;
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
                    this.buttonText.text = "Stop Audio Stream";
                }
                else {
                    this.buttonText.text = "Start Audio Stream";
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
            // Stop microphone
            if (this.microphoneControl) {
                this.microphoneControl.stop();
            }
            if (this.audioUpdateEvent) {
                this.audioUpdateEvent.enabled = false;
            }
            // Close Realtime connection
            if (this.realtimeChannel && this.isRealtimeConnected) {
                this.log("Closing audio streaming channel...");
                this.supabaseClient.removeChannel(this.realtimeChannel);
                this.isRealtimeConnected = false;
            }
            // Clear audio buffer
            this.audioBuffer = [];
        }
        /**
         * Logging helpers
         */
        log(message) {
            if (this.enableDebugLogs) {
                print(`[AudioStreamingController] ${message}`);
            }
        }
        logError(message) {
            print(`[AudioStreamingController] ERROR: ${message}`);
        }
    };
    __setFunctionName(_classThis, "AudioStreamingController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AudioStreamingController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AudioStreamingController = _classThis;
})();
exports.AudioStreamingController = AudioStreamingController;
//# sourceMappingURL=AudioStreamingController.js.map