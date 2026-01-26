/**
 * Board WebSocket Route
 *
 * Handles WebSocket upgrade requests and forwards to BoardRoom Durable Object
 */

import { Hono } from "hono";
import type { Env } from "../index";

export const boardRoute = new Hono<{ Bindings: Env }>();

/**
 * WebSocket upgrade endpoint for board collaboration
 * GET /board/:id
 */
boardRoute.get("/:id", async (c) => {
  const boardId = c.req.param("id");

  if (!boardId) {
    return c.json({ error: "Board ID is required" }, 400);
  }

  // Get the Durable Object instance for this board
  const id = c.env.BOARD_ROOM.idFromName(boardId);
  const room = c.env.BOARD_ROOM.get(id);

  // Forward the request to the Durable Object
  // It will handle the WebSocket upgrade
  return room.fetch(c.req.raw);
});

/**
 * Get board info (non-WebSocket)
 * GET /board/:id/info
 */
boardRoute.get("/:id/info", async (c) => {
  const boardId = c.req.param("id");

  return c.json({
    boardId,
    status: "active",
    timestamp: Date.now(),
  });
});
