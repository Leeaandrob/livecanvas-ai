/**
 * Toolbar Component
 *
 * Action buttons for the canvas
 */

interface ToolbarProps {
  boardId: string;
  connected: boolean;
  hasSelectedBlock: boolean;
  isLoading: boolean;
  onAddBlock: () => void;
  onAnalyze: () => void;
  onRefactor: () => void;
  onOpenSettings: () => void;
  onDeleteBlock?: () => void;
}

export function Toolbar({
  boardId,
  connected,
  hasSelectedBlock,
  isLoading,
  onAddBlock,
  onAnalyze,
  onRefactor,
  onOpenSettings,
  onDeleteBlock,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <span className="toolbar-title">LiveCanvas AI</span>

      <div
        style={{
          fontSize: "12px",
          color: "var(--color-text-muted)",
        }}
      >
        Board: {boardId.slice(0, 8)}...
      </div>

      <div className={`connection-status ${connected ? "connected" : "disconnected"}`}>
        <span className="status-dot" />
        {connected ? "Connected" : "Disconnected"}
      </div>

      <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
        <button
          className="btn btn-secondary"
          onClick={onOpenSettings}
          title="Settings"
        >
          ⚙ Settings
        </button>

        <button className="btn btn-primary" onClick={onAddBlock}>
          + Add Block
        </button>

        <button
          className="btn btn-secondary"
          onClick={onAnalyze}
          disabled={!hasSelectedBlock || isLoading}
          title={!hasSelectedBlock ? "Select a block first" : "Analyze diagram"}
        >
          Analyze
        </button>

        <button
          className="btn btn-secondary"
          onClick={onRefactor}
          disabled={!hasSelectedBlock || isLoading}
          title={!hasSelectedBlock ? "Select a block first" : "Suggest improvements"}
        >
          Refactor
        </button>

        {hasSelectedBlock && onDeleteBlock && (
          <button
            className="btn btn-secondary"
            onClick={onDeleteBlock}
            style={{ color: "var(--color-error)" }}
            title="Delete selected block"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
