/**
 * Mermaid Diagram Utilities
 *
 * Initialization and rendering helpers for Mermaid diagrams
 */

import mermaid from "mermaid";

let initialized = false;

/**
 * Initialize Mermaid with dark theme settings
 * CRITICAL: startOnLoad must be false for programmatic rendering
 */
export function initMermaid(): void {
  if (initialized) return;

  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose", // Required for click handlers
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: "basis",
    },
    sequence: {
      useMaxWidth: true,
    },
    themeVariables: {
      primaryColor: "#00d4ff",
      primaryTextColor: "#e6edf3",
      primaryBorderColor: "#30363d",
      lineColor: "#8b949e",
      secondaryColor: "#161b22",
      tertiaryColor: "#21262d",
      background: "#0d1117",
      mainBkg: "#161b22",
      nodeBorder: "#30363d",
      clusterBkg: "#21262d",
      clusterBorder: "#30363d",
      titleColor: "#e6edf3",
      edgeLabelBackground: "#161b22",
    },
  });

  initialized = true;
}

/**
 * Render a Mermaid diagram to SVG
 * @param id - Unique ID for the diagram
 * @param code - Mermaid code
 * @returns SVG string
 */
export async function renderMermaid(id: string, code: string): Promise<string> {
  initMermaid();

  // Validate and render
  const { svg } = await mermaid.render(id, code);
  return svg;
}

/**
 * Validate Mermaid syntax without rendering
 * @param code - Mermaid code to validate
 * @returns true if valid, error message if invalid
 */
export async function validateMermaid(
  code: string
): Promise<{ valid: boolean; error?: string }> {
  initMermaid();

  try {
    await mermaid.parse(code);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Invalid syntax",
    };
  }
}

/**
 * Extract diagram type from Mermaid code
 */
export function getDiagramType(code: string): string {
  const firstLine = code.trim().split("\n")[0].toLowerCase();

  if (firstLine.startsWith("graph ") || firstLine.startsWith("flowchart ")) {
    return "flowchart";
  }
  if (firstLine.startsWith("sequencediagram")) {
    return "sequence";
  }
  if (firstLine.startsWith("classdiagram")) {
    return "class";
  }
  if (firstLine.startsWith("statediagram")) {
    return "state";
  }
  if (firstLine.startsWith("erdiagram")) {
    return "er";
  }
  if (firstLine.startsWith("journey")) {
    return "journey";
  }
  if (firstLine.startsWith("gantt")) {
    return "gantt";
  }
  if (firstLine.startsWith("pie")) {
    return "pie";
  }
  if (firstLine.startsWith("mindmap")) {
    return "mindmap";
  }

  return "unknown";
}
