/**
 * LiveCanvas Tools for Gemini Live
 *
 * Tool definitions and executor for voice-controlled diagram operations
 */

import type {
  GeminiToolDeclaration,
  ToolExecutionContext,
  ToolResult,
} from "@live-canvas/protocols";

/**
 * System instruction for the voice assistant
 */
export const VOICE_ASSISTANT_SYSTEM_INSTRUCTION = `You are a helpful voice assistant for LiveCanvas, a real-time collaborative diagramming tool.

Your role is to help users create Mermaid diagrams through natural conversation.

IMPORTANT: When creating diagrams, always include the Mermaid code in a code block like this:
\`\`\`mermaid
graph TD
    A[Start] --> B[End]
\`\`\`

CRITICAL MERMAID SYNTAX RULES:
1. Keep diagrams SIMPLE - prefer fewer nodes with clear labels
2. Use simple node IDs (A, B, C or short names like Start, End, User)
3. Always quote labels with special characters: A["Label with spaces"]
4. For flowcharts: use graph TD (top-down) or graph LR (left-right)
5. For sequence diagrams: use simple participant names without spaces
6. Avoid complex nested structures - break into simpler diagrams if needed
7. Don't use activate/deactivate unless necessary
8. Keep alt/else blocks simple with just 2-3 alternatives max

FLOWCHART EXAMPLES:
\`\`\`mermaid
graph TD
    A[User Request] --> B{Valid?}
    B -->|Yes| C[Process]
    B -->|No| D[Error]
    C --> E[Response]
\`\`\`

SEQUENCE DIAGRAM EXAMPLE:
\`\`\`mermaid
sequenceDiagram
    User->>API: Request
    API->>DB: Query
    DB-->>API: Data
    API-->>User: Response
\`\`\`

Key behaviors:
- Create simple, clear diagrams that render correctly
- Keep responses brief since this is voice interaction
- After creating a diagram, briefly describe what you created
- If the request is complex, simplify it into a cleaner diagram

Supported diagram types: flowchart, sequenceDiagram, classDiagram, stateDiagram-v2, erDiagram, pie, mindmap`;

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
