/**
 * Anthropic provider implementation
 */

import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, ProviderConfig } from "./types";

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor(config: ProviderConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
    this.model = config.model || "claude-sonnet-4-20250514";
  }

  async *stream(prompt: string, systemPrompt?: string): AsyncIterable<string> {
    const stream = await this.client.messages.stream({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt || "You are a helpful AI assistant.",
      messages: [{ role: "user", content: prompt }],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }

  async complete(prompt: string, systemPrompt?: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt || "You are a helpful AI assistant.",
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find((block) => block.type === "text");
    return textContent?.type === "text" ? textContent.text : "";
  }
}
