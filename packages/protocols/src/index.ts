/**
 * @live-canvas/protocols
 *
 * Shared type definitions for LiveCanvas AI
 */

// Board types
export type { Board, MermaidBlock, Position, Size } from "./board";

// Event types
export type {
  BoardStateUpdate,
  ProposePatch,
  RequestAnalysis,
  RequestRefactor,
  RequestGenerate,
  RequestFixSyntax,
  CanvasAgentEvent,
} from "./events";

// Message types
export type {
  SyncMessage,
  AwarenessMessage,
  AICursorMessage,
  AIResponseMessage,
  ErrorMessage,
  AIVoiceActivityMessage,
  WebSocketMessage,
} from "./messages";

// AI types
export type {
  ProviderType,
  AIAction,
  AIRequest,
  AIResponse,
  AIStreamChunk,
  UserPresence,
  AIPresence,
  Presence,
  Settings,
} from "./ai";

// Gemini Live types
export type {
  GeminiSessionState,
  GeminiLiveConfig,
  GeminiVoiceName,
  GeminiToolDeclaration,
  GeminiFunctionDeclaration,
  GeminiParameterSchema,
  GeminiSetupMessage,
  GeminiRealtimeInputMessage,
  GeminiClientContentMessage,
  GeminiToolResponseMessage,
  GeminiClientMessage,
  GeminiSetupCompleteMessage,
  GeminiServerContentMessage,
  GeminiToolCallMessage,
  GeminiToolCallCancellationMessage,
  GeminiContentPart,
  GeminiServerMessage,
  TranscriptEntry,
  ToolExecutionContext,
  ToolResult,
  AIVoiceState,
} from "./gemini-live";
