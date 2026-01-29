/**
 * StickyNote Component
 *
 * A colorful sticky note block for annotations
 */

import { useState, useCallback, useRef, useEffect, MouseEvent, KeyboardEvent } from "react";
import type { StickyNoteBlock, StickyColor } from "@live-canvas/protocols";
import { STICKY_COLORS } from "@live-canvas/protocols";

// Minimum block dimensions
const MIN_WIDTH = 120;
const MIN_HEIGHT = 80;

interface StickyNoteProps {
  block: StickyNoteBlock;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<StickyNoteBlock>) => void;
  onDelete: () => void;
}

export function StickyNote({
  block,
  selected,
  onSelect,
  onUpdate,
  onDelete,
}: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragStart = useRef<{ mouseX: number; mouseY: number; blockX: number; blockY: number } | null>(null);
  const resizeStart = useRef<{ mouseX: number; mouseY: number; width: number; height: number } | null>(null);

  const colors = STICKY_COLORS[block.color];

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 0 || isEditing) return;
      e.preventDefault();
      e.stopPropagation();

      onSelect();

      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        blockX: block.position.x,
        blockY: block.position.y,
      };

      setIsDragging(true);
    },
    [onSelect, block.position.x, block.position.y, isEditing]
  );

  // Handle mouse down for resizing
  const handleResizeMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      onSelect();

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

  // Handle dragging
  useEffect(() => {
    if (!isDragging || !dragStart.current) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!dragStart.current) return;

      const deltaX = e.clientX - dragStart.current.mouseX;
      const deltaY = e.clientY - dragStart.current.mouseY;

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

  // Handle resizing
  useEffect(() => {
    if (!isResizing || !resizeStart.current) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!resizeStart.current) return;

      const deltaX = e.clientX - resizeStart.current.mouseX;
      const deltaY = e.clientY - resizeStart.current.mouseY;

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

  // Handle double click to edit
  const handleDoubleClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  // Handle text change
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdate({ content: e.target.value });
    },
    [onUpdate]
  );

  // Handle blur to stop editing
  const handleBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Handle keyboard in textarea
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      setIsEditing(false);
    }
    // Don't propagate to prevent canvas shortcuts
    e.stopPropagation();
  }, []);

  // Handle color change
  const handleColorChange = useCallback(
    (color: StickyColor) => {
      onUpdate({ color });
      setShowColorPicker(false);
    },
    [onUpdate]
  );

  // Handle delete
  const handleDelete = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      onDelete();
    },
    [onDelete]
  );

  const getCursor = () => {
    if (isEditing) return "text";
    if (isResizing) return "nwse-resize";
    if (isDragging) return "grabbing";
    return "grab";
  };

  return (
    <div
      className={`sticky-note ${selected ? "selected" : ""} ${isResizing ? "resizing" : ""}`}
      style={{
        left: block.position.x,
        top: block.position.y,
        width: block.size.width,
        height: block.size.height,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
        cursor: getCursor(),
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Header with color picker and delete */}
      <div className="sticky-note-header">
        <button
          className="sticky-note-color-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowColorPicker(!showColorPicker);
          }}
          style={{ backgroundColor: colors.border }}
          title="Change color"
        />
        <button
          className="sticky-note-delete-btn"
          onClick={handleDelete}
          title="Delete"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      {/* Color picker dropdown */}
      {showColorPicker && (
        <div className="sticky-note-color-picker" onClick={(e) => e.stopPropagation()}>
          {(Object.keys(STICKY_COLORS) as StickyColor[]).map((color) => (
            <button
              key={color}
              className={`color-option ${color === block.color ? "active" : ""}`}
              style={{ backgroundColor: STICKY_COLORS[color].bg, borderColor: STICKY_COLORS[color].border }}
              onClick={() => handleColorChange(color)}
              title={color}
            />
          ))}
        </div>
      )}

      {/* Content area */}
      <div className="sticky-note-content">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="sticky-note-textarea"
            value={block.content}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Write a note..."
            style={{ color: colors.text }}
          />
        ) : (
          <div className="sticky-note-text">
            {block.content || <span className="placeholder">Double-click to edit</span>}
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div
        className="resize-handle"
        onMouseDown={handleResizeMouseDown}
        title="Drag to resize"
        style={{ color: colors.border }}
      >
        <svg viewBox="0 0 10 10" width="10" height="10">
          <path d="M0 10 L10 0 M4 10 L10 4 M8 10 L10 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    </div>
  );
}
