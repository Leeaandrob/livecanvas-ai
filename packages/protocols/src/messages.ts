/**
 * WebSocket message types for real-time collaboration
 */

import type { Position } from "./board";

export interface SyncMessage {
  type: "sync";
  data: Uint8Array;
}

export interface AwarenessMessage {
  type: "awareness";
  data: Uint8Array;
}

export interface AICursorMessage {
  type: "ai-cursor";
  position: Position | null;
  state: "thinking" | "idle";
}

export interface AIResponseMessage {
  type: "ai-response";
  content: string;
  done: boolean;
}

export interface ErrorMessage {
  type: "error";
  message: string;
  code?: string;
}

export interface AIVoiceActivityMessage {
  type: "ai-voice-activity";
  isActive: boolean;
  state: "disconnected" | "connecting" | "connected" | "listening" | "processing" | "speaking" | "error";
  userName?: string;
}

export type WebSocketMessage =
  | SyncMessage
  | AwarenessMessage
  | AICursorMessage
  | AIResponseMessage
  | ErrorMessage
  | AIVoiceActivityMessage;
