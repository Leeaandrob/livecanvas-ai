/**
 * AICursor Component
 *
 * Animated AI cursor that shows when the AI is "thinking"
 */

import type { Position } from "@live-canvas/protocols";

interface AICursorProps {
  position: Position | null;
  state: "thinking" | "idle";
}

export function AICursor({ position, state }: AICursorProps) {
  // Don't render if idle or no position
  if (state === "idle" || !position) return null;

  return (
    <div
      className="ai-cursor"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <svg
        className="cursor-icon"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ transform: "rotate(-15deg)" }}
      >
        <path d="M5.65376 12.4563L11.9997 3L18.3457 12.4563H14.4997V21H9.49973V12.4563H5.65376Z" />
      </svg>
      <span className="cursor-label">AI Assistant</span>
      <span className="thinking-indicator">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </span>
    </div>
  );
}
