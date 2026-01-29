/**
 * Architecture Pattern Library
 *
 * A curated collection of software architecture patterns with
 * Mermaid templates, trade-offs, and usage guidance.
 */

import type { ArchitecturePattern } from "@live-canvas/protocols";

// Pattern categories
export type PatternCategory =
  | "architecture"
  | "data"
  | "integration"
  | "resilience"
  | "security"
  | "scalability"
  | "deployment";

// Re-export pattern collections
export { ARCHITECTURE_PATTERNS } from "./architecture-patterns";
export { DATA_PATTERNS } from "./data-patterns";
export { INTEGRATION_PATTERNS } from "./integration-patterns";
export { RESILIENCE_PATTERNS } from "./resilience-patterns";

// Import all patterns
import { ARCHITECTURE_PATTERNS } from "./architecture-patterns";
import { DATA_PATTERNS } from "./data-patterns";
import { INTEGRATION_PATTERNS } from "./integration-patterns";
import { RESILIENCE_PATTERNS } from "./resilience-patterns";

/**
 * All patterns combined
 */
export const ALL_PATTERNS: ArchitecturePattern[] = [
  ...ARCHITECTURE_PATTERNS,
  ...DATA_PATTERNS,
  ...INTEGRATION_PATTERNS,
  ...RESILIENCE_PATTERNS,
];

/**
 * Get pattern by ID
 */
export function getPatternById(id: string): ArchitecturePattern | undefined {
  return ALL_PATTERNS.find((p) => p.id === id);
}

/**
 * Get patterns by category
 */
export function getPatternsByCategory(
  category: PatternCategory
): ArchitecturePattern[] {
  return ALL_PATTERNS.filter((p) => p.category === category);
}

/**
 * Search patterns by keyword
 */
export function searchPatterns(keyword: string): ArchitecturePattern[] {
  const lower = keyword.toLowerCase();
  return ALL_PATTERNS.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower) ||
      p.whenToUse.some((w) => w.toLowerCase().includes(lower))
  );
}

/**
 * Suggest patterns based on context
 */
export function suggestPatterns(context: {
  scale?: "small" | "medium" | "large";
  teamSize?: number;
  realtime?: boolean;
  distributed?: boolean;
  eventDriven?: boolean;
  domain?: string;
}): ArchitecturePattern[] {
  const suggestions: ArchitecturePattern[] = [];

  // Architecture patterns
  if (context.scale === "large" || (context.teamSize && context.teamSize > 10)) {
    suggestions.push(getPatternById("microservices-basic")!);
  } else if (context.scale === "medium" || (context.teamSize && context.teamSize > 3)) {
    suggestions.push(getPatternById("modular-monolith")!);
  }

  // Data patterns
  if (context.eventDriven) {
    suggestions.push(getPatternById("event-sourcing")!);
    suggestions.push(getPatternById("cqrs")!);
  }

  if (context.distributed) {
    suggestions.push(getPatternById("saga-choreography")!);
    suggestions.push(getPatternById("outbox-pattern")!);
  }

  // Integration patterns
  if (context.scale === "large" || context.distributed) {
    suggestions.push(getPatternById("api-gateway")!);
  }

  // Resilience patterns (always recommend for distributed)
  if (context.distributed || context.scale === "large") {
    suggestions.push(getPatternById("circuit-breaker")!);
    suggestions.push(getPatternById("retry-with-backoff")!);
  }

  return suggestions.filter(Boolean);
}

/**
 * Get pattern suggestions based on natural language description
 */
export function suggestPatternsFromDescription(
  description: string
): ArchitecturePattern[] {
  const lower = description.toLowerCase();
  const suggestions: ArchitecturePattern[] = [];

  // Architecture keywords
  if (
    lower.includes("microservice") ||
    lower.includes("separate service") ||
    lower.includes("independent deployment")
  ) {
    suggestions.push(getPatternById("microservices-basic")!);
  }

  if (
    lower.includes("modular") ||
    lower.includes("monolith") ||
    lower.includes("single deployment")
  ) {
    suggestions.push(getPatternById("modular-monolith")!);
  }

  if (lower.includes("serverless") || lower.includes("lambda") || lower.includes("function")) {
    suggestions.push(getPatternById("serverless-event-driven")!);
  }

  // Data keywords
  if (lower.includes("event") || lower.includes("audit") || lower.includes("history")) {
    suggestions.push(getPatternById("event-sourcing")!);
  }

  if (
    lower.includes("read") &&
    lower.includes("write") &&
    (lower.includes("separate") || lower.includes("different"))
  ) {
    suggestions.push(getPatternById("cqrs")!);
  }

  if (
    lower.includes("distributed transaction") ||
    lower.includes("multiple service") ||
    lower.includes("saga")
  ) {
    suggestions.push(getPatternById("saga-orchestration")!);
    suggestions.push(getPatternById("saga-choreography")!);
  }

  // Integration keywords
  if (lower.includes("api gateway") || lower.includes("single entry") || lower.includes("gateway")) {
    suggestions.push(getPatternById("api-gateway")!);
  }

  if (lower.includes("bff") || lower.includes("backend for frontend") || lower.includes("mobile")) {
    suggestions.push(getPatternById("bff")!);
  }

  // Resilience keywords
  if (lower.includes("circuit breaker") || lower.includes("fail fast") || lower.includes("cascade")) {
    suggestions.push(getPatternById("circuit-breaker")!);
  }

  if (lower.includes("retry") || lower.includes("backoff") || lower.includes("transient")) {
    suggestions.push(getPatternById("retry-with-backoff")!);
  }

  if (lower.includes("bulkhead") || lower.includes("isolate") || lower.includes("partition")) {
    suggestions.push(getPatternById("bulkhead")!);
  }

  return [...new Set(suggestions.filter(Boolean))];
}
