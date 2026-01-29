/**
 * WebSocket Connection Manager
 *
 * Manages WebSocket connection to the BoardRoom Durable Object
 */

export interface WebSocketConfig {
  boardId: string;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (data: ArrayBuffer | string) => void;
}

export function createWebSocketUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  // Use env var if set, otherwise use current host with worker port
  const workerHost = import.meta.env.VITE_WORKER_HOST;
  const host = import.meta.env.MODE === "production"
    ? (workerHost || "live-canvas-worker.videostreaminginc.workers.dev")
    : (workerHost || `${window.location.hostname}:8787`);

  // Return base URL - y-websocket will append the room name
  return `${protocol}//${host}/board`;
}

export function getApiBaseUrl(): string {
  const workerHost = import.meta.env.VITE_WORKER_HOST;

  if (import.meta.env.MODE === "production") {
    return workerHost
      ? `https://${workerHost}`
      : "https://live-canvas-worker.videostreaminginc.workers.dev";
  }

  // In development, use proxy (empty string) or direct URL
  return workerHost ? `http://${workerHost}` : "";
}
