/**
 * @live-canvas/ai-providers
 *
 * Multi-provider AI abstraction for LiveCanvas AI
 */

export type { AIProvider, ProviderType, ProviderConfig } from "./types";
export { OpenAIProvider } from "./openai";
export { AnthropicProvider } from "./anthropic";
export { GeminiProvider } from "./gemini";

// Design Session Prompts
export {
  DISCOVERY_AGENT_SYSTEM_PROMPT,
  DISCOVERY_QUESTIONS,
  DOMAIN_REQUIREMENTS,
  getRelevantQuestions,
  ARCHITECT_AGENT_SYSTEM_PROMPT,
  ARCHITECTURE_PATTERNS as PROMPT_ARCHITECTURE_PATTERNS,
  COMMON_TRADEOFFS,
  generateC4ContextTemplate,
  VALIDATOR_AGENT_SYSTEM_PROMPT,
  VALIDATION_RULES,
  getRulesByCategory,
  getRulesBySeverity,
  INTENT_ROUTER_SYSTEM_PROMPT,
  DESIGN_SESSION_SYSTEM_PROMPT,
  type ValidationRule,
} from "./prompts";

// Pattern Library
export {
  ALL_PATTERNS,
  ARCHITECTURE_PATTERNS,
  DATA_PATTERNS,
  INTEGRATION_PATTERNS,
  RESILIENCE_PATTERNS,
  getPatternById,
  getPatternsByCategory,
  searchPatterns,
  suggestPatterns,
  suggestPatternsFromDescription,
  type PatternCategory,
} from "./patterns";

import type { AIProvider, ProviderType, ProviderConfig } from "./types";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { GeminiProvider } from "./gemini";

/**
 * Factory function to create an AI provider instance
 * @param type - The provider type (openai, anthropic, or gemini)
 * @param apiKey - The API key for the provider
 * @param model - Optional model override
 * @returns AIProvider instance
 */
export function createProvider(
  type: ProviderType,
  apiKey: string,
  model?: string
): AIProvider {
  const config: ProviderConfig = { apiKey, model };

  switch (type) {
    case "openai":
      return new OpenAIProvider(config);
    case "anthropic":
      return new AnthropicProvider(config);
    case "gemini":
      return new GeminiProvider(config);
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}
