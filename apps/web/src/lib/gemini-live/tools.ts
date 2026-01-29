/**
 * LiveCanvas Tools for Gemini Live
 *
 * Tool definitions and executor for voice-controlled diagram operations
 * Integrated with Pattern Library for intelligent diagram generation
 */

import type {
  GeminiToolDeclaration,
  ToolExecutionContext,
  ToolResult,
} from "@live-canvas/protocols";
import {
  analyzePromptForPatterns,
  enhancePromptWithPatterns,
  getPatternTemplate,
  getPatternCatalog,
  formatPatternSuggestionsForVoice,
} from "../pattern-assistant";
import { getPatternById, ALL_PATTERNS } from "@live-canvas/ai-providers";

/**
 * System instruction for the voice assistant
 * Enhanced with Pattern Library knowledge
 */
export const VOICE_ASSISTANT_SYSTEM_INSTRUCTION = `You are an expert software architect assistant for LiveCanvas, a real-time collaborative diagramming tool.

Your role is to help users design software systems by creating Mermaid diagrams through natural conversation. You have deep knowledge of architecture patterns.

## ARCHITECTURE PATTERNS YOU KNOW:

**Architecture Patterns:**
- Microservices: Independent deployable services
- Modular Monolith: Single deployment with clear modules
- Serverless: Event-driven functions
- Hexagonal: Ports and adapters for testability
- Layered: N-tier separation of concerns

**Data Patterns:**
- CQRS: Separate read/write models
- Event Sourcing: Store events, not state
- Saga (Orchestration/Choreography): Distributed transactions
- Outbox Pattern: Reliable event publishing

**Integration Patterns:**
- API Gateway: Single entry point
- BFF (Backend for Frontend): Client-specific backends
- Service Mesh: Infrastructure-level communication
- Message Broker: Async pub/sub
- Anti-Corruption Layer: Legacy integration

**Resilience Patterns:**
- Circuit Breaker: Fail fast
- Bulkhead: Isolate failures
- Retry with Backoff: Handle transient errors
- Timeout & Fallback: Graceful degradation

## CAPABILITIES:

1. **suggest_patterns**: Analyze requirements and suggest relevant patterns
2. **apply_pattern**: Create diagrams using pattern templates
3. **create_diagram**: Generate custom Mermaid diagrams
4. **explain_pattern**: Explain trade-offs and when to use

## DIAGRAM CREATION RULES:

IMPORTANT: When creating diagrams, always include the Mermaid code in a code block:
\`\`\`mermaid
graph TD
    A[Start] --> B[End]
\`\`\`

Keep diagrams SIMPLE:
- Use clear node IDs (A, B, C or meaningful short names)
- Quote labels with special chars: A["Label here"]
- Prefer flowchart (graph TD/LR) for most cases
- Use sequenceDiagram for API flows

## KEY BEHAVIORS:

- When user describes a system, first identify relevant patterns
- Suggest patterns before creating complex diagrams
- Explain trade-offs briefly (it's voice!)
- Create simple, correct diagrams
- Break complex systems into multiple diagrams

Supported types: flowchart, sequenceDiagram, classDiagram, stateDiagram-v2, erDiagram, C4 diagrams`;

/**
 * Tool declarations for Gemini Live
 */
