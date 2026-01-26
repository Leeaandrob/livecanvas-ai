/**
 * BlockEditor Component
 *
 * Inline editor for Mermaid code
 */

import { useState, useCallback, useEffect, useRef, KeyboardEvent } from "react";
import { useDebouncedCallback } from "use-debounce";

interface BlockEditorProps {
  code: string;
  position: { x: number; y: number };
  onChange: (code: string) => void;
  onClose: () => void;
}

export function BlockEditor({ code, position, onChange, onClose }: BlockEditorProps) {
  const [localCode, setLocalCode] = useState(code);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
    // Select all text
    textareaRef.current?.select();
  }, []);

  // Debounce updates to parent
  const debouncedOnChange = useDebouncedCallback((value: string) => {
    onChange(value);
  }, 500);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setLocalCode(value);
      debouncedOnChange(value);
    },
    [debouncedOnChange]
  );

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Escape to close
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }

      // Cmd/Ctrl+Enter to save and close
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onChange(localCode);
        onClose();
      }

      // Tab for indentation
      if (e.key === "Tab") {
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const newValue =
          localCode.substring(0, start) + "  " + localCode.substring(end);
        setLocalCode(newValue);
        debouncedOnChange(newValue);

        // Restore cursor position
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    },
    [localCode, onChange, onClose, debouncedOnChange]
  );

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".block-editor")) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      className="block-editor"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="editor-header">
        <span>Edit Mermaid</span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn btn-secondary"
            style={{ padding: "4px 8px", fontSize: "12px" }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            style={{ padding: "4px 8px", fontSize: "12px" }}
            onClick={() => {
              onChange(localCode);
              onClose();
            }}
          >
            Done
          </button>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={localCode}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        placeholder="Enter Mermaid code..."
      />

      <div
        style={{
          padding: "8px 12px",
          fontSize: "11px",
          color: "var(--color-text-muted)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <kbd>Esc</kbd> to cancel | <kbd>Cmd+Enter</kbd> to save | <kbd>Tab</kbd>{" "}
        to indent
      </div>
    </div>
  );
}
