/**
 * Board WebSocket Route
 *
 * Handles WebSocket upgrade requests using y-durableobjects yRoute helper
 */

import { Hono } from "hono";
import { yRoute } from "y-durableobjects";
import type { Env } from "../index";

export const boardRoute = new Hono<{ Bindings: Env }>();

/**
 * WebSocket endpoint for board collaboration using y-durableobjects
 * GET /board/:id - WebSocket upgrade handled by yRoute
 */
boardRoute.route(
  "/",
  yRoute<{ Bindings: Env }>((env) => env.BOARD_ROOM)
);

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
