/**
 * AudioManager
 *
 * Handles microphone capture with AudioWorklet and audio playback queue
 * for Gemini Live API integration
 */

export type AudioManagerState = "idle" | "capturing" | "error";

export interface AudioManagerCallbacks {
  onAudioData: (data: ArrayBuffer) => void;
  onStateChange: (state: AudioManagerState) => void;
  onError: (error: Error) => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
}

// Inline worklet code as a string to avoid module loading issues
const RESAMPLER_WORKLET_CODE = `
class ResamplerProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.inputSampleRate = options.processorOptions?.inputSampleRate || 44100;
    this.outputSampleRate = options.processorOptions?.outputSampleRate || 16000;
    this.buffer = new Float32Array(0);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0 || !input[0]) {
      return true;
    }

    const inputChannel = input[0];

    // Append to buffer
    const newBuffer = new Float32Array(this.buffer.length - this.bufferIndex + inputChannel.length);
    newBuffer.set(this.buffer.subarray(this.bufferIndex));
    newBuffer.set(inputChannel, this.buffer.length - this.bufferIndex);
    this.buffer = newBuffer;
    this.bufferIndex = 0;

    // Calculate resampling ratio
    const ratio = this.inputSampleRate / this.outputSampleRate;
    const outputLength = Math.floor(this.buffer.length / ratio);

    if (outputLength > 0) {
      // Resample using linear interpolation
      const resampled = new Float32Array(outputLength);
      for (let i = 0; i < outputLength; i++) {
        const srcIndex = i * ratio;
        const srcIndexFloor = Math.floor(srcIndex);
        const srcIndexCeil = Math.min(srcIndexFloor + 1, this.buffer.length - 1);
        const fraction = srcIndex - srcIndexFloor;

        resampled[i] = this.buffer[srcIndexFloor] * (1 - fraction) +
                       this.buffer[srcIndexCeil] * fraction;
      }

      // Convert to PCM16
      const pcm16 = new Int16Array(resampled.length);
      for (let i = 0; i < resampled.length; i++) {
        const s = Math.max(-1, Math.min(1, resampled[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Send the resampled data
      this.port.postMessage({
        type: 'audio',
        data: pcm16.buffer
      }, [pcm16.buffer]);

      // Keep remaining samples
      const consumed = Math.floor(outputLength * ratio);
      this.bufferIndex = consumed;
    }

    return true;
  }
}

registerProcessor('resampler-processor', ResamplerProcessor);
`;

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private playbackQueue: ArrayBuffer[] = [];
  private isPlaying = false;
  private callbacks: AudioManagerCallbacks;
  private state: AudioManagerState = "idle";
  private workletBlobUrl: string | null = null;

  // Audio config
  private readonly inputSampleRate = 44100;
  private readonly outputSampleRate = 16000;
  private readonly playbackSampleRate = 24000;

  constructor(callbacks: AudioManagerCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Initialize audio context and worklet
   */
  async initialize(): Promise<void> {
    try {
      // Create audio context
      this.audioContext = new AudioContext({
        sampleRate: this.inputSampleRate,
      });

      // Check if AudioWorklet is supported
      if (!this.audioContext.audioWorklet) {
        throw new Error("AudioWorklet not supported in this browser. Please use Chrome, Firefox, or Safari.");
      }

      // Create a Blob URL from the inline worklet code
      const blob = new Blob([RESAMPLER_WORKLET_CODE], { type: "application/javascript" });
      this.workletBlobUrl = URL.createObjectURL(blob);

      // Load the worklet module from Blob URL
      await this.audioContext.audioWorklet.addModule(this.workletBlobUrl);
    } catch (error) {
      this.setState("error");
      throw new Error(`Failed to initialize audio: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Start capturing audio from microphone
   */
  async startCapture(): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }

    if (!this.audioContext) {
      throw new Error("Audio context not initialized");
    }

    try {
      // Resume context if suspended (browser autoplay policy)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: this.inputSampleRate,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create source node from microphone
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create worklet node for resampling
      this.workletNode = new AudioWorkletNode(this.audioContext, "resampler-processor", {
        processorOptions: {
          inputSampleRate: this.audioContext.sampleRate,
          outputSampleRate: this.outputSampleRate,
        },
      });

      // Handle resampled audio data
      this.workletNode.port.onmessage = (event) => {
        if (event.data.type === "audio") {
          this.callbacks.onAudioData(event.data.data);
        }
      };

      // Connect the audio graph
      this.sourceNode.connect(this.workletNode);
      // Don't connect to destination to avoid feedback

      this.setState("capturing");
    } catch (error) {
      this.setState("error");
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        throw new Error("Microphone permission denied. Please allow microphone access to use voice features.");
      }
      throw new Error(`Failed to start audio capture: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Stop capturing audio
   */
  stopCapture(): void {
    // Disconnect worklet
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode.port.close();
      this.workletNode = null;
    }

    // Disconnect source
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    // Stop media stream tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.setState("idle");
  }

  /**
   * Queue audio for playback
   */
  async queueAudio(data: ArrayBuffer): Promise<void> {
    console.log("AudioManager: Queueing audio, size:", data.byteLength, "bytes");

    // Initialize audio context if needed (for text-only mode where capture wasn't started)
    if (!this.audioContext) {
      console.log("AudioManager: No audio context, initializing for playback...");
      await this.initializeForPlayback();
    }

    this.playbackQueue.push(data);
    console.log("AudioManager: Queue size:", this.playbackQueue.length, "isPlaying:", this.isPlaying);
    this.processPlaybackQueue();
  }

  /**
   * Initialize audio context for playback only (no worklet needed)
   */
  private async initializeForPlayback(): Promise<void> {
    if (this.audioContext) {
      return;
    }

    try {
      // Create audio context for playback
      this.audioContext = new AudioContext({
        sampleRate: this.playbackSampleRate,
      });

      // Resume if suspended (browser autoplay policy)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      console.log("AudioManager: Initialized for playback, sample rate:", this.audioContext.sampleRate);
    } catch (error) {
      console.error("AudioManager: Failed to initialize for playback:", error);
      this.callbacks.onError(
        new Error(`Failed to initialize audio playback: ${error instanceof Error ? error.message : "Unknown error"}`)
      );
    }
  }

  /**
   * Process playback queue
   */
  private async processPlaybackQueue(): Promise<void> {
    if (this.isPlaying || this.playbackQueue.length === 0) {
      return;
    }

    this.isPlaying = true;
    this.callbacks.onPlaybackStart?.();

    while (this.playbackQueue.length > 0) {
      const audioData = this.playbackQueue.shift();
      if (audioData) {
        await this.playAudio(audioData);
      }
    }

    this.isPlaying = false;
    this.callbacks.onPlaybackEnd?.();
  }

  /**
   * Play audio buffer
   */
  private async playAudio(data: ArrayBuffer): Promise<void> {
    // Ensure audio context exists
    if (!this.audioContext) {
      await this.initializeForPlayback();
    }

    if (!this.audioContext) {
      console.error("AudioManager: Cannot play audio - no audio context");
      return;
    }

    try {
      // Resume context if suspended
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      // Convert PCM16 to Float32
      const pcm16 = new Int16Array(data);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7FFF);
      }

      // Create audio buffer at playback sample rate
      const audioBuffer = this.audioContext.createBuffer(
        1, // mono
        float32.length,
        this.playbackSampleRate
      );
      audioBuffer.getChannelData(0).set(float32);

      // Create and play buffer source
      const sourceNode = this.audioContext.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(this.audioContext.destination);

      console.log("AudioManager: Playing audio buffer, duration:", audioBuffer.duration.toFixed(2), "s, sampleRate:", audioBuffer.sampleRate);

      return new Promise((resolve) => {
        sourceNode.onended = () => {
          console.log("AudioManager: Audio chunk finished playing");
          resolve();
        };
        sourceNode.start();
      });
    } catch (error) {
      console.error("Audio playback error:", error);
    }
  }

  /**
   * Clear playback queue
   */
  clearPlaybackQueue(): void {
    this.playbackQueue = [];
  }

  /**
   * Check if currently playing
   */
  get playing(): boolean {
    return this.isPlaying;
  }

  /**
   * Get current state
   */
  get currentState(): AudioManagerState {
    return this.state;
  }

  /**
   * Set state and notify
   */
  private setState(state: AudioManagerState): void {
    this.state = state;
    this.callbacks.onStateChange(state);
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    this.stopCapture();
    this.clearPlaybackQueue();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Clean up Blob URL
    if (this.workletBlobUrl) {
      URL.revokeObjectURL(this.workletBlobUrl);
      this.workletBlobUrl = null;
    }
  }
}
