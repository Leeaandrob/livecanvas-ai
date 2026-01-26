/**
 * AI Provider interface for multi-provider abstraction
 */

export interface AIProvider {
  /**
   * Stream a response from the AI provider
   * @param prompt - The user prompt
   * @param systemPrompt - Optional system prompt
   * @returns AsyncIterable of string chunks
   */
  stream(prompt: string, systemPrompt?: string): AsyncIterable<string>;

  /**
   * Get a complete response from the AI provider
   * @param prompt - The user prompt
   * @param systemPrompt - Optional system prompt
   * @returns Complete response string
   */
  complete(prompt: string, systemPrompt?: string): Promise<string>;
}

export type ProviderType = "openai" | "anthropic" | "gemini";

export interface ProviderConfig {
  apiKey: string;
  model?: string;
}
