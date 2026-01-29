/**
 * BoardRoom Durable Object
 *
 * Manages real-time collaboration using y-durableobjects for Yjs persistence.
 * Handles Yjs document sync with automatic persistence and AI cursor state broadcasting.
 */

import type { Position } from "@live-canvas/protocols";
import { YDurableObjects } from "y-durableobjects";
import type { Env } from "hono";

interface WorkerEnv extends Env {
  Bindings: {
    BOARD_ROOM: DurableObjectNamespace;
    DB?: D1Database;
    KV?: KVNamespace;
  };
}

interface AICursorState {
  position: Position | null;
  state: "thinking" | "idle";
}

export class BoardRoom extends YDurableObjects<WorkerEnv> {
  private aiCursorState: AICursorState = {
    position: null,
    state: "idle",
  };

  /**
   * Called when the Durable Object is instantiated
   */
  protected async onStart(): Promise<void> {
    await super.onStart();
    // Additional initialization if needed
  }

  /**
   * Handle HTTP requests (WebSocket upgrade and RPC)
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle RPC calls for AI cursor state
    if (url.pathname.endsWith("/rpc/set-ai-cursor") && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          state: "thinking" | "idle";
          position?: Position;
        };
        this.setAICursorState(body.state, body.position);
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ error: "Invalid request" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Handle RPC to get Yjs document state
    if (url.pathname.endsWith("/rpc/get-doc") && request.method === "GET") {
      try {
        const docState = await this.getYDoc();
        return new Response(docState, {
          headers: { "Content-Type": "application/octet-stream" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Failed to get document" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Let parent class handle WebSocket upgrade for Yjs sync
    return super.fetch(request);
  }

  /**
   * Handle incoming WebSocket messages
   * Extends parent to add AI cursor and voice activity support
   */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    // Handle custom JSON messages first
    if (typeof message === "string") {
      try {
        const parsed = JSON.parse(message);

        // Handle AI cursor updates
        if (parsed.type === "ai-cursor") {
          this.aiCursorState = {
            position: parsed.position,
            state: parsed.state,
          };
          this.broadcastToOthers(ws, JSON.stringify({
            type: "ai-cursor",
            position: this.aiCursorState.position,
            state: this.aiCursorState.state,
          }));
          return;
        }

        // Handle AI voice activity
        if (parsed.type === "ai-voice-activity") {
          this.broadcastToOthers(ws, message);
          return;
        }

        // Handle ping
        if (parsed.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
          return;
        }
      } catch {
        // Not JSON, let parent handle as Yjs sync data
      }
    }

    // Let parent handle Yjs sync (binary messages and awareness)
    await super.webSocketMessage(ws, message);
  }

  /**
   * Handle WebSocket close
   */
  async webSocketClose(ws: WebSocket): Promise<void> {
    await super.webSocketClose(ws);

    // Schedule cleanup alarm if no clients remain
    const clients = this.state.getWebSockets();
    if (clients.length === 0) {
      const alarm = await this.state.storage.getAlarm();
      if (!alarm) {
        // Cleanup after 24 hours of inactivity
        await this.state.storage.setAlarm(Date.now() + 24 * 60 * 60 * 1000);
      }
    }
  }

  /**
   * Handle WebSocket error
   */
  async webSocketError(ws: WebSocket): Promise<void> {
    await super.webSocketError(ws);
    console.error("WebSocket error in BoardRoom");
  }

  /**
   * Handle alarm for cleanup
   */
  async alarm(): Promise<void> {
    const clients = this.state.getWebSockets();

    if (clients.length === 0) {
      // No active connections - could clean up old data here
      console.log("Board inactive for 24h, data preserved in storage");
    }
  }

  /**
   * Broadcast message to all connected clients except sender
   */
  private broadcastToOthers(sender: WebSocket, message: string | ArrayBuffer): void {
    const clients = this.state.getWebSockets();

    for (const client of clients) {
      if (client !== sender && client.readyState === WebSocket.READY_STATE_OPEN) {
        try {
          client.send(message);
        } catch (err) {
          console.error("Failed to broadcast message:", err);
        }
      }
    }
  }

  /**
   * Broadcast to all connected clients
   */
  private broadcastToAll(message: string | ArrayBuffer): void {
    const clients = this.state.getWebSockets();

    for (const client of clients) {
      if (client.readyState === WebSocket.READY_STATE_OPEN) {
        try {
          client.send(message);
        } catch (err) {
          console.error("Failed to broadcast message:", err);
        }
      }
    }
  }

  /**
   * Set AI cursor state (called from API routes via RPC)
   */
  setAICursorState(state: "thinking" | "idle", position?: Position): void {
    this.aiCursorState = {
      position: position ?? null,
      state,
    };
    this.broadcastToAll(JSON.stringify({
      type: "ai-cursor",
      position: this.aiCursorState.position,
      state: this.aiCursorState.state,
    }));
  }

  /**
   * Get current AI cursor state
   */
  getAICursorState(): AICursorState {
    return this.aiCursorState;
  }
}
