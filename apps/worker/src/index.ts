/**
 * LiveCanvas AI - Cloudflare Worker Entry Point
 *
 * Hono app with routes for real-time collaboration and AI features
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { BoardRoom } from "./durable-objects/BoardRoom";
import { boardRoute } from "./routes/board";
import { boardsRoute } from "./routes/boards";
import { analyzeRoute } from "./routes/analyze";
import { refactorRoute } from "./routes/refactor";
import { generateRoute } from "./routes/generate";
import { modifyRoute } from "./routes/modify";
import { fixSyntaxRoute } from "./routes/fix-syntax";

// Export Durable Object class
export { BoardRoom };

// Environment bindings type
export interface Env {
  BOARD_ROOM: DurableObjectNamespace;
  DB: D1Database;
  KV: KVNamespace;
  ENVIRONMENT: string;
}

// Create Hono app
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow localhost, local network IPs, and production
      if (!origin) return "*";
      if (origin.includes("localhost")) return origin;
      if (origin.includes("127.0.0.1")) return origin;
      if (origin.match(/^https?:\/\/192\.168\./)) return origin;
      if (origin.match(/^https?:\/\/10\./)) return origin;
      if (origin.includes("livecanvas-ai.pages.dev")) return origin;
      if (origin.includes("live-canvas.pages.dev")) return origin;
      if (origin.includes("leandrobarbosa.dev")) return origin;
      // Reject unknown origins
      return null;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-Board-Id", "Upgrade", "Connection"],
    exposeHeaders: ["Content-Length"],
    maxAge: 86400,
    credentials: true,
  })
);

// Health check
app.get("/", (c) => {
  return c.json({
    name: "LiveCanvas AI Worker",
    version: "1.0.0",
    status: "healthy",
  });
});

// WebSocket route for board collaboration
app.route("/board", boardRoute);

// Board management API
app.route("/api/boards", boardsRoute);

// AI API routes
app.route("/api/analyze", analyzeRoute);
app.route("/api/refactor", refactorRoute);
app.route("/api/generate", generateRoute);
app.route("/api/modify", modifyRoute);
app.route("/api/fix-syntax", fixSyntaxRoute);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("Worker error:", err);
  return c.json({ error: err.message || "Internal server error" }, 500);
});

export default app;
