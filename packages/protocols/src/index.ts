/**
 * @live-canvas/protocols
 *
 * Shared type definitions for LiveCanvas AI
 */

// Board types
export type {
  Board,
  BaseBlock,
  MermaidBlock,
  StickyNoteBlock,
  TextBlock,
  CanvasBlock,
  Position,
  Size,
  StickyColor,
  TextFontSize,
} from "./board";

export {
  isMermaidBlock,
  isStickyNoteBlock,
  isTextBlock,
  STICKY_COLORS,
  DEFAULT_BLOCK_SIZES,
} from "./board";

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

// Design Session types
export type {
  EntityType,
  RelationType,
  C4Level,
  DiagramType,
  SessionPhase,
  DecisionStatus,
  ValidationSeverity,
  ValidationCategory,
  QualityAttribute,
  Constraint,
  DataFlowSpec,
  EntityInterface,
  DependencyRef,
  SemanticEntity,
  SemanticRelationship,
  Invariant,
  SemanticDiagram,
  DecisionAlternative,
  ArchitectureDecision,
  ValidationIssue,
  ValidationResult,
  ConversationTurn,
  Requirements,
  DesignSession,
  PatternVariable,
  PatternValidation,
  ArchitecturePattern,
  UserIntent,
  DetectedIntent,
} from "./design-session";

export {
  createDesignSession,
  createSemanticEntity,
  createArchitectureDecision,
  createConversationTurn,
} from "./design-session";
