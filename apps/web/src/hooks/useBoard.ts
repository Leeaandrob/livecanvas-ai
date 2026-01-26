/**
 * useBoard Hook
 *
 * Manages board state (blocks) via Yjs document
 */

import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import * as Y from "yjs";
import { nanoid } from "nanoid";
import type { MermaidBlock, Position, Size } from "@live-canvas/protocols";

interface UseBoardResult {
  blocks: MermaidBlock[];
  addBlock: (
    code?: string,
    position?: Position,
    size?: Size
  ) => MermaidBlock;
  updateBlock: (id: string, updates: Partial<MermaidBlock>) => void;
  deleteBlock: (id: string) => void;
  getBlock: (id: string) => MermaidBlock | undefined;
}

const DEFAULT_CODE = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Do Something]
    B -->|No| D[Do Something Else]
    C --> E[End]
    D --> E`;

const DEFAULT_SIZE: Size = { width: 400, height: 300 };

export function useBoard(doc: Y.Doc): UseBoardResult {
  // Get or create the blocks array in the Y.Doc
  const blocksArray = useMemo(() => doc.getArray<MermaidBlock>("blocks"), [doc]);

  // Cache for snapshot to prevent infinite loops
  const snapshotCache = useRef<MermaidBlock[]>([]);
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

      // Check if content actually changed (including position!)
      const hasChanged =
        snapshotCache.current.length !== newArray.length ||
        !newArray.every((block, i) => {
          const cached = snapshotCache.current[i];
          if (!cached) return false;
          return (
            cached.id === block.id &&
            cached.code === block.code &&
            cached.position.x === block.position.x &&
            cached.position.y === block.position.y &&
            cached.size.width === block.size.width &&
            cached.size.height === block.size.height
          );
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

  // Add a new block
  const addBlock = useCallback(
    (
      code: string = DEFAULT_CODE,
      position?: Position,
      size: Size = DEFAULT_SIZE
    ): MermaidBlock => {
      try {
        // Calculate position if not provided
        const currentBlocks = blocksArray.toArray();
        const pos = position || {
          x: 100 + currentBlocks.length * 50,
          y: 100 + currentBlocks.length * 50,
        };

        const block: MermaidBlock = {
          id: nanoid(10),
          code,
          position: pos,
          size,
          lastValidCode: code,
        };

        blocksArray.push([block]);
        return block;
      } catch (error) {
        console.error("useBoard: Error adding block:", error);
        // Return a block with the data even if push failed
        // This allows the caller to at least have reference to what was attempted
        return {
          id: nanoid(10),
          code,
          position: position || { x: 100, y: 100 },
          size,
          lastValidCode: code,
        };
      }
    },
    [blocksArray]
  );

  // Update an existing block
  const updateBlock = useCallback(
    (id: string, updates: Partial<MermaidBlock>) => {
      try {
        const currentBlocks = blocksArray.toArray();
        const index = currentBlocks.findIndex((b) => b.id === id);

        if (index === -1) {
          return;
        }

        doc.transact(() => {
          const current = blocksArray.get(index);
          const updated = { ...current, ...updates };

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

  // Delete a block
  const deleteBlock = useCallback(
    (id: string) => {
      const currentBlocks = blocksArray.toArray();
      const index = currentBlocks.findIndex((b) => b.id === id);
      if (index === -1) return;

      blocksArray.delete(index, 1);
    },
    [blocksArray]
  );

  // Get a specific block
  const getBlock = useCallback(
    (id: string): MermaidBlock | undefined => {
      return blocks.find((b) => b.id === id);
    },
    [blocks]
  );

  return { blocks, addBlock, updateBlock, deleteBlock, getBlock };
}