export const LIVECANVAS_TOOLS: GeminiToolDeclaration[] = [
  {
    functionDeclarations: [
      {
        name: "create_diagram",
        description:
          "Create a new Mermaid diagram on the canvas. Use this when the user asks to create, add, or make a new diagram.",
        parameters: {
          type: "object",
          properties: {
            mermaid_code: {
              type: "string",
              description:
                "Valid Mermaid diagram code. Must start with a diagram type like 'graph TD', 'sequenceDiagram', 'classDiagram', etc.",
            },
            description: {
              type: "string",
              description:
                "Brief description of what this diagram represents (optional)",
            },
          },
          required: ["mermaid_code"],
        },
      },
      {
        name: "update_diagram",
        description:
          "Update an existing diagram on the canvas. Use this to modify, change, or edit a diagram that's already on the canvas.",
        parameters: {
          type: "object",
          properties: {
            block_id: {
              type: "string",
              description:
                "The ID of the block to update. Use get_current_context to find block IDs.",
            },
            mermaid_code: {
              type: "string",
              description: "The new Mermaid code for the diagram",
            },
          },
          required: ["block_id", "mermaid_code"],
        },
      },
      {
        name: "select_block",
        description:
          "Select a specific diagram block on the canvas. Use this to focus on a particular diagram for viewing or further operations.",
        parameters: {
          type: "object",
          properties: {
            block_id: {
              type: "string",
              description: "The ID of the block to select, or null to deselect",
            },
          },
          required: ["block_id"],
        },
      },
      {
        name: "delete_block",
        description:
          "Delete a diagram block from the canvas. Use this when the user wants to remove a diagram.",
        parameters: {
          type: "object",
          properties: {
            block_id: {
              type: "string",
              description: "The ID of the block to delete",
            },
          },
          required: ["block_id"],
        },
      },
      {
        name: "get_current_context",
        description:
          "Get information about the current canvas state including all diagrams and which one is selected. Use this to understand what's currently on the canvas before making changes.",
        parameters: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "analyze_diagram",
        description:
          "Analyze a specific diagram to provide insights about its structure, nodes, connections, and potential improvements.",
        parameters: {
          type: "object",
          properties: {
            block_id: {
              type: "string",
              description:
                "The ID of the block to analyze. If not provided, analyzes the selected block.",
            },
          },
        },
      },
      {
        name: "suggest_patterns",
        description:
          "Analyze a system description and suggest relevant architecture patterns. Use this when the user describes a system they want to build.",
        parameters: {
          type: "object",
          properties: {
            description: {
              type: "string",
              description:
                "The system description or requirements to analyze for pattern suggestions.",
            },
          },
          required: ["description"],
        },
      },
      {
        name: "apply_pattern",
        description:
          "Create a diagram using a specific architecture pattern template. Use this after suggesting patterns or when user asks for a specific pattern.",
        parameters: {
          type: "object",
          properties: {
            pattern_id: {
              type: "string",
              description:
                "The ID of the pattern to apply (e.g., 'microservices-basic', 'circuit-breaker', 'saga-orchestration')",
            },
            customization: {
              type: "string",
              description:
                "Optional customization instructions for the pattern template",
            },
          },
          required: ["pattern_id"],
        },
      },
      {
        name: "list_patterns",
        description:
          "List all available architecture patterns grouped by category. Use this when user asks what patterns are available.",
        parameters: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description:
                "Optional category filter: 'architecture', 'data', 'integration', or 'resilience'",
            },
          },
        },
      },
    ],
  },
];

/**
 * Execute a tool call
 */
export async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<ToolResult> {
  switch (name) {
    case "create_diagram":
      return createDiagram(args, context);

    case "update_diagram":
      return updateDiagram(args, context);

    case "select_block":
      return selectBlock(args, context);

    case "delete_block":
      return deleteBlock(args, context);

    case "get_current_context":
      return getCurrentContext(context);

    case "analyze_diagram":
      return analyzeDiagram(args, context);

    case "suggest_patterns":
      return suggestPatterns(args);

    case "apply_pattern":
      return applyPattern(args, context);

    case "list_patterns":
      return listPatterns(args);

    default:
      return {
        success: false,
        message: `Unknown tool: ${name}`,
      };
  }
}

/**
 * Create a new diagram
 */
