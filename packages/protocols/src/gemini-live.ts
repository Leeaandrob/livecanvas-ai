/**
 * Gemini Live API Types
 *
 * Type definitions for real-time voice interaction with Gemini
 */

// Session state
export type GeminiSessionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "listening"
  | "processing"
  | "speaking"
  | "error";

// Gemini Live configuration
export interface GeminiLiveConfig {
  apiKey: string;
  model?: string;
  voiceName?: GeminiVoiceName;
  systemInstruction?: string;
  tools?: GeminiToolDeclaration[];
}

// Available voice names
export type GeminiVoiceName =
  | "Puck"
  | "Charon"
  | "Kore"
  | "Fenrir"
  | "Aoede";

// Tool declaration for function calling
export interface GeminiToolDeclaration {
  functionDeclarations: GeminiFunctionDeclaration[];
}

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, GeminiParameterSchema>;
    required?: string[];
  };
}

export interface GeminiParameterSchema {
  type: "string" | "number" | "boolean" | "array" | "object";
  description?: string;
  enum?: string[];
  items?: GeminiParameterSchema;
}

// Client to server messages
export interface GeminiSetupMessage {
  setup: {
    model: string;
    generationConfig?: {
      responseModalities: ("TEXT" | "AUDIO")[];
      speechConfig?: {
        voiceConfig?: {
          prebuiltVoiceConfig?: {
            voiceName: string;
          };
        };
      };
    };
    systemInstruction?: {
      parts: { text: string }[];
    };
    tools?: GeminiToolDeclaration[];
  };
}

export interface GeminiRealtimeInputMessage {
  realtimeInput: {
    mediaChunks: {
      mimeType: string;
      data: string; // base64 encoded
    }[];
  };
}

export interface GeminiClientContentMessage {
  clientContent: {
    turns: {
      role: "user";
      parts: { text: string }[];
    }[];
    turnComplete: boolean;
  };
}

export interface GeminiToolResponseMessage {
  toolResponse: {
    functionResponses: {
      id: string;
      name: string;
      response: Record<string, unknown>;
    }[];
  };
}

export type GeminiClientMessage =
  | GeminiSetupMessage
  | GeminiRealtimeInputMessage
  | GeminiClientContentMessage
  | GeminiToolResponseMessage;

// Server to client messages
export interface GeminiSetupCompleteMessage {
  setupComplete: Record<string, never>;
}

export interface GeminiServerContentMessage {
  serverContent: {
    modelTurn?: {
      parts: GeminiContentPart[];
    };
    turnComplete?: boolean;
    interrupted?: boolean;
  };
}

export interface GeminiToolCallMessage {
  toolCall: {
    functionCalls: {
      id: string;
      name: string;
      args: Record<string, unknown>;
    }[];
  };
}

export interface GeminiToolCallCancellationMessage {
  toolCallCancellation: {
    ids: string[];
  };
}

export type GeminiContentPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }
  | { executableCode: { language: string; code: string } }
  | { codeExecutionResult: { outcome: string; output: string } };

export type GeminiServerMessage =
  | GeminiSetupCompleteMessage
  | GeminiServerContentMessage
  | GeminiToolCallMessage
  | GeminiToolCallCancellationMessage;

// Transcript entry for conversation history
export interface TranscriptEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isAudio?: boolean;
}

// Tool execution context
export interface ToolExecutionContext {
  addBlock: (code?: string) => { id: string };
  updateBlock: (id: string, updates: { code: string }) => void;
  deleteBlock: (id: string) => void;
  getBlock: (id: string) => { id: string; code: string } | undefined;
  getAllBlocks: () => { id: string; code: string }[];
  selectBlock: (id: string | null) => void;
  selectedBlockId: string | null;
}

// Tool result
export interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;
}

// Voice activity state for awareness
export interface AIVoiceState {
  isActive: boolean;
  state: GeminiSessionState;
  userName?: string;
}
