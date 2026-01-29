/**
 * useBoard Hook
 *
 * Manages board state (blocks) via Yjs document
 * Supports multiple block types: Mermaid diagrams, Sticky notes, Text blocks
 */

import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import * as Y from "yjs";
import { nanoid } from "nanoid";
import type {
  CanvasBlock,
  MermaidBlock,
  StickyNoteBlock,
  TextBlock,
  Position,
  Size,
  StickyColor,
  TextFontSize,
} from "@live-canvas/protocols";
import { DEFAULT_BLOCK_SIZES, isMermaidBlock, isStickyNoteBlock } from "@live-canvas/protocols";

interface UseBoardResult {
  blocks: CanvasBlock[];
  // Mermaid block operations
  addBlock: (code?: string, position?: Position, size?: Size) => MermaidBlock;
  // Sticky note operations
  addStickyNote: (content?: string, color?: StickyColor, position?: Position) => StickyNoteBlock;
  // Text block operations
  addTextBlock: (content?: string, fontSize?: TextFontSize, position?: Position) => TextBlock;
  // Generic operations
  updateBlock: (id: string, updates: Partial<CanvasBlock>) => void;
  deleteBlock: (id: string) => void;
  getBlock: (id: string) => CanvasBlock | undefined;
}

const DEFAULT_MERMAID_CODE = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Do Something]
    B -->|No| D[Do Something Else]
    C --> E[End]
    D --> E`;

/**
 * Compare two blocks to check if they're equal (for snapshot caching)
 */
function blocksEqual(a: CanvasBlock, b: CanvasBlock): boolean {
  // Basic properties
  if (
    a.id !== b.id ||
    a.type !== b.type ||
    a.position.x !== b.position.x ||
    a.position.y !== b.position.y ||
    a.size.width !== b.size.width ||
    a.size.height !== b.size.height
  ) {
    return false;
  }

  // Type-specific properties
  if (isMermaidBlock(a) && isMermaidBlock(b)) {
    return a.code === b.code && a.lastValidCode === b.lastValidCode;
  }

  if (isStickyNoteBlock(a) && isStickyNoteBlock(b)) {
    return a.content === b.content && a.color === b.color;
  }

  // TextBlock
  if (a.type === 'text' && b.type === 'text') {
    return a.content === b.content && a.fontSize === b.fontSize && a.fontWeight === b.fontWeight;
  }

  return true;
}

export function useBoard(doc: Y.Doc): UseBoardResult {
  // Get or create the blocks array in the Y.Doc
  const blocksArray = useMemo(() => doc.getArray<CanvasBlock>("blocks"), [doc]);

  // Cache for snapshot to prevent infinite loops
  const snapshotCache = useRef<CanvasBlock[]>([]);
  const versionRef = useRef(0);

  // Subscribe to blocks array changes
  const subscribe = useCallback(
    (callback: () => void) => {
      const observer = () => {
        versionRef.current += 1;
        callback();
      };
      blocksArray.observe(observer);
      return () => blocksArray.unobserve(observer);
    },
    [blocksArray]
  );

  // Get snapshot - return cached value if unchanged
  const getSnapshot = useCallback(() => {
    try {
      const newArray = blocksArray.toArray();

      // Check if content actually changed
      const hasChanged =
        snapshotCache.current.length !== newArray.length ||
        !newArray.every((block, i) => {
          const cached = snapshotCache.current[i];
          if (!cached) return false;
          return blocksEqual(block, cached);
        });

      if (hasChanged) {
        snapshotCache.current = newArray;
      }

      return snapshotCache.current;
    } catch (error) {
      console.error("useBoard: Error getting snapshot, returning cached:", error);
      return snapshotCache.current;
    }
  }, [blocksArray]);

  // Subscribe to blocks array changes using useSyncExternalStore
  const blocks = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  /**
   * Calculate next position for a new block
   */
  const getNextPosition = useCallback((): Position => {
    const currentBlocks = blocksArray.toArray();
    return {
      x: 100 + (currentBlocks.length % 5) * 50,
      y: 100 + Math.floor(currentBlocks.length / 5) * 50 + currentBlocks.length * 30,
    };
  }, [blocksArray]);

  /**
   * Add a new Mermaid diagram block
   */
  const addBlock = useCallback(
    (
      code: string = DEFAULT_MERMAID_CODE,
      position?: Position,
      size: Size = DEFAULT_BLOCK_SIZES.mermaid
    ): MermaidBlock => {
      try {
        const pos = position || getNextPosition();

        const block: MermaidBlock = {
          id: nanoid(10),
          type: 'mermaid',
          code,
          position: pos,
          size,
          lastValidCode: code,
          createdAt: Date.now(),
        };

        blocksArray.push([block]);
        return block;
      } catch (error) {
        console.error("useBoard: Error adding mermaid block:", error);
        return {
          id: nanoid(10),
          type: 'mermaid',
          code,
          position: position || { x: 100, y: 100 },
          size,
          lastValidCode: code,
        };
      }
    },
    [blocksArray, getNextPosition]
  );

  /**
   * Add a new Sticky Note block
   */
  const addStickyNote = useCallback(
    (
      content: string = "",
      color: StickyColor = "yellow",
      position?: Position
    ): StickyNoteBlock => {
      try {
        const pos = position || getNextPosition();

        const block: StickyNoteBlock = {
          id: nanoid(10),
          type: 'sticky',
          content,
          color,
          position: pos,
          size: { ...DEFAULT_BLOCK_SIZES.sticky },
          createdAt: Date.now(),
        };

        blocksArray.push([block]);
        return block;
      } catch (error) {
        console.error("useBoard: Error adding sticky note:", error);
        return {
          id: nanoid(10),
          type: 'sticky',
          content,
          color,
          position: position || { x: 100, y: 100 },
          size: { ...DEFAULT_BLOCK_SIZES.sticky },
        };
      }
    },
    [blocksArray, getNextPosition]
  );

  /**
   * Add a new Text block
   */
  const addTextBlock = useCallback(
    (
      content: string = "Text",
      fontSize: TextFontSize = "medium",
      position?: Position
    ): TextBlock => {
      try {
        const pos = position || getNextPosition();

        const block: TextBlock = {
          id: nanoid(10),
          type: 'text',
          content,
          fontSize,
          fontWeight: 'normal',
          position: pos,
          size: { ...DEFAULT_BLOCK_SIZES.text },
          createdAt: Date.now(),
        };

        blocksArray.push([block]);
        return block;
      } catch (error) {
        console.error("useBoard: Error adding text block:", error);
        return {
          id: nanoid(10),
          type: 'text',
          content,
          fontSize,
          fontWeight: 'normal',
          position: position || { x: 100, y: 100 },
          size: { ...DEFAULT_BLOCK_SIZES.text },
        };
      }
    },
    [blocksArray, getNextPosition]
  );

  /**
   * Update an existing block
   */
  const updateBlock = useCallback(
    (id: string, updates: Partial<CanvasBlock>) => {
      try {
        const currentBlocks = blocksArray.toArray();
        const index = currentBlocks.findIndex((b) => b.id === id);

        if (index === -1) {
          return;
        }

        doc.transact(() => {
          const current = blocksArray.get(index);
          const updated = { ...current, ...updates } as CanvasBlock;

          // Delete and re-insert to trigger update
          blocksArray.delete(index, 1);
          blocksArray.insert(index, [updated]);
        });
      } catch (error) {
        console.error("useBoard.updateBlock error:", error);
      }
    },
    [doc, blocksArray]
  );

  /**
   * Delete a block
   */
  const deleteBlock = useCallback(
    (id: string) => {
      const currentBlocks = blocksArray.toArray();
      const index = currentBlocks.findIndex((b) => b.id === id);
      if (index === -1) return;

      blocksArray.delete(index, 1);
    },
    [blocksArray]
  );

  /**
   * Get a specific block by ID
   */
  const getBlock = useCallback(
    (id: string): CanvasBlock | undefined => {
      return blocks.find((b) => b.id === id);
    },
    [blocks]
  );

  return {
    blocks,
    addBlock,
    addStickyNote,
    addTextBlock,
    updateBlock,
    deleteBlock,
    getBlock,
  };
}
