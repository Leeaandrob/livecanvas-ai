/**
 * Pattern Assistant
 *
 * Shared utility for pattern-aware diagram generation.
 * Integrates the Pattern Library with chat and voice interfaces.
 */

import {
  suggestPatternsFromDescription,
  getPatternById,
  ALL_PATTERNS,
  type PatternCategory,
} from "@live-canvas/ai-providers";
import type { ArchitecturePattern } from "@live-canvas/protocols";

export interface PatternSuggestion {
  pattern: ArchitecturePattern;
  relevance: "high" | "medium" | "low";
  reason: string;
}

export interface EnhancedPrompt {
  originalPrompt: string;
  enhancedPrompt: string;
  suggestedPatterns: PatternSuggestion[];
  suggestedDiagramType: string;
}

/**
 * Analyze user prompt and suggest relevant architecture patterns
 */
export function analyzePromptForPatterns(prompt: string): PatternSuggestion[] {
  const patterns = suggestPatternsFromDescription(prompt);
  const lower = prompt.toLowerCase();

  return patterns.map((pattern) => {
    // Determine relevance based on keyword matching
    let relevance: "high" | "medium" | "low" = "medium";
    let reason = "";

    // Check for exact pattern name mentions
    if (lower.includes(pattern.name.toLowerCase())) {
      relevance = "high";
      reason = `You mentioned "${pattern.name}" directly`;
    }
    // Check for strong keyword matches
    else if (
      pattern.whenToUse.some((use) =>
        use
          .toLowerCase()
          .split(" ")
          .some((word) => word.length > 4 && lower.includes(word))
      )
    ) {
      relevance = "high";
      reason = `Matches your use case: ${pattern.whenToUse[0]}`;
    }
    // Default medium relevance
    else {
      reason = pattern.description.slice(0, 80) + "...";
    }

    return { pattern, relevance, reason };
  });
}

/**
 * Get the best Mermaid template for a pattern based on context
 */
export function getPatternTemplate(
  pattern: ArchitecturePattern,
  preferredType?: string
): string | null {
  const templates = pattern.templates;

  // Priority order based on preference
  if (preferredType) {
    const key = preferredType as keyof typeof templates;
    if (templates[key]) return templates[key]!;
  }

  // Default priority: flowchart > sequence > c4Container > state > er
  return (
    templates.flowchart ||
    templates.sequence ||
    templates.c4Container ||
    templates.state ||
    templates.er ||
    null
  );
}

/**
 * Enhance a user prompt with pattern context for better AI generation
 */
export function enhancePromptWithPatterns(prompt: string): EnhancedPrompt {
  const suggestions = analyzePromptForPatterns(prompt);
  const highRelevance = suggestions.filter((s) => s.relevance === "high");

  // Determine best diagram type based on keywords
  let suggestedDiagramType = "flowchart";
  const lower = prompt.toLowerCase();

  if (
    lower.includes("sequence") ||
    lower.includes("flow") ||
    lower.includes("request") ||
    lower.includes("api call")
  ) {
    suggestedDiagramType = "sequence";
  } else if (
    lower.includes("state") ||
    lower.includes("status") ||
    lower.includes("lifecycle")
  ) {
    suggestedDiagramType = "state";
  } else if (
    lower.includes("database") ||
    lower.includes("entity") ||
    lower.includes("table")
  ) {
    suggestedDiagramType = "er";
  } else if (
    lower.includes("class") ||
    lower.includes("object") ||
    lower.includes("inheritance")
  ) {
    suggestedDiagramType = "class";
  } else if (
    lower.includes("c4") ||
    lower.includes("container") ||
    lower.includes("system context")
  ) {
    suggestedDiagramType = "c4Container";
  }

  // Build enhanced prompt
  let enhancedPrompt = prompt;

  if (highRelevance.length > 0) {
    const patternContext = highRelevance
      .slice(0, 2)
      .map((s) => {
        const template = getPatternTemplate(s.pattern, suggestedDiagramType);
        return `
## Pattern: ${s.pattern.name}
${s.pattern.description}

### When to use:
${s.pattern.whenToUse.slice(0, 3).map((u) => `- ${u}`).join("\n")}

### Trade-offs:
Pros: ${s.pattern.tradeoffs.pros.slice(0, 2).join(", ")}
Cons: ${s.pattern.tradeoffs.cons.slice(0, 2).join(", ")}

${template ? `### Reference Template:\n\`\`\`mermaid\n${template}\n\`\`\`` : ""}
`;
      })
      .join("\n---\n");

    enhancedPrompt = `${prompt}

---
RELEVANT ARCHITECTURE PATTERNS FOR CONTEXT:
${patternContext}

Please create a diagram that incorporates these patterns appropriately. Use the templates as reference but adapt them to the specific requirements.`;
  }

  return {
    originalPrompt: prompt,
    enhancedPrompt,
    suggestedPatterns: suggestions,
    suggestedDiagramType,
  };
}

/**
 * Get pattern summary for voice/chat display
 */
export function getPatternSummary(patternId: string): string | null {
  const pattern = getPatternById(patternId);
  if (!pattern) return null;

  return `${pattern.name}: ${pattern.description.slice(0, 100)}...
Trade-offs: ${pattern.tradeoffs.pros[0]} vs ${pattern.tradeoffs.cons[0]}`;
}

/**
 * Get all available pattern names grouped by category
 */
export function getPatternCatalog(): Record<PatternCategory, string[]> {
  const catalog: Record<string, string[]> = {};

  for (const pattern of ALL_PATTERNS) {
    if (!catalog[pattern.category]) {
      catalog[pattern.category] = [];
    }
    catalog[pattern.category].push(pattern.name);
  }

  return catalog as Record<PatternCategory, string[]>;
}

/**
 * Format pattern suggestions for display in chat
 */
export function formatPatternSuggestionsForChat(
  suggestions: PatternSuggestion[]
): string {
  if (suggestions.length === 0) {
    return "";
  }

  const high = suggestions.filter((s) => s.relevance === "high");
  const medium = suggestions.filter((s) => s.relevance === "medium");

  let message = "🏗️ **Detected Architecture Patterns:**\n\n";

  if (high.length > 0) {
    message += "**Highly Relevant:**\n";
    high.forEach((s) => {
      message += `• **${s.pattern.name}** - ${s.reason}\n`;
    });
  }

  if (medium.length > 0 && high.length < 3) {
    message += "\n**Also Consider:**\n";
    medium.slice(0, 2).forEach((s) => {
      message += `• ${s.pattern.name}\n`;
    });
  }

  return message;
}

/**
 * Format pattern suggestions for voice response
 */
export function formatPatternSuggestionsForVoice(
  suggestions: PatternSuggestion[]
): string {
  if (suggestions.length === 0) {
    return "I didn't detect any specific architecture patterns in your request.";
  }

  const high = suggestions.filter((s) => s.relevance === "high");

  if (high.length === 0) {
    return `I found some potentially relevant patterns: ${suggestions
      .slice(0, 2)
      .map((s) => s.pattern.name)
      .join(" and ")}.`;
  }

  if (high.length === 1) {
    return `Based on your description, the ${high[0].pattern.name} pattern would be a great fit. ${high[0].pattern.description.slice(0, 100)}.`;
  }

  return `I identified ${high.length} relevant patterns: ${high
    .map((s) => s.pattern.name)
    .join(", ")}. Would you like me to create a diagram using any of these?`;
}