function createDiagram(
  args: Record<string, unknown>,
  context: ToolExecutionContext
): ToolResult {
  const mermaidCode = args.mermaid_code as string;

  if (!mermaidCode) {
    return {
      success: false,
      message: "Missing mermaid_code parameter",
    };
  }

  try {
    const block = context.addBlock(mermaidCode);
    context.selectBlock(block.id);

    return {
      success: true,
      message: `Created new diagram with ID ${block.id}`,
      data: {
        blockId: block.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to create diagram: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Update an existing diagram
 */
function updateDiagram(
  args: Record<string, unknown>,
  context: ToolExecutionContext
): ToolResult {
  const blockId = args.block_id as string;
  const mermaidCode = args.mermaid_code as string;

  if (!blockId || !mermaidCode) {
    return {
      success: false,
      message: "Missing block_id or mermaid_code parameter",
    };
  }

  const block = context.getBlock(blockId);
  if (!block) {
    return {
      success: false,
      message: `Block with ID ${blockId} not found`,
    };
  }

  try {
    context.updateBlock(blockId, { code: mermaidCode });

    return {
      success: true,
      message: `Updated diagram ${blockId}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to update diagram: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Select a block
 */
function selectBlock(
  args: Record<string, unknown>,
  context: ToolExecutionContext
): ToolResult {
  const blockId = args.block_id as string | null;

  if (blockId === null || blockId === "null" || blockId === "") {
    context.selectBlock(null);
    return {
      success: true,
      message: "Deselected all blocks",
    };
  }

  const block = context.getBlock(blockId);
  if (!block) {
    return {
      success: false,
      message: `Block with ID ${blockId} not found`,
    };
  }

  context.selectBlock(blockId);

  return {
    success: true,
    message: `Selected block ${blockId}`,
  };
}

/**
 * Delete a block
 */
function deleteBlock(
  args: Record<string, unknown>,
  context: ToolExecutionContext
): ToolResult {
  const blockId = args.block_id as string;

  if (!blockId) {
    return {
      success: false,
      message: "Missing block_id parameter",
    };
  }

  const block = context.getBlock(blockId);
  if (!block) {
    return {
      success: false,
      message: `Block with ID ${blockId} not found`,
    };
  }

  try {
    context.deleteBlock(blockId);

    return {
      success: true,
      message: `Deleted block ${blockId}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to delete block: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Get current canvas context
 */
function getCurrentContext(context: ToolExecutionContext): ToolResult {
  const blocks = context.getAllBlocks();
  const selectedBlockId = context.selectedBlockId;

  const blockSummaries = blocks.map((block) => ({
    id: block.id,
    isSelected: block.id === selectedBlockId,
    codePreview: block.code.slice(0, 100) + (block.code.length > 100 ? "..." : ""),
    diagramType: detectDiagramType(block.code),
  }));

  return {
    success: true,
    message: `Canvas has ${blocks.length} diagram(s)`,
    data: {
      totalBlocks: blocks.length,
      selectedBlockId,
      blocks: blockSummaries,
    },
  };
}

/**
 * Analyze a diagram
 */
function analyzeDiagram(
  args: Record<string, unknown>,
  context: ToolExecutionContext
): ToolResult {
  let blockId = args.block_id as string | undefined;

  // If no block ID provided, use selected block
  if (!blockId) {
    blockId = context.selectedBlockId || undefined;
  }

  if (!blockId) {
    return {
      success: false,
      message: "No block specified and no block is selected",
    };
  }

  const block = context.getBlock(blockId);
  if (!block) {
    return {
      success: false,
      message: `Block with ID ${blockId} not found`,
    };
  }

  const analysis = analyzeCode(block.code);

  return {
    success: true,
    message: `Analyzed diagram ${blockId}`,
    data: analysis,
  };
}

/**
 * Detect the type of Mermaid diagram
 */
function detectDiagramType(code: string): string {
  const trimmed = code.trim().toLowerCase();

  if (trimmed.startsWith("graph") || trimmed.startsWith("flowchart")) {
    return "flowchart";
  }
  if (trimmed.startsWith("sequencediagram")) {
    return "sequence";
  }
  if (trimmed.startsWith("classdiagram")) {
    return "class";
  }
  if (trimmed.startsWith("statediagram")) {
    return "state";
  }
  if (trimmed.startsWith("erdiagram")) {
    return "er";
  }
  if (trimmed.startsWith("journey")) {
    return "journey";
  }
  if (trimmed.startsWith("gantt")) {
    return "gantt";
  }
  if (trimmed.startsWith("pie")) {
    return "pie";
  }
  if (trimmed.startsWith("mindmap")) {
    return "mindmap";
  }
  if (trimmed.startsWith("timeline")) {
    return "timeline";
  }
  if (trimmed.startsWith("gitgraph")) {
    return "gitgraph";
  }

  return "unknown";
}

/**
 * Analyze Mermaid code structure
 */
function analyzeCode(code: string): {
  type: string;
  nodeCount: number;
  connectionCount: number;
  complexity: "simple" | "moderate" | "complex";
  suggestions: string[];
} {
  const type = detectDiagramType(code);
  const lines = code.split("\n").filter((line) => line.trim());

  // Count nodes and connections (simplified heuristic)
  let nodeCount = 0;
  let connectionCount = 0;

  for (const line of lines) {
    // Count arrow/connection indicators
    if (line.includes("-->") || line.includes("->") || line.includes("---")) {
      connectionCount++;
    }
    // Count node definitions (brackets)
    const nodeMatches = line.match(/\[.*?\]|\{.*?\}|\(.*?\)/g);
    if (nodeMatches) {
      nodeCount += nodeMatches.length;
    }
  }

  // Determine complexity
  let complexity: "simple" | "moderate" | "complex" = "simple";
  if (nodeCount > 10 || connectionCount > 15) {
    complexity = "complex";
  } else if (nodeCount > 5 || connectionCount > 7) {
    complexity = "moderate";
  }

  // Generate suggestions
  const suggestions: string[] = [];
  if (nodeCount === 0) {
    suggestions.push("The diagram appears to have no visible nodes");
  }
  if (connectionCount === 0) {
    suggestions.push("Consider adding connections between elements");
  }
  if (complexity === "complex") {
    suggestions.push("Consider breaking this into smaller sub-diagrams");
  }

  return {
    type,
    nodeCount,
    connectionCount,
    complexity,
    suggestions,
  };
}

/**
 * Suggest architecture patterns based on description
 */
function suggestPatterns(args: Record<string, unknown>): ToolResult {
  const description = args.description as string;

  if (!description) {
    return {
      success: false,
      message: "Missing description parameter",
    };
  }

  const suggestions = analyzePromptForPatterns(description);
  const voiceSummary = formatPatternSuggestionsForVoice(suggestions);

  const highRelevance = suggestions.filter((s) => s.relevance === "high");
  const patternDetails = highRelevance.slice(0, 3).map((s) => ({
    id: s.pattern.id,
    name: s.pattern.name,
    category: s.pattern.category,
    reason: s.reason,
    tradeoffs: {
      pros: s.pattern.tradeoffs.pros.slice(0, 2),
      cons: s.pattern.tradeoffs.cons.slice(0, 2),
    },
  }));

  return {
    success: true,
    message: voiceSummary,
    data: {
      suggestedPatterns: patternDetails,
      totalFound: suggestions.length,
      highRelevanceCount: highRelevance.length,
    },
  };
}

/**
 * Apply a pattern template to create a diagram
 */
function applyPattern(
  args: Record<string, unknown>,
  context: ToolExecutionContext
): ToolResult {
  const patternId = args.pattern_id as string;
  const customization = args.customization as string | undefined;

  if (!patternId) {
    return {
      success: false,
      message: "Missing pattern_id parameter",
    };
  }

  const pattern = getPatternById(patternId);
  if (!pattern) {
    return {
      success: false,
      message: `Pattern '${patternId}' not found. Use list_patterns to see available patterns.`,
    };
  }

  // Get the best template for this pattern
  const template = getPatternTemplate(pattern);
  if (!template) {
    return {
      success: false,
      message: `Pattern '${pattern.name}' has no diagram templates available.`,
    };
  }

  try {
    const block = context.addBlock(template);
    context.selectBlock(block.id);

    return {
      success: true,
      message: `Created ${pattern.name} diagram. ${customization ? "You can customize it further." : ""}`,
      data: {
        blockId: block.id,
        patternName: pattern.name,
        patternCategory: pattern.category,
        whenToUse: pattern.whenToUse.slice(0, 2),
        relatedPatterns: pattern.relatedPatterns,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to create pattern diagram: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * List available patterns
 */
function listPatterns(args: Record<string, unknown>): ToolResult {
  const category = args.category as string | undefined;

  const catalog = getPatternCatalog();

  if (category && catalog[category as keyof typeof catalog]) {
    const patterns = catalog[category as keyof typeof catalog];
    return {
      success: true,
      message: `${category} patterns: ${patterns.join(", ")}`,
      data: {
        category,
        patterns,
        count: patterns.length,
      },
    };
  }

  // Return all categories
  const summary = Object.entries(catalog)
    .map(([cat, patterns]) => `${cat}: ${patterns.length}`)
    .join(", ");

  return {
    success: true,
    message: `Available patterns - ${summary}. Ask about a specific category for details.`,
    data: {
      categories: Object.keys(catalog),
      catalog,
      totalPatterns: ALL_PATTERNS.length,
    },
  };
}
