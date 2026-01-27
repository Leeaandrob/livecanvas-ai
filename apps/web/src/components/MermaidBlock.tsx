/**
 * MermaidBlock Component
 *
 * Renders a single Mermaid diagram block with drag and resize support
 */

import { useEffect, useState, useCallback, useRef, MouseEvent } from "react";
import type { MermaidBlock as MermaidBlockType } from "@live-canvas/protocols";
import { renderMermaid } from "../lib/mermaid";

// Minimum block dimensions
const MIN_WIDTH = 150;
const MIN_HEIGHT = 100;

interface MermaidBlockProps {
  block: MermaidBlockType;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<MermaidBlockType>) => void;
  onDoubleClick: () => void;
  onFixSyntax?: (code: string) => Promise<string | null>;
}

export function MermaidBlock({
  block,
  selected,
  onSelect,
  onUpdate,
  onDoubleClick,
  onFixSyntax,
}: MermaidBlockProps) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef<{ mouseX: number; mouseY: number; blockX: number; blockY: number } | null>(null);
  const resizeStart = useRef<{ mouseX: number; mouseY: number; width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track if we need to update lastValidCode (separate from render effect)
  const pendingLastValidCodeRef = useRef<string | null>(null);

  // Render Mermaid diagram
  useEffect(() => {
    if (!block.code.trim()) {
      setSvg("");
      setError(null);
      return;
    }

    let cancelled = false;

    const render = async () => {
      try {
        const result = await renderMermaid(`mermaid-${block.id}`, block.code);
        if (!cancelled) {
          setSvg(result);
          setError(null);
          // Mark that we need to update lastValidCode (but don't do it here to avoid loops)
          if (block.code !== block.lastValidCode) {
            pendingLastValidCodeRef.current = block.code;
          }
        }
      } catch (err) {
        if (cancelled) return;

        const errorMessage =
          err instanceof Error ? err.message : "Invalid Mermaid syntax";
        setError(errorMessage);

        // Show last valid diagram if available
        if (block.lastValidCode && block.lastValidCode !== block.code) {
          try {
            const fallbackSvg = await renderMermaid(
              `mermaid-fallback-${block.id}`,
              block.lastValidCode
            );
            if (!cancelled) {
              setSvg(fallbackSvg);
            }
          } catch {
            // Even fallback failed
          }
        }
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [block.code, block.id, block.lastValidCode]);

  // Update lastValidCode in a separate effect to avoid render loops
  useEffect(() => {
    if (pendingLastValidCodeRef.current && pendingLastValidCodeRef.current === block.code) {
      const codeToUpdate = pendingLastValidCodeRef.current;
      pendingLastValidCodeRef.current = null;
      onUpdate({ lastValidCode: codeToUpdate });
    }
  }, [block.code, onUpdate]);

  // Track which code we've tried to auto-fix to avoid repeated attempts
  const attemptedFixRef = useRef<string | null>(null);

  // Handle auto-fix separately - only attempt once per unique error code
  useEffect(() => {
    // Only auto-fix if:
    // 1. There's an error
    // 2. We have a fix function
    // 3. We're not already fixing
    // 4. We haven't already tried to fix this exact code
    if (error && onFixSyntax && !isFixing && attemptedFixRef.current !== block.code) {
      attemptedFixRef.current = block.code;
      let cancelled = false;
      setIsFixing(true);

      onFixSyntax(block.code)
        .then((fixed) => {
          if (!cancelled && fixed && fixed !== block.code) {
            // Reset the attempted fix ref so if the new code also has errors,
            // we can try to fix it
            attemptedFixRef.current = null;
            onUpdate({ code: fixed });
          }
        })
        .catch(() => {
          // Fix failed, keep showing error
        })
        .finally(() => {
          if (!cancelled) {
            setIsFixing(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }
  }, [error, block.code, onFixSyntax, isFixing, onUpdate]);

  // Reset attempted fix when code changes successfully (no error)
  useEffect(() => {
    if (!error) {
      attemptedFixRef.current = null;
    }
  }, [error]);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      e.preventDefault();
      e.stopPropagation();

      onSelect();

      // Save starting positions for drag calculation
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        blockX: block.position.x,
        blockY: block.position.y,
      };

      setIsDragging(true);
    },
    [onSelect, block.position.x, block.position.y]
  );

  // Handle mouse down for resizing
  const handleResizeMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      e.preventDefault();
      e.stopPropagation();

      onSelect();

      // Save starting positions and size for resize calculation
      resizeStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        width: block.size.width,
        height: block.size.height,
      };

      setIsResizing(true);
    },
    [onSelect, block.size.width, block.size.height]
  );

  // Handle mouse move for dragging
  useEffect(() => {
    if (!isDragging || !dragStart.current) {
      return;
    }

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!dragStart.current) return;

      // Calculate delta from initial mouse position
      const deltaX = e.clientX - dragStart.current.mouseX;
      const deltaY = e.clientY - dragStart.current.mouseY;

      // New position is initial block position + delta
      const x = Math.max(0, dragStart.current.blockX + deltaX);
      const y = Math.max(0, dragStart.current.blockY + deltaY);

      onUpdate({ position: { x, y } });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStart.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onUpdate]);

  // Handle mouse move for resizing
  useEffect(() => {
    if (!isResizing || !resizeStart.current) {
      return;
    }

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!resizeStart.current) return;

      // Calculate delta from initial mouse position
      const deltaX = e.clientX - resizeStart.current.mouseX;
      const deltaY = e.clientY - resizeStart.current.mouseY;

      // New size is initial size + delta, with minimum constraints
      const width = Math.max(MIN_WIDTH, resizeStart.current.width + deltaX);
      const height = Math.max(MIN_HEIGHT, resizeStart.current.height + deltaY);

      onUpdate({ size: { width, height } });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStart.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, onUpdate]);

  // Determine cursor style
  const getCursor = () => {
    if (isResizing) return "nwse-resize";
    if (isDragging) return "grabbing";
    return "grab";
  };

  return (
    <div
      ref={containerRef}
      className={`mermaid-block ${selected ? "selected" : ""} ${isResizing ? "resizing" : ""}`}
      style={{
        left: block.position.x,
        top: block.position.y,
        width: block.size.width,
        minHeight: block.size.height,
        cursor: getCursor(),
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
    >
      {error && (
        <div className="error" style={{ pointerEvents: "none" }}>
          {isFixing ? "AI is fixing syntax..." : `Syntax error: ${error}`}
        </div>
      )}

      {svg && (
        <div
          className="mermaid-diagram"
          style={{ pointerEvents: "none" }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}

      {!svg && !error && (
        <div className="placeholder" style={{ pointerEvents: "none" }}>
          Double-click to edit diagram
        </div>
      )}

      {/* Resize handle - bottom right corner */}
      <div
        className="resize-handle"
        onMouseDown={handleResizeMouseDown}
        title="Drag to resize"
      >
        <svg viewBox="0 0 10 10" width="10" height="10">
          <path d="M0 10 L10 0 M4 10 L10 4 M8 10 L10 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    </div>
  );
}
