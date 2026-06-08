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
exports.AudioCaptureUploader = void 0;
var __selfType = requireType("./AudioCaptureUploader");
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
 * AudioCaptureUploader - Captures audio from Spectacles microphone and uploads to Supabase storage
 * Handles recording audio chunks for later processing/composition
 *
 * KEY DIFFERENCE from AudioStreamingController:
 * - This UPLOADS for audio files (stores files)
 * - AudioStreamingController STREAMS for live communication (no storage)
 */
let AudioCaptureUploader = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var AudioCaptureUploader = _classThis = class extends _classSuper {
        constructor() {
            super();
            // Core Modules
            this.internetModule = require("LensStudio:InternetModule");
            // Supabase Configuration
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.storageBucket = this.storageBucket;
            this.storageFolder = this.storageFolder;
            // Audio Configuration
            this.microphoneAsset = this.microphoneAsset;
            this.sampleRate = this.sampleRate;
            this.chunkDurationMs = this.chunkDurationMs;
            // UI Components
            this.recordButton = this.recordButton;
            this.statusText = this.statusText;
            this.buttonText = this.buttonText;
            // Debug Configuration
            this.enableDebugLogs = this.enableDebugLogs;
            this.testSingleChunk = this.testSingleChunk;
            // Private State
            this.isRecording = false;
            this.sessionId = "";
            this.chunkCount = 0;
            this.recordingStartTime = 0;
            this.recordedAudioFrames = [];
            this.numberOfSamples = 0;
            this.recordingDuration = 0;
            this.isAuthenticated = false;
        }
        __initialize() {
            super.__initialize();
            // Core Modules
            this.internetModule = require("LensStudio:InternetModule");
            // Supabase Configuration
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.storageBucket = this.storageBucket;
            this.storageFolder = this.storageFolder;
            // Audio Configuration
            this.microphoneAsset = this.microphoneAsset;
            this.sampleRate = this.sampleRate;
            this.chunkDurationMs = this.chunkDurationMs;
            // UI Components
            this.recordButton = this.recordButton;
            this.statusText = this.statusText;
            this.buttonText = this.buttonText;
            // Debug Configuration
            this.enableDebugLogs = this.enableDebugLogs;
            this.testSingleChunk = this.testSingleChunk;
            // Private State
            this.isRecording = false;
            this.sessionId = "";
            this.chunkCount = 0;
            this.recordingStartTime = 0;
            this.recordedAudioFrames = [];
            this.numberOfSamples = 0;
            this.recordingDuration = 0;
            this.isAuthenticated = false;
        }
        onAwake() {
            this.log("AudioCaptureUploader initializing...");
            // Validate requirements
            if (!this.snapCloudRequirements) {
                this.logError("SnapCloudRequirements not configured! Please assign in Inspector.");
                return;
            }
            if (!this.microphoneAsset) {
                this.logError("MicrophoneAsset not configured! Please assign an AudioTrackAsset in Inspector.");
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
            this.updateStatus("Ready to record");
            this.updateButtonText();
        }
        /**
         * Setup UI button handlers - must be called after components are awake
         */
        setupUIHandlers() {
            // Setup button handler - call initialize() first to ensure events are ready
            if (this.recordButton) {
                this.recordButton.initialize();
                this.recordButton.onTriggerUp.add(() => {
                    this.onRecordButtonPressed();
                });
                this.log(" Record button handler registered");
            }
        }
        /**
         * Initialize Supabase authentication
         */
        async initializeSupabaseAuthentication() {
            this.log("=== AUDIO AUTHENTICATION START ===");
            if (!this.snapCloudRequirements || !this.snapCloudRequirements.isConfigured()) {
                this.logError("SnapCloudRequirements not configured");
                return;
            }
            const supabaseProject = this.snapCloudRequirements.getSupabaseProject();
            this.log(`Supabase URL: ${supabaseProject.url}`);
            // Create Supabase client for audio uploads
            this.supabaseClient = (0, supabase_snapcloud_1.createClient)(supabaseProject.url, supabaseProject.publicToken);
            this.log("Supabase client created for audio uploads");
            if (this.supabaseClient) {
                await this.signInUser();
                this.initializeAudio();
            }
        }
        /**
         * Sign in user using Snap Cloud authentication
         */
        async signInUser() {
            this.log("Attempting Snap Cloud authentication...");
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
                        this.log(` Authenticated as user: ${this.uid}`);
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
            this.log("=== AUDIO AUTHENTICATION END ===");
        }
        /**
         * Initialize audio recording components
         */
        initializeAudio() {
            try {
                this.log("Initializing audio recording...");
                // Initialize microphone control and set sample rate
                this.microphoneControl = this.microphoneAsset.control;
                this.log(`Requested sample rate: ${this.sampleRate} Hz`);
                this.microphoneControl.sampleRate = this.sampleRate;
                // Read back the actual sample rate (may differ from requested)
                const actualSampleRate = this.microphoneControl.sampleRate;
                this.log(`Actual microphone sample rate: ${actualSampleRate} Hz`);
                if (actualSampleRate !== this.sampleRate) {
                    this.log(`⚠️ Sample rate mismatch! Requested ${this.sampleRate}, got ${actualSampleRate}`);
                    this.log(`Using actual rate ${actualSampleRate} for WAV encoding to prevent pitch issues`);
                    this.sampleRate = actualSampleRate; // Use actual rate for correct playback
                }
                // Create audio update event for recording
                this.recordAudioUpdateEvent = this.createEvent("UpdateEvent");
                this.recordAudioUpdateEvent.bind(() => {
                    this.onRecordAudio();
                });
                this.recordAudioUpdateEvent.enabled = false;
                this.log(`Audio recording initialized - Sample rate: ${this.sampleRate} Hz`);
                this.updateStatus(`Audio ready (${this.sampleRate} Hz)`);
            }
            catch (error) {
                this.logError(`Failed to initialize audio: ${error}`);
                this.updateStatus("Audio initialization failed");
            }
        }
        /**
         * Handle record button press - toggle recording
         */
        onRecordButtonPressed() {
            if (this.isRecording) {
                this.stopRecording();
            }
            else {
                if (this.testSingleChunk) {
                    this.captureAudioChunk();
                }
                else {
                    this.startRecording();
                }
            }
            this.updateButtonText();
        }
        /**
         * Capture a single audio chunk for testing
         */
        async captureAudioChunk() {
            this.log("Capturing single audio chunk...");
            this.updateStatus("Capturing audio chunk...");
            try {
                // Generate session ID for this capture
                this.sessionId = this.generateSessionId();
                // Record audio for chunk duration
                this.microphoneControl.start();
                this.recordAudioUpdateEvent.enabled = true;
                // Stop after chunk duration using DelayedCallbackEvent
                const stopTimer = this.createEvent("DelayedCallbackEvent");
                stopTimer.bind(() => {
                    this.microphoneControl.stop();
                    this.recordAudioUpdateEvent.enabled = false;
                    this.finalizeSingleChunk();
                });
                stopTimer.reset(this.chunkDurationMs / 1000); // Convert ms to seconds
            }
            catch (error) {
                this.logError(`Single audio chunk capture failed: ${error}`);
                this.updateStatus("Capture failed");
            }
        }
        /**
         * Finalize single chunk capture and upload
         */
        async finalizeSingleChunk() {
            if (this.recordedAudioFrames.length === 0) {
                this.logError("No audio frames recorded");
                this.updateStatus("No audio captured");
                return;
            }
            this.log(`Captured ${this.recordedAudioFrames.length} audio frames`);
            // Convert audio frames to uploadable data
            const audioData = this.audioFramesToByteArray(this.recordedAudioFrames);
            // Upload audio chunk
            const uploadSuccess = await this.uploadAudioChunk(this.sessionId, 0, audioData, Date.now());
            if (uploadSuccess) {
                this.log("Audio chunk uploaded successfully!");
                this.updateStatus("Audio chunk uploaded!");
            }
            else {
                this.logError("Failed to upload audio chunk");
                this.updateStatus("Upload failed");
            }
            // Clean up
            this.recordedAudioFrames = [];
            this.numberOfSamples = 0;
        }
        /**
         * Start continuous audio recording
         */
        startRecording() {
            if (!this.microphoneControl) {
                this.logError("Audio not initialized");
                return;
            }
            this.log("Starting continuous audio recording...");
            this.isRecording = true;
            this.sessionId = this.generateSessionId();
            this.chunkCount = 0;
            this.recordingStartTime = Date.now();
            this.recordedAudioFrames = [];
            this.numberOfSamples = 0;
            this.updateStatus("Recording audio...");
            this.updateButtonText();
            // Start microphone and audio processing
            this.microphoneControl.start();
            this.recordAudioUpdateEvent.enabled = true;
            this.log("Audio recording started");
        }
        /**
         * Stop audio recording
         */
        async stopRecording() {
            if (!this.isRecording)
                return;
            this.log("Stopping audio recording...");
            this.isRecording = false;
            // Stop microphone recording
            this.microphoneControl.stop();
            this.recordAudioUpdateEvent.enabled = false;
            // Process final audio chunk
            await this.processFinalAudioChunk();
            const duration = (Date.now() - this.recordingStartTime) / 1000;
            this.log(`Audio recording complete: ${this.chunkCount} chunks in ${duration.toFixed(1)}s`);
            this.updateStatus(`Audio complete: ${this.chunkCount} chunks recorded`);
            this.updateButtonText();
        }
        /**
         * Record audio frame (called every update when recording)
         */
        onRecordAudio() {
            if (!this.isRecording || !this.microphoneControl)
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
            // Update samples and duration
            this.numberOfSamples += audioFrameShape.x;
            this.recordingDuration = this.numberOfSamples / this.sampleRate;
            // Store the recorded audio frame with timestamp
            this.recordedAudioFrames.push({
                audioFrame: audioFrame,
                audioFrameShape: audioFrameShape,
                timestamp: Date.now()
            });
            // Process chunk when we have enough audio data
            const chunkSamples = (this.chunkDurationMs / 1000) * this.sampleRate;
            if (this.numberOfSamples >= chunkSamples) {
                this.processAudioChunk();
            }
        }
        /**
         * Process and upload a chunk of audio data
         */
        async processAudioChunk() {
            if (this.recordedAudioFrames.length === 0)
                return;
            this.chunkCount++;
            try {
                this.log(`=== PROCESSING AUDIO CHUNK ${this.chunkCount} ===`);
                this.log(`Frames to process: ${this.recordedAudioFrames.length}`);
                this.log(`Total samples: ${this.numberOfSamples}`);
                this.log(`Expected duration: ${((this.numberOfSamples / this.sampleRate) * 1000).toFixed(1)}ms`);
                // Convert audio frames to byte array (WAV format)
                const audioData = this.audioFramesToByteArray(this.recordedAudioFrames);
                // Upload audio chunk
                await this.uploadAudioChunk(this.sessionId, this.chunkCount, audioData, this.recordedAudioFrames[0].timestamp);
                // Update status with chunk info
                const duration = Math.floor((Date.now() - this.recordingStartTime) / 1000);
                const chunkDurationMs = this.calculateWavDurationMs(audioData);
                this.updateStatus(`Recording: ${this.chunkCount} chunks (${duration}s) - Last: ${chunkDurationMs}ms`);
                this.log(`=== CHUNK ${this.chunkCount} COMPLETE ===`);
                // Clear processed frames
                this.recordedAudioFrames = [];
                this.numberOfSamples = 0;
            }
            catch (error) {
                this.logError(`Failed to process audio chunk ${this.chunkCount}: ${error}`);
            }
        }
        /**
         * Process final audio chunk when stopping
         */
        async processFinalAudioChunk() {
            if (this.recordedAudioFrames.length > 0) {
                await this.processAudioChunk();
            }
        }
        /**
         * Convert audio frames to WAV format byte array
         */
        audioFramesToByteArray(frames) {
            // Calculate total samples
            let totalSamples = 0;
            for (const frame of frames) {
                totalSamples += frame.audioFrame.length;
            }
            this.log(`Converting ${frames.length} frames with ${totalSamples} total samples to WAV`);
            // Convert Float32 audio to 16-bit PCM for WAV
            const pcmData = new Int16Array(totalSamples);
            let offset = 0;
            for (const frame of frames) {
                for (let i = 0; i < frame.audioFrame.length; i++) {
                    // Convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767)
                    const sample = Math.max(-1, Math.min(1, frame.audioFrame[i]));
                    pcmData[offset + i] = sample * 32767;
                }
                offset += frame.audioFrame.length;
            }
            // Create WAV header
            const wavHeader = this.createWavHeader(totalSamples, this.sampleRate, 1, 16);
            // Combine header and PCM data
            const wavData = new Uint8Array(wavHeader.length + pcmData.length * 2);
            wavData.set(wavHeader, 0);
            wavData.set(new Uint8Array(pcmData.buffer), wavHeader.length);
            const durationSeconds = totalSamples / this.sampleRate;
            this.log(`Created WAV file: ${totalSamples} samples, ${durationSeconds.toFixed(3)}s duration`);
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
         * Upload audio chunk to Supabase Storage
         */
        async uploadAudioChunk(sessionId, chunkNumber, data, timestamp) {
            return this.uploadAudioToSupabase(sessionId, chunkNumber, data, timestamp);
        }
        /**
         * Upload audio chunk to Supabase Storage
         */
        async uploadAudioToSupabase(sessionId, chunkNumber, data, timestamp) {
            try {
                // Calculate duration from the WAV data
                const durationMs = this.calculateWavDurationMs(data);
                this.log(`Uploading audio chunk ${chunkNumber} to Supabase...`);
                this.log(`Chunk size: ${data.length} bytes, Duration: ${durationMs}ms`);
                if (!this.supabaseClient || !this.isAuthenticated) {
                    this.logError("Supabase client not initialized or not authenticated");
                    return false;
                }
                // Save as .wav file instead of .raw
                const fileName = `${this.storageFolder}/${sessionId}/chunk_${String(chunkNumber).padStart(5, "0")}.wav`;
                const { data: uploadData, error } = await this.supabaseClient.storage
                    .from(this.storageBucket)
                    .upload(fileName, data, {
                    contentType: "audio/wav",
                    upsert: true
                });
                if (error) {
                    this.logError(` Audio upload failed: ${JSON.stringify(error)}`);
                    return false;
                }
                else {
                    this.log(` Audio chunk ${chunkNumber} uploaded successfully as WAV!`);
                    this.log(`File: ${fileName} (${durationMs}ms, ${data.length} bytes)`);
                    // Log metadata for testing/debugging
                    this.log(`Audio metadata: Sample Rate: ${this.sampleRate}Hz, Format: 16-bit PCM, Channels: 1`);
                    // Generate public URL for testing
                    this.generatePublicUrlForTesting(fileName);
                    return true;
                }
            }
            catch (error) {
                this.logError(`Failed to upload audio chunk ${chunkNumber}: ${error}`);
                return false;
            }
        }
        /**
         * Calculate duration of WAV data in milliseconds
         */
        calculateWavDurationMs(wavData) {
            try {
                // WAV header is 44 bytes, audio data starts after that
                const audioDataSize = wavData.length - 44;
                // 16-bit PCM mono: 2 bytes per sample
                const numSamples = audioDataSize / 2;
                // Duration = samples / sample rate
                const durationSeconds = numSamples / this.sampleRate;
                const durationMs = durationSeconds * 1000;
                return Math.round(durationMs);
            }
            catch (error) {
                this.logError(`Failed to calculate WAV duration: ${error}`);
                return 0;
            }
        }
        /**
         * Generate public URL for testing uploaded audio chunks
         */
        async generatePublicUrlForTesting(fileName) {
            try {
                if (!this.supabaseClient)
                    return;
                const { data, error } = await this.supabaseClient.storage.from(this.storageBucket).createSignedUrl(fileName, 3600); // 1 hour expiry
                if (error) {
                    this.log(`Could not generate test URL: ${error.message}`);
                }
                else {
                    this.log(` TEST URL (1h expiry): ${data.signedUrl}`);
                    this.log(` Copy this URL to test the audio chunk in your browser`);
                }
            }
            catch (error) {
                this.log(`Error generating test URL: ${error}`);
            }
        }
        /**
         * Generate unique session ID
         */
        generateSessionId() {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 9);
            return `audio_session_${timestamp}_${random}`;
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
         * Update button text based on recording state
         */
        updateButtonText() {
            if (this.buttonText) {
                if (this.isRecording) {
                    this.buttonText.text = "Stop Recording Audio";
                }
                else {
                    this.buttonText.text = "Start Recording Audio";
                }
            }
        }
        /**
         * Cleanup resources
         */
        cleanup() {
            // Stop recording if active
            if (this.isRecording) {
                this.microphoneControl.stop();
                this.recordAudioUpdateEvent.enabled = false;
            }
            // Clear audio buffers and reset state
            this.recordedAudioFrames = [];
        }
        /**
         * Logging helpers
         */
        log(message) {
            if (this.enableDebugLogs) {
                print(`[AudioCaptureUploader] ${message}`);
            }
        }
        logError(message) {
            print(`[AudioCaptureUploader] ERROR: ${message}`);
        }
    };
    __setFunctionName(_classThis, "AudioCaptureUploader");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AudioCaptureUploader = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AudioCaptureUploader = _classThis;
})();
exports.AudioCaptureUploader = AudioCaptureUploader;
//# sourceMappingURL=AudioCaptureUploader.js.map