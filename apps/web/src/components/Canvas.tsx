/**
 * Canvas Component
 *
 * Main canvas container for Mermaid diagram blocks
 * Supports pan (drag to move) like Miro/Figma
 */

import { useCallback, useRef, useState, useEffect, MouseEvent } from "react";
import type { MermaidBlock as MermaidBlockType, Position } from "@live-canvas/protocols";
import { MermaidBlock } from "./MermaidBlock";
import { AICursor } from "./AICursor";
import { Presence } from "./Presence";
import type { UserPresence } from "@live-canvas/protocols";

interface CanvasProps {
  blocks: MermaidBlockType[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlock: (id: string, updates: Partial<MermaidBlockType>) => void;
  onEditBlock: (id: string) => void;
  onAddBlock: (position?: Position) => void;
  onFixSyntax: (code: string) => Promise<string | null>;
  users: UserPresence[];
  aiCursor: { position: Position | null; state: "thinking" | "idle" };
  onCursorMove: (position: Position | null) => void;
}

export function Canvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onEditBlock,
  onAddBlock,
  onFixSyntax,
  users,
  aiCursor,
  onCursorMove,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const panStart = useRef<{ x: number; y: number; scrollX: number; scrollY: number } | null>(null);

  // Handle spacebar for pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept space when typing in input fields
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (e.code === "Space" && !e.repeat && !isInputField) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        setIsPanning(false);
        panStart.current = null;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Handle mouse down for panning
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      // Middle mouse button (button 1) or Space + left click
      if (e.button === 1 || (isSpacePressed && e.button === 0)) {
        e.preventDefault();
        setIsPanning(true);
        panStart.current = {
          x: e.clientX,
          y: e.clientY,
          scrollX: wrapperRef.current?.scrollLeft || 0,
          scrollY: wrapperRef.current?.scrollTop || 0,
        };
      }
    },
    [isSpacePressed]
  );

  // Handle mouse move for panning
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // Handle panning
      if (isPanning && panStart.current && wrapperRef.current) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        wrapperRef.current.scrollLeft = panStart.current.scrollX - dx;
        wrapperRef.current.scrollTop = panStart.current.scrollY - dy;
        return;
      }

      // Track cursor position for presence
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        onCursorMove({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    },
    [isPanning, onCursorMove]
  );

  // Handle mouse up to stop panning
  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      panStart.current = null;
    }
  }, [isPanning]);

  // Handle canvas click (deselect) - only if not panning
  const handleCanvasClick = useCallback(
    (e: MouseEvent) => {
      if (isPanning || isSpacePressed) return;
      if (e.target === canvasRef.current) {
        onSelectBlock(null);
      }
    },
    [onSelectBlock, isPanning, isSpacePressed]
  );

  // Handle double-click to add block - only if not in pan mode
  const handleDoubleClick = useCallback(
    (e: MouseEvent) => {
      if (isSpacePressed) return;
      if (e.target !== canvasRef.current) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        onAddBlock({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    },
    [onAddBlock, isSpacePressed]
  );

  const handleMouseLeave = useCallback(() => {
    onCursorMove(null);
    if (isPanning) {
      setIsPanning(false);
      panStart.current = null;
    }
  }, [onCursorMove, isPanning]);

  // Prevent default middle-click behavior (auto-scroll)
  const handleAuxClick = useCallback((e: MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
    }
  }, []);

  // Cursor style based on pan state
  const cursorStyle = isPanning
    ? "grabbing"
    : isSpacePressed
      ? "grab"
      : "default";

  return (
    <div
      ref={wrapperRef}
      className="canvas-wrapper"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onAuxClick={handleAuxClick}
      style={{ cursor: cursorStyle }}
    >
      <div
        ref={canvasRef}
        className="canvas-container"
        onClick={handleCanvasClick}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: cursorStyle }}
      >
        {/* Render blocks */}
        {blocks.map((block) => (
          <MermaidBlock
            key={block.id}
            block={block}
            selected={block.id === selectedBlockId}
            onSelect={() => onSelectBlock(block.id)}
            onUpdate={(updates) => onUpdateBlock(block.id, updates)}
            onDoubleClick={() => onEditBlock(block.id)}
            onFixSyntax={onFixSyntax}
          />
        ))}

        {/* Render user cursors */}
        <Presence users={users} />

        {/* Render AI cursor */}
        <AICursor position={aiCursor.position} state={aiCursor.state} />

        {/* Empty state */}
        {blocks.length === 0 && (
          <div
            className="empty-state"
            style={{
              position: "absolute",
              top: "300px",
              left: "300px",
              textAlign: "center",
              color: "var(--color-text-secondary)",
            }}
          >
            <p>Double-click anywhere to add a diagram</p>
            <p style={{ fontSize: "13px", marginTop: "8px" }}>
              Or use the toolbar to add a block
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
