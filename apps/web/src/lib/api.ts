/**
 * API Client
 *
 * Handles API calls to the worker backend
 */

import type { AIRequest, ProviderType } from "@live-canvas/protocols";
import { getApiBaseUrl } from "./websocket";

interface ApiConfig {
  provider: ProviderType;
  apiKey: string;
  boardId?: string;
}

/**
 * Make an AI API call with streaming response
 */
export async function* streamAI(
  endpoint: string,
  data: { mermaid?: string; prompt?: string; instructions?: string },
  config: ApiConfig
): AsyncGenerator<string, void, unknown> {
  const baseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.boardId) {
    headers["X-Board-Id"] = config.boardId;
  }

  const response = await fetch(`${baseUrl}/api/${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...data,
      provider: config.provider,
      apiKey: config.apiKey,
    } as AIRequest),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    if (text) {
      yield text;
    }
  }
}

/**
 * Call fix-syntax endpoint (non-streaming)
 */
export async function fixSyntax(
  mermaid: string,
  config: ApiConfig
): Promise<string | null> {
  const baseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.boardId) {
    headers["X-Board-Id"] = config.boardId;
  }

  const response = await fetch(`${baseUrl}/api/fix-syntax`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      mermaid,
      provider: config.provider,
      apiKey: config.apiKey,
    } as AIRequest),
  });

  if (!response.ok) {
    return null;
  }

  const result = await response.json();
  return result.success ? result.mermaid : null;
}

/**
 * Analyze a Mermaid diagram
 */
export function analyzeStream(
  mermaid: string,
  config: ApiConfig
): AsyncGenerator<string, void, unknown> {
  return streamAI("analyze", { mermaid }, config);
}

/**
 * Refactor a Mermaid diagram
 */
export function refactorStream(
  mermaid: string,
  config: ApiConfig
): AsyncGenerator<string, void, unknown> {
  return streamAI("refactor", { mermaid }, config);
}

/**
 * Generate a Mermaid diagram from prompt
 */
export function generateStream(
  prompt: string,
  config: ApiConfig
): AsyncGenerator<string, void, unknown> {
  return streamAI("generate", { prompt }, config);
}

/**
 * Modify an existing Mermaid diagram based on instructions
 */
export function modifyStream(
  mermaid: string,
  instructions: string,
  config: ApiConfig
): AsyncGenerator<string, void, unknown> {
  return streamAI("modify", { mermaid, instructions }, config);
}
