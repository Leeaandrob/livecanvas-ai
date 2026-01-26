/**
 * AIResponse Component
 *
 * Displays AI analysis/refactor response below the canvas
 */

import { useCallback } from "react";

interface AIResponseProps {
  response: string;
  error: string | null;
  isLoading: boolean;
  onApplyPatch?: (mermaid: string) => void;
  onClose: () => void;
}

export function AIResponse({
  response,
  error,
  isLoading,
  onApplyPatch,
  onClose,
}: AIResponseProps) {
  // Extract Mermaid code from response for apply button
  const extractMermaidCode = useCallback((text: string): string | null => {
    const mermaidKeywords = "graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph";

    // Try ```mermaid blocks (with optional whitespace after mermaid)
    const mermaidMatch = text.match(/```mermaid[\s\n]*([\s\S]*?)```/i);
    if (mermaidMatch) {
      return mermaidMatch[1].trim();
    }

    // Try generic code blocks with mermaid content
    const genericRegex = new RegExp(
      "```[\\s\\n]*((?:" + mermaidKeywords + ")[\\s\\S]*?)```",
      "i"
    );
    const genericMatch = text.match(genericRegex);
    if (genericMatch) {
      return genericMatch[1].trim();
    }

    return null;
  }, []);

  const mermaidCode = extractMermaidCode(response);

  if (!response && !error && !isLoading) {
    return null;
  }

  return (
    <div className="ai-response">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontWeight: 600 }}>
          {isLoading ? "AI is analyzing..." : "AI Response"}
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          {mermaidCode && onApplyPatch && (
            <button
              className="btn btn-primary"
              onClick={() => onApplyPatch(mermaidCode)}
              disabled={isLoading}
            >
              Apply Changes
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: "var(--color-error)", marginBottom: "8px" }}>
          Error: {error}
        </div>
      )}

      <div className="ai-response-content">
        {response || (isLoading ? "Waiting for response..." : "")}
        {isLoading && <span className="thinking-indicator" style={{ marginLeft: "4px" }}>
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </span>}
      </div>
    </div>
  );
}
