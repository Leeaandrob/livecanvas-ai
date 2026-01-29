/**
 * Board Management Routes
 *
 * CRUD operations for boards stored in D1
 */

import { Hono } from "hono";
import type { Env } from "../index";

export const boardsRoute = new Hono<{ Bindings: Env }>();

interface Board {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
  created_by: string | null;
  is_public: number;
  thumbnail_url: string | null;
  block_count: number;
}

// List user's boards
boardsRoute.get("/", async (c) => {
  const userId = c.req.header("X-User-Id") || "anonymous";
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = parseInt(c.req.query("offset") || "0");

  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM boards
      WHERE created_by = ? OR is_public = 1
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `)
      .bind(userId, limit, offset)
      .all<Board>();

    const total = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM boards
      WHERE created_by = ? OR is_public = 1
    `)
      .bind(userId)
      .first<{ count: number }>();

    return c.json({
      boards: result.results,
      total: total?.count || 0,
    });
  } catch (error) {
    console.error("Failed to list boards:", error);
    return c.json({ error: "Failed to list boards" }, 500);
  }
});

// Create new board
boardsRoute.post("/", async (c) => {
  const body = await c.req.json<{ name?: string }>().catch(() => ({ name: undefined }));
  const userId = c.req.header("X-User-Id") || "anonymous";
  const id = crypto.randomUUID();
  const name = body.name || "Untitled Board";

  try {
    await c.env.DB.prepare(`
      INSERT INTO boards (id, name, created_by) VALUES (?, ?, ?)
    `)
      .bind(id, name, userId)
      .run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO board_activity (board_id, user_id, action) VALUES (?, ?, 'created')
    `)
      .bind(id, userId)
      .run();

    return c.json({ id, name }, 201);
  } catch (error) {
    console.error("Failed to create board:", error);
    return c.json({ error: "Failed to create board" }, 500);
  }
});

// Get board by ID
boardsRoute.get("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const board = await c.env.DB.prepare("SELECT * FROM boards WHERE id = ?")
      .bind(id)
      .first<Board>();

    if (!board) {
      return c.json({ error: "Board not found" }, 404);
    }

    return c.json(board);
  } catch (error) {
    console.error("Failed to get board:", error);
    return c.json({ error: "Failed to get board" }, 500);
  }
});

// Update board metadata
boardsRoute.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.req.header("X-User-Id");
  const body = await c.req.json<{ name?: string; is_public?: boolean }>();

  try {
    // Check if board exists and user has permission
    const board = await c.env.DB.prepare(
      "SELECT created_by FROM boards WHERE id = ?"
    )
      .bind(id)
      .first<{ created_by: string }>();

    if (!board) {
      return c.json({ error: "Board not found" }, 404);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (body.name !== undefined) {
      updates.push("name = ?");
      values.push(body.name);
    }

    if (body.is_public !== undefined) {
      updates.push("is_public = ?");
      values.push(body.is_public ? 1 : 0);
    }

    if (updates.length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    updates.push("updated_at = unixepoch()");
    values.push(id);

    await c.env.DB.prepare(
      `UPDATE boards SET ${updates.join(", ")} WHERE id = ?`
    )
      .bind(...values)
      .run();

    // Return updated board
    const updated = await c.env.DB.prepare("SELECT * FROM boards WHERE id = ?")
      .bind(id)
      .first<Board>();

    return c.json(updated);
  } catch (error) {
    console.error("Failed to update board:", error);
    return c.json({ error: "Failed to update board" }, 500);
  }
});

// Delete board
boardsRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.req.header("X-User-Id");

  try {
    // Verify ownership
    const board = await c.env.DB.prepare(
      "SELECT created_by FROM boards WHERE id = ?"
    )
      .bind(id)
      .first<{ created_by: string }>();

    if (!board) {
      return c.json({ error: "Board not found" }, 404);
    }

    if (board.created_by !== userId && board.created_by !== "anonymous") {
      return c.json({ error: "Not authorized" }, 403);
    }

    await c.env.DB.prepare("DELETE FROM boards WHERE id = ?").bind(id).run();

    return c.body(null, 204);
  } catch (error) {
    console.error("Failed to delete board:", error);
    return c.json({ error: "Failed to delete board" }, 500);
  }
});

// Update board block count (called by BoardRoom DO)
boardsRoute.put("/:id/stats", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ block_count: number }>();

  try {
    await c.env.DB.prepare(
      "UPDATE boards SET block_count = ?, updated_at = unixepoch() WHERE id = ?"
    )
      .bind(body.block_count, id)
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to update board stats:", error);
    return c.json({ error: "Failed to update stats" }, 500);
  }
});

// Ensure board exists (create if not) - called when joining a board
boardsRoute.post("/:id/ensure", async (c) => {
  const id = c.req.param("id");
  const userId = c.req.header("X-User-Id") || "anonymous";

  try {
    // Check if board exists
    const existing = await c.env.DB.prepare(
      "SELECT id FROM boards WHERE id = ?"
    )
      .bind(id)
      .first();

    if (existing) {
      return c.json({ exists: true, created: false });
    }

    // Create the board
    await c.env.DB.prepare(`
      INSERT INTO boards (id, name, created_by) VALUES (?, ?, ?)
    `)
      .bind(id, "Untitled Board", userId)
      .run();

    return c.json({ exists: false, created: true }, 201);
  } catch (error) {
    console.error("Failed to ensure board:", error);
    return c.json({ error: "Failed to ensure board" }, 500);
  }
});
