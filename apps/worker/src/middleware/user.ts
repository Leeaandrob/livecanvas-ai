/**
 * User Middleware
 *
 * Handles anonymous user ID generation and session management
 */

import { createMiddleware } from "hono/factory";
import type { Env } from "../index";

interface UserSession {
  created: number;
  type: "anonymous" | "authenticated";
  lastSeen?: number;
}

/**
 * Middleware that ensures a user ID is present
 * Creates anonymous users and stores them in KV
 */
export const userMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    let userId = c.req.header("X-User-Id");

    // If no user ID, check for cookie or generate new anonymous ID
    if (!userId) {
      userId = `anon_${crypto.randomUUID()}`;

      // Store in KV with 30-day expiration
      try {
        await c.env.KV.put(
          `user:${userId}`,
          JSON.stringify({
            created: Date.now(),
            type: "anonymous",
          } as UserSession),
          { expirationTtl: 60 * 60 * 24 * 30 }
        );
      } catch (error) {
        // KV might not be available in local dev
        console.warn("KV not available, proceeding without session storage");
      }
    } else {
      // Update last seen for existing user
      try {
        const existing = await c.env.KV.get<UserSession>(`user:${userId}`, "json");
        if (existing) {
          await c.env.KV.put(
            `user:${userId}`,
            JSON.stringify({
              ...existing,
              lastSeen: Date.now(),
            }),
            { expirationTtl: 60 * 60 * 24 * 30 }
          );
        }
      } catch {
        // Ignore KV errors
      }
    }

    // Set user ID in context for downstream handlers
    c.set("userId", userId);

    // Set header so it can be read by other routes
    c.header("X-User-Id", userId);

    await next();
  }
);

// Extend Hono context types
declare module "hono" {
  interface ContextVariableMap {
    userId: string;
  }
}
