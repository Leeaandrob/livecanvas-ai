/**
 * Canvas Component
 *
 * Main canvas container for all block types (diagrams, sticky notes, text)
 * Supports pan (drag to move) like Miro/Figma
 */

import { useCallback, useRef, useState, useEffect, MouseEvent } from "react";
import type {
  CanvasBlock,
  MermaidBlock as MermaidBlockType,
  StickyNoteBlock,
  Position,
  StickyColor,
} from "@live-canvas/protocols";
import { isMermaidBlock, isStickyNoteBlock } from "@live-canvas/protocols";
import { MermaidBlock } from "./MermaidBlock";
import { StickyNote } from "./StickyNote";
import { AICursor } from "./AICursor";
import { Presence } from "./Presence";
import type { UserPresence } from "@live-canvas/protocols";

type BlockType = 'mermaid' | 'sticky' | 'text';

interface CanvasProps {
  blocks: CanvasBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlock: (id: string, updates: Partial<CanvasBlock>) => void;
  onDeleteBlock: (id: string) => void;
  onEditBlock: (id: string) => void;
  onAddBlock: (position?: Position) => void;
  onAddStickyNote: (color?: StickyColor, position?: Position) => void;
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
  onDeleteBlock,
  onEditBlock,
  onAddBlock,
  onAddStickyNote,
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

  // Block type selector menu state
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<Position>({ x: 0, y: 0 });
  const [pendingBlockPosition, setPendingBlockPosition] = useState<Position | null>(null);

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

      // Close menu on Escape
      if (e.code === "Escape") {
        setShowBlockMenu(false);
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
      // Close menu if clicking outside
      if (showBlockMenu) {
        setShowBlockMenu(false);
      }

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
    [isSpacePressed, showBlockMenu]
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

  // Handle double-click to show block type menu
  const handleDoubleClick = useCallback(
    (e: MouseEvent) => {
      if (isSpacePressed) return;
      if (e.target !== canvasRef.current) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const canvasPos = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };

        setMenuPosition({ x: e.clientX, y: e.clientY });
        setPendingBlockPosition(canvasPos);
        setShowBlockMenu(true);
      }
    },
    [isSpacePressed]
  );

  // Handle block type selection from menu
  const handleSelectBlockType = useCallback(
    (type: BlockType) => {
      if (!pendingBlockPosition) return;

      // Account for scroll position
      const scrollX = wrapperRef.current?.scrollLeft || 0;
      const scrollY = wrapperRef.current?.scrollTop || 0;
      const actualPosition = {
        x: pendingBlockPosition.x + scrollX,
        y: pendingBlockPosition.y + scrollY,
      };

      switch (type) {
        case 'mermaid':
          onAddBlock(actualPosition);
          break;
        case 'sticky':
          onAddStickyNote('yellow', actualPosition);
          break;
        case 'text':
          // TODO: Implement text block
          break;
      }

      setShowBlockMenu(false);
      setPendingBlockPosition(null);
    },
    [pendingBlockPosition, onAddBlock, onAddStickyNote]
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

  // Render a block based on its type
  const renderBlock = useCallback(
    (block: CanvasBlock) => {
      if (isMermaidBlock(block)) {
        return (
          <MermaidBlock
            key={block.id}
            block={block}
            selected={block.id === selectedBlockId}
            onSelect={() => onSelectBlock(block.id)}
            onUpdate={(updates) => onUpdateBlock(block.id, updates as Partial<MermaidBlockType>)}
            onDoubleClick={() => onEditBlock(block.id)}
            onFixSyntax={onFixSyntax}
          />
        );
      }

      if (isStickyNoteBlock(block)) {
        return (
          <StickyNote
            key={block.id}
            block={block}
            selected={block.id === selectedBlockId}
            onSelect={() => onSelectBlock(block.id)}
            onUpdate={(updates) => onUpdateBlock(block.id, updates as Partial<StickyNoteBlock>)}
            onDelete={() => onDeleteBlock(block.id)}
          />
        );
      }

      // TODO: Handle TextBlock
      return null;
    },
    [selectedBlockId, onSelectBlock, onUpdateBlock, onEditBlock, onDeleteBlock, onFixSyntax]
  );

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
        {blocks.map(renderBlock)}

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
            <p>Double-click anywhere to add a block</p>
            <p style={{ fontSize: "13px", marginTop: "8px" }}>
              Choose from diagrams, sticky notes, or text
            </p>
          </div>
        )}
      </div>

      {/* Block type selector menu */}
      {showBlockMenu && (
        <div
          className="block-type-menu"
          style={{
            position: "fixed",
            left: menuPosition.x,
            top: menuPosition.y,
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="block-type-option"
            onClick={() => handleSelectBlockType('mermaid')}
          >
            <span className="block-type-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3h7zM7 9H4V5h3v4zm10 6h3v4h-3v-4zm0-10h3v4h-3V5z" />
              </svg>
            </span>
            <span className="block-type-label">Diagram</span>
          </button>
          <button
            className="block-type-option sticky"
            onClick={() => handleSelectBlockType('sticky')}
          >
            <span className="block-type-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19 3H4.99c-1.11 0-1.98.89-1.98 2L3 19c0 1.1.88 2 1.99 2H15l6-6V5c0-1.11-.9-2-2-2zm-7 8H7v-2h5v2zm5-4H7V5h10v2z" />
              </svg>
            </span>
            <span className="block-type-label">Sticky Note</span>
          </button>
        </div>
      )}
    </div>
  );
}
