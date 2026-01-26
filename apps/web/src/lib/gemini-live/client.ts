/**
 * GeminiLiveClient
 *
 * Manages WebSocket connection to Gemini Live API for real-time voice interaction
 */

import type {
  GeminiLiveConfig,
  GeminiSessionState,
  GeminiSetupMessage,
  GeminiRealtimeInputMessage,
  GeminiClientContentMessage,
  GeminiToolResponseMessage,
  GeminiServerMessage,
  GeminiContentPart,
  TranscriptEntry,
} from "@live-canvas/protocols";
import { nanoid } from "nanoid";

export interface GeminiLiveCallbacks {
  onStateChange: (state: GeminiSessionState) => void;
  onTranscript: (entry: TranscriptEntry) => void;
  onAudioData: (data: ArrayBuffer) => void;
  onToolCall: (
    id: string,
    name: string,
    args: Record<string, unknown>
  ) => Promise<Record<string, unknown>>;
  onError: (error: Error) => void;
}

// WebSocket URL for Gemini Live API
// Using v1alpha as per working examples (v1beta also available)
// https://gist.github.com/quartzjer/9636066e96b4f904162df706210770e4
const GEMINI_LIVE_WS_URL = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent";

// Model for Live API - must support real-time audio streaming
// Using the latest native audio model for Live API (Dec 2025)
// See: https://ai.google.dev/gemini-api/docs/changelog
const DEFAULT_MODEL = "models/gemini-2.5-flash-native-audio-preview-12-2025";
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 1000;

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private config: GeminiLiveConfig;
  private callbacks: GeminiLiveCallbacks;
  private state: GeminiSessionState = "disconnected";
  private reconnectAttempts = 0;
  private currentTranscriptId: string | null = null;
  private currentTranscriptContent = "";

  constructor(config: GeminiLiveConfig, callbacks: GeminiLiveCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  /**
   * Connect to Gemini Live API
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.setState("connecting");

    return new Promise((resolve, reject) => {
      try {
        const url = `${GEMINI_LIVE_WS_URL}?key=${this.config.apiKey}`;
        console.log("Gemini Live: Connecting to", url.replace(/key=.*/, "key=***"));

        this.ws = new WebSocket(url);
        this.ws.binaryType = "arraybuffer";

        const connectionTimeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            console.error("Gemini Live: Connection timeout");
            this.ws?.close();
            this.setState("error");
            reject(new Error("Connection timeout"));
          }
        }, 10000);

        this.ws.onopen = () => {
          console.log("Gemini Live: WebSocket opened");
          clearTimeout(connectionTimeout);
          this.reconnectAttempts = 0;
          this.sendSetupMessage();
          // Don't resolve yet - wait for setupComplete
        };

        this.ws.onmessage = (event) => {
          const wasConnecting = this.state === "connecting";
          this.handleMessage(event.data);
          // Resolve the promise when we receive setupComplete
          if (wasConnecting && this.state === "connected") {
            console.log("Gemini Live: Setup complete, connected");
            resolve();
          }
        };

        this.ws.onerror = (event) => {
          clearTimeout(connectionTimeout);
          console.error("Gemini Live WebSocket error:", event);
          const error = new Error("WebSocket connection error. Check your API key and network.");
          this.callbacks.onError(error);
          if (this.state === "connecting") {
            reject(error);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log("Gemini Live: WebSocket closed", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });

          // Common error codes:
          // 1000 = Normal closure
          // 1007 = Invalid frame payload data (usually means invalid message format)
          // 1008 = Policy violation
          // 1011 = Unexpected condition
          if (event.code === 1007) {
            console.error("Gemini Live: Error 1007 - Invalid message format. Check the setup message structure.");
          }

          if (this.state === "connecting") {
            const error = new Error(`Connection failed: ${event.reason || `code ${event.code}`}`);
            this.setState("error");
            reject(error);
            return;
          }

          if (this.state !== "disconnected") {
            this.handleDisconnect(event);
          }
        };
      } catch (error) {
        console.error("Gemini Live: Failed to create WebSocket", error);
        this.setState("error");
        reject(error);
      }
    });
  }

  /**
   * Disconnect from Gemini Live API
   */
  disconnect(): void {
    this.setState("disconnected");
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send audio data to Gemini
   */
  sendAudio(data: ArrayBuffer): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return;
    }

    const base64 = this.arrayBufferToBase64(data);
    const message: GeminiRealtimeInputMessage = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: "audio/pcm;rate=16000",
            data: base64,
          },
        ],
      },
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send text message to Gemini
   */
  sendText(text: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: GeminiClientContentMessage = {
      clientContent: {
        turns: [
          {
            role: "user",
            parts: [{ text }],
          },
        ],
        turnComplete: true,
      },
    };

    this.ws.send(JSON.stringify(message));

    // Add to transcript
    this.callbacks.onTranscript({
      id: nanoid(10),
      role: "user",
      content: text,
      timestamp: Date.now(),
      isAudio: false,
    });

    this.setState("processing");
  }

  /**
   * Send tool response back to Gemini
   */
  sendToolResponse(
    id: string,
    name: string,
    response: Record<string, unknown>
  ): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: GeminiToolResponseMessage = {
      toolResponse: {
        functionResponses: [
          {
            id,
            name,
            response,
          },
        ],
      },
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Get current session state
   */
  get sessionState(): GeminiSessionState {
    return this.state;
  }

  /**
   * Check if connected and ready
   */
  get isReady(): boolean {
    return this.state === "connected" || this.state === "listening";
  }

  /**
   * Update state and notify
   */
  private setState(state: GeminiSessionState): void {
    this.state = state;
    this.callbacks.onStateChange(state);
  }

  /**
   * Send setup message after connection
   */
  private sendSetupMessage(): void {
    const model = this.config.model || DEFAULT_MODEL;

    // Build setup message matching the exact format from working examples
    // https://gist.github.com/quartzjer/9636066e96b4f904162df706210770e4
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setup: any = {
      model,
      generationConfig: {
        responseModalities: "audio",
      },
    };

    // Add voice config if specified (matching exact structure from working examples)
    if (this.config.voiceName) {
      setup.generationConfig.speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: this.config.voiceName,
          },
        },
      };
    }

    // Add system instruction if specified (matching exact structure)
    if (this.config.systemInstruction) {
      setup.systemInstruction = {
        parts: [{ text: this.config.systemInstruction }],
      };
    }

    // Add tools if specified
    // Tools must be in the format: [{ functionDeclarations: [...] }]
    if (this.config.tools && this.config.tools.length > 0) {
      setup.tools = this.config.tools;
    }

    const message = { setup };

    // Log for debugging (redact sensitive parts)
    const logSafe = JSON.parse(JSON.stringify(message));
    if (logSafe.setup.systemInstruction) {
      logSafe.setup.systemInstruction = { parts: [{ text: "[REDACTED - too long]" }] };
    }
    console.log("Gemini Live: Sending setup message:", JSON.stringify(logSafe, null, 2));

    this.ws?.send(JSON.stringify(message));
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: unknown): void {
    // Handle string messages (JSON)
    if (typeof data === "string") {
      this.parseAndProcessMessage(data);
    } else if (data instanceof ArrayBuffer) {
      // Handle binary data - convert to string first
      // Gemini Live API sends JSON as binary ArrayBuffer
      try {
        const decoder = new TextDecoder("utf-8");
        const text = decoder.decode(data);
        this.parseAndProcessMessage(text);
      } catch (error) {
        console.error("Gemini Live: Failed to decode binary message:", error);
      }
    } else if (data instanceof Blob) {
      // Handle Blob data - convert to text
      data.text().then((text) => {
        this.parseAndProcessMessage(text);
      }).catch((error) => {
        console.error("Gemini Live: Failed to read Blob message:", error);
      });
    } else {
      console.log("Gemini Live: Received unknown data type", typeof data, data);
    }
  }

  /**
   * Parse JSON and process the server message
   */
  private parseAndProcessMessage(text: string): void {
    try {
      const message = JSON.parse(text) as GeminiServerMessage;

      // Log message type for debugging
      const messageType = "setupComplete" in message ? "setupComplete" :
                         "serverContent" in message ? "serverContent" :
                         "toolCall" in message ? "toolCall" :
                         "toolCallCancellation" in message ? "toolCallCancellation" : "unknown";
      console.log("Gemini Live: Received message type:", messageType);

      this.processServerMessage(message);
    } catch (error) {
      console.error("Failed to parse Gemini message:", error, text.slice(0, 200));
    }
  }

  /**
   * Process server message
   */
  private async processServerMessage(
    message: GeminiServerMessage
  ): Promise<void> {
    // Setup complete
    if ("setupComplete" in message) {
      this.setState("connected");
      return;
    }

    // Tool call
    if ("toolCall" in message) {
      this.setState("processing");
      const { functionCalls } = message.toolCall;

      for (const call of functionCalls) {
        try {
          const result = await this.callbacks.onToolCall(
            call.id,
            call.name,
            call.args
          );
          this.sendToolResponse(call.id, call.name, result);
        } catch (error) {
          console.error(`Tool call ${call.name} failed:`, error);
          this.sendToolResponse(call.id, call.name, {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
      return;
    }

    // Tool call cancellation
    if ("toolCallCancellation" in message) {
      // Tool calls were cancelled, just continue
      return;
    }

    // Server content (text/audio response)
    if ("serverContent" in message) {
      const { modelTurn, turnComplete, interrupted } = message.serverContent;

      if (interrupted) {
        // Response was interrupted
        this.currentTranscriptId = null;
        this.currentTranscriptContent = "";
        this.setState("connected");
        return;
      }

      if (modelTurn?.parts) {
        for (const part of modelTurn.parts) {
          this.processContentPart(part);
        }
      }

      if (turnComplete) {
        // Finalize transcript entry if we have content
        if (this.currentTranscriptContent && this.currentTranscriptId) {
          this.callbacks.onTranscript({
            id: this.currentTranscriptId,
            role: "assistant",
            content: this.currentTranscriptContent,
            timestamp: Date.now(),
            isAudio: true,
          });
        }
        this.currentTranscriptId = null;
        this.currentTranscriptContent = "";
        this.setState("connected");
      }
    }
  }

  /**
   * Process a content part from server response
   */
  private processContentPart(part: GeminiContentPart): void {
    // Text content
    if ("text" in part) {
      if (!this.currentTranscriptId) {
        this.currentTranscriptId = nanoid(10);
      }
      this.currentTranscriptContent += part.text;
    }

    // Audio content
    if ("inlineData" in part) {
      if (part.inlineData.mimeType.startsWith("audio/")) {
        this.setState("speaking");
        const audioData = this.base64ToArrayBuffer(part.inlineData.data);
        this.callbacks.onAudioData(audioData);
      }
    }
  }

  /**
   * Handle WebSocket disconnect
   */
  private handleDisconnect(event: CloseEvent): void {
    // If closed cleanly or already disconnected, don't reconnect
    if (event.code === 1000 || this.state === "disconnected") {
      this.setState("disconnected");
      return;
    }

    // Try to reconnect
    if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      const delay = RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1);

      console.log(
        `Gemini Live: Attempting reconnect ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`
      );

      setTimeout(() => {
        this.connect().catch((error) => {
          console.error("Reconnection failed:", error);
        });
      }, delay);
    } else {
      this.setState("error");
      this.callbacks.onError(
        new Error("Failed to connect after multiple attempts")
      );
    }
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
