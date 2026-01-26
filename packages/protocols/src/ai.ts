/**
 * AI request/response types for LiveCanvas AI
 */

import type { Position } from "./board";

export type ProviderType = "openai" | "anthropic" | "gemini";

export type AIAction = "generate" | "analyze" | "refactor" | "fix-syntax";

export interface AIRequest {
  action: AIAction;
  mermaid?: string;
  prompt?: string;
  provider: ProviderType;
  apiKey: string;
}

export interface AIResponse {
  success: boolean;
  content?: string;
  mermaid?: string;
  error?: string;
}

export interface AIStreamChunk {
  type: "chunk" | "done" | "error";
  content?: string;
  error?: string;
}

export interface UserPresence {
  id: string;
  name: string;
  color: string;
  cursor: Position | null;
}

export interface AIPresence {
  id: "ai-agent";
  name: "AI Assistant";
  cursor: Position | null;
  state: "thinking" | "idle";
}

export type Presence = UserPresence | AIPresence;

export interface Settings {
  provider: ProviderType;
  apiKey: string;
  userName?: string;
  userColor?: string;
  // Gemini Voice settings
  geminiVoiceEnabled?: boolean;
  geminiVoiceName?: "Puck" | "Charon" | "Kore" | "Fenrir" | "Aoede";
}
