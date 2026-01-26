/**
 * useYjs Hook
 *
 * Manages Yjs document and WebSocket provider for real-time collaboration
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { createWebSocketUrl } from "../lib/websocket";

interface UseYjsResult {
  doc: Y.Doc;
  provider: WebsocketProvider | null;
  connected: boolean;
  synced: boolean;
}

export function useYjs(boardId: string): UseYjsResult {
  // Create Y.Doc once per boardId
  const doc = useMemo(() => {
    const ydoc = new Y.Doc();

    // Add error handler for document updates
    ydoc.on("update", (_update: Uint8Array, origin: unknown) => {
      // If origin is the WebSocket provider, validate the update
      if (origin && typeof origin === "object" && "ws" in origin) {
        try {
          // Just accessing the array validates it can be read
          ydoc.getArray("blocks").toArray();
        } catch (err) {
          console.error("Yjs document corruption detected:", err);
        }
      }
    });

    return ydoc;
  }, []);

  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const wsUrl = createWebSocketUrl();

    // Create WebSocket provider
    // y-websocket appends roomName to the URL: wsUrl/boardId
    const wsProvider = new WebsocketProvider(wsUrl, boardId, doc, {
      connect: true,
      // Reconnect automatically
      maxBackoffTime: 5000,
      // Disable broadcast channel to avoid cross-tab sync issues
      disableBc: true,
    });

    // Track connection status
    wsProvider.on("status", ({ status }: { status: string }) => {
      setConnected(status === "connected");
    });

    // Track sync status
    wsProvider.on("sync", (isSynced: boolean) => {
      setSynced(isSynced);
    });

    // Handle connection errors
    wsProvider.on("connection-error", (event: Event) => {
      console.error("WebSocket connection error:", event);
    });

    setProvider(wsProvider);

    // Cleanup on unmount or boardId change
    return () => {
      wsProvider.disconnect();
      wsProvider.destroy();
    };
  }, [boardId, doc]);

  return { doc, provider, connected, synced };
}

/**
 * Hook to access a Yjs array with React integration
 */
export function useYArray<T>(doc: Y.Doc, name: string): T[] {
  const yArray = useMemo(() => doc.getArray<T>(name), [doc, name]);
  const [items, setItems] = useState<T[]>(() => yArray.toArray());

  useEffect(() => {
    const observer = () => {
      setItems(yArray.toArray());
    };

    yArray.observe(observer);
    // Initial sync
    setItems(yArray.toArray());

    return () => {
      yArray.unobserve(observer);
    };
  }, [yArray]);

  return items;
}

/**
 * Hook to access a Yjs map with React integration
 */
export function useYMap<T>(
  doc: Y.Doc,
  name: string
): { data: Map<string, T>; set: (key: string, value: T) => void } {
  const yMap = useMemo(() => doc.getMap<T>(name), [doc, name]);
  const [data, setData] = useState<Map<string, T>>(() => new Map(yMap.entries()));

  useEffect(() => {
    const observer = () => {
      setData(new Map(yMap.entries()));
    };

    yMap.observe(observer);
    setData(new Map(yMap.entries()));

    return () => {
      yMap.unobserve(observer);
    };
  }, [yMap]);

  const set = useCallback(
    (key: string, value: T) => {
      yMap.set(key, value);
    },
    [yMap]
  );

  return { data, set };
}
