/**
 * AudioWorklet Processor for Resampling
 *
 * Downsamples audio from browser sample rate (44.1kHz/48kHz) to 16kHz for Gemini
 * Converts Float32 samples to PCM16 format
 */

// AudioWorklet types - these are available in the worklet global scope
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const AudioWorkletProcessor: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare function registerProcessor(name: string, processorCtor: any): void;

interface ProcessorOptions {
  processorOptions?: {
    inputSampleRate?: number;
    outputSampleRate?: number;
  };
}

class ResamplerProcessor extends AudioWorkletProcessor {
  private inputSampleRate: number;
  private outputSampleRate: number;
  private buffer: Float32Array;
  private bufferIndex: number;

  constructor(options: ProcessorOptions) {
    super();
    this.inputSampleRate = options.processorOptions?.inputSampleRate || 44100;
    this.outputSampleRate = options.processorOptions?.outputSampleRate || 16000;
    this.buffer = new Float32Array(0);
    this.bufferIndex = 0;
  }

  process(inputs: Float32Array[][], _outputs: Float32Array[][], _parameters: Record<string, Float32Array>): boolean {
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
      const pcm16 = this.floatToPcm16(resampled);

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

  private floatToPcm16(float32: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      // Clamp to [-1, 1]
      const s = Math.max(-1, Math.min(1, float32[i]));
      // Convert to 16-bit signed integer
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm16;
  }
}

registerProcessor('resampler-processor', ResamplerProcessor);
