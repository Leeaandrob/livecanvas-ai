/**
 * Frontend-specific types for LiveCanvas AI
 */

import type { MermaidBlock, Position } from "@live-canvas/protocols";

// Re-export protocol types for convenience
export type { Board, MermaidBlock, Position, Size } from "@live-canvas/protocols";
export type {
  UserPresence,
  AIPresence,
  Presence,
  Settings,
  ProviderType,
} from "@live-canvas/protocols";

// Frontend-specific types
export interface CanvasState {
  blocks: MermaidBlock[];
  selectedBlockId: string | null;
  pan: Position;
  zoom: number;
}

export interface EditorState {
  isEditing: boolean;
  blockId: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface AIState {
  isLoading: boolean;
  response: string;
  error: string | null;
}

export interface ConnectionState {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
}
