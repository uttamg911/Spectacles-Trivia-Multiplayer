"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionUtility = exports.SupabaseAuthUtility = exports.AudioCaptureUtility = exports.VideoCaptureUtility = void 0;
const supabase_snapcloud_1 = require("SupabaseClient.lspkg/supabase-snapcloud");
/**
 * Shared utilities for video and audio capture operations
 * Used by both individual and composite capture/streaming scripts
 */
/**
 * Video capture utility - handles camera setup and frame capture
 */
class VideoCaptureUtility {
    constructor(enableDebugLogs = true) {
        this.cameraModule = require("LensStudio:CameraModule");
        this.enableDebugLogs = enableDebugLogs;
    }
    /**
     * Initialize camera from CameraService (RECOMMENDED - avoids conflicts)
     */
    initializeCameraFromService(cameraTexture, cameraTextureProvider) {
        try {
            this.log(" Using CameraService's camera (no conflicts)");
            this.cameraTexture = cameraTexture;
            this.cameraTextureProvider = cameraTextureProvider;
            if (!this.cameraTexture) {
                this.logError("CameraService camera texture not available");
                return false;
            }
            const width = this.cameraTexture.getWidth();
            const height = this.cameraTexture.getHeight();
            this.log(`CameraService texture dimensions: ${width}x${height}`);
            this.log("Camera initialized via CameraService");
            return true;
        }
        catch (error) {
            this.logError(`Failed to initialize camera from service: ${error}`);
            return false;
        }
    }
    /**
     * Initialize camera for capture (FALLBACK - may conflict with CameraService!)
     */
    initializeCamera() {
        try {
            this.log("⚠️ Requesting own camera (may conflict with CameraService!)");
            // Create camera request
            const cameraRequest = CameraModule.createCameraRequest();
            cameraRequest.cameraId = CameraModule.CameraId.Default_Color;
            // Request camera texture
            this.cameraTexture = this.cameraModule.requestCamera(cameraRequest);
            this.cameraTextureProvider = this.cameraTexture.control;
            this.log("Camera initialized successfully");
            return true;
        }
        catch (error) {
            this.logError(`Failed to initialize camera: ${error}`);
            return false;
        }
    }
    /**
     * Capture current frame as base64
     */
    async captureFrame(quality = 70) {
        return new Promise((resolve, reject) => {
            if (!this.cameraTexture) {
                reject(new Error("Camera not initialized"));
                return;
            }
            try {
                const compressionQuality = quality > 70 ? CompressionQuality.HighQuality : CompressionQuality.IntermediateQuality;
                Base64.encodeTextureAsync(this.cameraTexture, (encodedString) => {
                    resolve(encodedString);
                }, () => {
                    reject(new Error("Frame capture failed"));
                }, compressionQuality, EncodingType.Jpg);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Get camera texture for streaming (onNewFrame subscription)
     */
    getCameraTexture() {
        return this.cameraTexture;
    }
    /**
     * Get camera texture provider for frame events
     */
    getCameraTextureProvider() {
        return this.cameraTextureProvider;
    }
    /**
     * Upload frame to Supabase Storage
     * @param imageFormat 0 = JPG, 1 = PNG
     */
    async uploadFrameToStorage(supabaseClient, storageBucket, sessionId, frameNumber, frameData, timestamp, storageFolder = "video-frames", imageFormat = 0 // 0 = JPG, 1 = PNG
    ) {
        try {
            // Use correct file extension and content type based on format
            const extension = imageFormat === 1 ? "png" : "jpg";
            const contentType = imageFormat === 1 ? "image/png" : "image/jpeg";
            const fileName = `${storageFolder}/${sessionId}/frame_${String(frameNumber).padStart(5, "0")}.${extension}`;
            // Convert base64 to binary for upload
            const binaryData = this.base64ToUint8Array(frameData);
            const { data, error } = await supabaseClient.storage.from(storageBucket).upload(fileName, binaryData, {
                contentType: contentType,
                upsert: true
            });
            if (error) {
                this.logError(`Frame upload failed: ${JSON.stringify(error)}`);
                return false;
            }
            this.log(` Frame ${frameNumber} uploaded successfully`);
            return true;
        }
        catch (error) {
            this.logError(`Failed to upload frame ${frameNumber}: ${error}`);
            return false;
        }
    }
    /**
     * Convert base64 to Uint8Array for upload
     */
    base64ToUint8Array(base64) {
        // Manual base64 decoding for Lens Studio
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        const lookup = new Uint8Array(256);
        for (let i = 0; i < chars.length; i++) {
            lookup[chars.charCodeAt(i)] = i;
        }
        let bufferLength = base64.length * 0.75;
        const len = base64.length;
        let p = 0;
        if (base64[len - 1] === "=") {
            bufferLength--;
            if (base64[len - 2] === "=") {
                bufferLength--;
            }
        }
        const bytes = new Uint8Array(bufferLength);
        for (let i = 0; i < len; i += 4) {
            const encoded1 = lookup[base64.charCodeAt(i)];
            const encoded2 = lookup[base64.charCodeAt(i + 1)];
            const encoded3 = lookup[base64.charCodeAt(i + 2)];
            const encoded4 = lookup[base64.charCodeAt(i + 3)];
            bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
            bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
            bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
        }
        return bytes;
    }
    log(message) {
        if (this.enableDebugLogs) {
            print(`[VideoCaptureUtility] ${message}`);
        }
    }
    logError(message) {
        print(`[VideoCaptureUtility] ERROR: ${message}`);
    }
}
exports.VideoCaptureUtility = VideoCaptureUtility;
/**
 * Audio capture utility - handles microphone setup and audio capture
 */
class AudioCaptureUtility {
    constructor(enableDebugLogs = true) {
        this.audioBuffer = [];
        this.numberOfSamples = 0;
        this.enableDebugLogs = enableDebugLogs;
    }
    /**
     * Initialize audio with microphone asset
     */
    initializeAudio(microphoneAsset, sampleRate = 44100) {
        try {
            this.log("Initializing audio for capture...");
            if (!microphoneAsset) {
                this.logError("MicrophoneAsset not provided");
                return false;
            }
            // Initialize microphone control and set sample rate
            this.microphoneControl = microphoneAsset.control;
            this.microphoneControl.sampleRate = sampleRate;
            this.log(`Audio initialized - Sample rate: ${sampleRate}Hz`);
            return true;
        }
        catch (error) {
            this.logError(`Failed to initialize audio: ${error}`);
            return false;
        }
    }
    /**
     * Start audio recording
     */
    startRecording() {
        if (!this.microphoneControl) {
            this.logError("Audio not initialized");
            return false;
        }
        try {
            this.microphoneControl.start();
            this.audioBuffer = [];
            this.numberOfSamples = 0;
            this.log("Audio recording started");
            return true;
        }
        catch (error) {
            this.logError(`Failed to start recording: ${error}`);
            return false;
        }
    }
    /**
     * Stop audio recording
     */
    stopRecording() {
        if (!this.microphoneControl) {
            return false;
        }
        try {
            this.microphoneControl.stop();
            this.log("Audio recording stopped");
            return true;
        }
        catch (error) {
            this.logError(`Failed to stop recording: ${error}`);
            return false;
        }
    }
    /**
     * Process audio frame (call this from UpdateEvent)
     */
    processAudioFrame() {
        if (!this.microphoneControl)
            return null;
        const frameSize = this.microphoneControl.maxFrameSize;
        let audioFrame = new Float32Array(frameSize);
        // Get audio frame shape
        const audioFrameShape = this.microphoneControl.getAudioFrame(audioFrame);
        // If no audio data, return early
        if (audioFrameShape.x === 0) {
            return null;
        }
        // Reduce the subarray size to the actual data
        audioFrame = audioFrame.subarray(0, audioFrameShape.x);
        // Update samples count
        this.numberOfSamples += audioFrameShape.x;
        // Add to buffer
        this.audioBuffer.push(audioFrame);
        return audioFrame;
    }
    /**
     * Get and clear current audio buffer as combined array
     */
    getAndClearAudioBuffer() {
        const combinedData = this.combineAudioFrames(this.audioBuffer);
        this.audioBuffer = [];
        this.numberOfSamples = 0;
        return combinedData;
    }
    /**
     * Get current audio buffer without clearing
     */
    getCurrentAudioBuffer() {
        return [...this.audioBuffer];
    }
    /**
     * Clear audio buffer
     */
    clearAudioBuffer() {
        this.audioBuffer = [];
        this.numberOfSamples = 0;
    }
    /**
     * Check if enough samples for chunk
     */
    hasEnoughSamplesForChunk(chunkDurationMs, sampleRate) {
        const chunkSamples = (chunkDurationMs / 1000) * sampleRate;
        return this.numberOfSamples >= chunkSamples;
    }
    /**
     * Upload audio chunk to Supabase Storage
     */
    async uploadAudioToStorage(supabaseClient, storageBucket, sessionId, chunkNumber, audioData, timestamp, storageFolder = "audio-recordings") {
        try {
            const fileName = `${storageFolder}/${sessionId}/chunk_${String(chunkNumber).padStart(5, "0")}.raw`;
            const { data, error } = await supabaseClient.storage.from(storageBucket).upload(fileName, audioData, {
                contentType: "audio/raw",
                upsert: true
            });
            if (error) {
                this.logError(`Audio upload failed: ${JSON.stringify(error)}`);
                return false;
            }
            this.log(` Audio chunk ${chunkNumber} uploaded successfully`);
            return true;
        }
        catch (error) {
            this.logError(`Failed to upload audio chunk ${chunkNumber}: ${error}`);
            return false;
        }
    }
    /**
     * Convert audio frames to byte array for upload
     */
    combineAudioFrames(frames) {
        // Calculate total samples
        let totalSamples = 0;
        for (const frame of frames) {
            totalSamples += frame.length;
        }
        // Create output array (Float32 = 4 bytes per sample)
        const byteArray = new Uint8Array(totalSamples * 4);
        const floatView = new Float32Array(byteArray.buffer);
        // Copy all audio samples
        let offset = 0;
        for (const frame of frames) {
            for (let i = 0; i < frame.length; i++) {
                floatView[offset + i] = frame[i];
            }
            offset += frame.length;
        }
        return byteArray;
    }
    log(message) {
        if (this.enableDebugLogs) {
            print(`[AudioCaptureUtility] ${message}`);
        }
    }
    logError(message) {
        print(`[AudioCaptureUtility] ERROR: ${message}`);
    }
}
exports.AudioCaptureUtility = AudioCaptureUtility;
/**
 * Shared authentication utility
 */
class SupabaseAuthUtility {
    constructor(enableDebugLogs = true) {
        this.isAuthenticated = false;
        this.enableDebugLogs = enableDebugLogs;
    }
    /**
     * Initialize Supabase client and authenticate
     */
    async initializeAndAuthenticate(snapCloudRequirements) {
        if (!snapCloudRequirements || !snapCloudRequirements.isConfigured()) {
            this.logError("SnapCloudRequirements not configured");
            return false;
        }
        const supabaseProject = snapCloudRequirements.getSupabaseProject();
        this.log(`Supabase URL: ${supabaseProject.url}`);
        // Create Supabase client
        this.supabaseClient = (0, supabase_snapcloud_1.createClient)(supabaseProject.url, supabaseProject.publicToken);
        this.log("Supabase client created");
        if (this.supabaseClient) {
            return await this.signInUser();
        }
        return false;
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
        return this.isAuthenticated;
    }
    /**
     * Get Supabase client
     */
    getSupabaseClient() {
        return this.supabaseClient;
    }
    /**
     * Get user ID
     */
    getUserId() {
        return this.uid;
    }
    /**
     * Check if authenticated
     */
    isAuth() {
        return this.isAuthenticated;
    }
    log(message) {
        if (this.enableDebugLogs) {
            print(`[SupabaseAuthUtility] ${message}`);
        }
    }
    logError(message) {
        print(`[SupabaseAuthUtility] ERROR: ${message}`);
    }
}
exports.SupabaseAuthUtility = SupabaseAuthUtility;
/**
 * Session ID generator utility
 */
class SessionUtility {
    /**
     * Generate unique session ID for synchronization
     */
    static generateSessionId(prefix = "session") {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        return `${prefix}_${timestamp}_${random}`;
    }
    /**
     * Generate metadata for video/audio synchronization
     */
    static createSyncMetadata(sessionId, startTime) {
        return {
            sessionId: sessionId,
            startTime: startTime,
            timestamp: Date.now(),
            createdBy: "spectacles_user"
        };
    }
}
exports.SessionUtility = SessionUtility;
//# sourceMappingURL=CaptureUtilities.js.map