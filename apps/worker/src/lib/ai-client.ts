/**
 * AI Client wrapper for LiveCanvas AI
 *
 * Provides a unified interface to interact with AI providers
 * in the Cloudflare Workers environment.
 */

import { createProvider } from "@live-canvas/ai-providers";
import type { ProviderType } from "@live-canvas/protocols";

export interface AIClientConfig {
  provider: ProviderType;
  apiKey: string;
}

/**
 * Create an AI client instance
 */
export function createAIClient(config: AIClientConfig) {
  return createProvider(config.provider, config.apiKey);
}

/**
 * Stream AI response and return a ReadableStream
 */
export async function streamAIResponse(
  config: AIClientConfig,
  prompt: string,
  systemPrompt?: string
): Promise<ReadableStream<Uint8Array>> {
  const provider = createProvider(config.provider, config.apiKey);
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of provider.stream(prompt, systemPrompt)) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "AI streaming error";
        controller.enqueue(encoder.encode(`\n\nError: ${errorMessage}`));
        controller.close();
      }
    },
  });
}
