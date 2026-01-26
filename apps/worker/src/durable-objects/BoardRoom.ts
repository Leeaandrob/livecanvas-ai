/**
 * BoardRoom Durable Object
 *
 * Manages real-time collaboration using WebSocket Hibernation API.
 * Handles Yjs document sync and AI cursor state broadcasting.
 */

import type { Position } from "@live-canvas/protocols";
import { DurableObject } from "cloudflare:workers";

interface Env {
  BOARD_ROOM: DurableObjectNamespace;
}

interface AICursorState {
  position: Position | null;
  state: "thinking" | "idle";
}

interface SessionData {
  id: string;
  userId?: string;
}

export class BoardRoom extends DurableObject<Env> {
  private aiCursorState: AICursorState = {
    position: null,
    state: "idle",
  };

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

    // Handle WebSocket upgrade
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Generate session ID
    const sessionId = crypto.randomUUID();
    const sessionData: SessionData = { id: sessionId };

    // Accept WebSocket with hibernation
    this.ctx.acceptWebSocket(server, [sessionId]);

    // Serialize session data for hibernation
    server.serializeAttachment(sessionData);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * Handle incoming WebSocket messages (hibernation-safe)
   */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message === "string") {
      try {
        const parsed = JSON.parse(message);

        // Handle AI cursor updates
        if (parsed.type === "ai-cursor") {
          this.aiCursorState = {
            position: parsed.position,
            state: parsed.state,
          };
          this.broadcastAICursor(ws);
          return;
        }

        // Handle ping
        if (parsed.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
          return;
        }

        // Broadcast other messages to all clients (for Yjs sync)
        this.broadcast(message, ws);
      } catch {
        // Not JSON, treat as binary-like data (Yjs sync)
        this.broadcast(message, ws);
      }
    } else {
      // Binary message (Yjs sync data)
      this.broadcast(message, ws);
    }
  }

  /**
   * Handle WebSocket close
   */
  async webSocketClose(ws: WebSocket): Promise<void> {
    // Get session data
    const sessionData = ws.deserializeAttachment() as SessionData | null;

    // Check if any clients remain
    const clients = this.ctx.getWebSockets();
    if (clients.length === 0) {
      // Schedule cleanup alarm for 1 hour from now
      const alarm = await this.ctx.storage.getAlarm();
      if (!alarm) {
        await this.ctx.storage.setAlarm(Date.now() + 60 * 60 * 1000);
      }
    }
  }

  /**
   * Handle WebSocket error
   */
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error("WebSocket error:", error);
  }

  /**
   * Handle alarm for cleanup
   */
  async alarm(): Promise<void> {
    const clients = this.ctx.getWebSockets();

    // Only log if no active connections
    if (clients.length === 0) {
      console.warn("Board inactive, cleanup skipped for MVP");
    }
  }

  /**
   * Broadcast message to all connected clients except sender
   */
  private broadcast(message: string | ArrayBuffer, sender?: WebSocket): void {
    const clients = this.ctx.getWebSockets();

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
   * Broadcast AI cursor state to all connected clients except sender
   */
  private broadcastAICursor(sender?: WebSocket): void {
    const message = JSON.stringify({
      type: "ai-cursor",
      position: this.aiCursorState.position,
      state: this.aiCursorState.state,
    });

    this.broadcast(message, sender);
  }

  /**
   * Set AI cursor state (called from API routes via RPC)
   */
  setAICursorState(state: "thinking" | "idle", position?: Position): void {
    this.aiCursorState = {
      position: position ?? null,
      state,
    };
    this.broadcastAICursor();
  }

  /**
   * Get current AI cursor state
   */
  getAICursorState(): AICursorState {
    return this.aiCursorState;
  }
}
