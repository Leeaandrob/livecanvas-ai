/**
 * Google Gemini provider implementation
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, ProviderConfig } from "./types";

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(config: ProviderConfig) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model || "gemini-2.0-flash";
  }

  async *stream(prompt: string, systemPrompt?: string): AsyncIterable<string> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }

  async complete(prompt: string, systemPrompt?: string): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
