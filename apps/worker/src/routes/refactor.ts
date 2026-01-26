/**
 * Refactor Route
 *
 * POST /api/refactor - Suggest improvements for a Mermaid diagram
 */

import { Hono } from "hono";
import type { Env } from "../index";
import type { AIRequest } from "@live-canvas/protocols";
import { streamAIResponse } from "../lib/ai-client";
import { createStreamingResponse } from "../lib/streaming";
import { REFACTOR_PROMPT, SYSTEM_PROMPT, buildPrompt } from "../lib/prompts";

export const refactorRoute = new Hono<{ Bindings: Env }>();

refactorRoute.post("/", async (c) => {
  try {
    const body = await c.req.json<AIRequest>();
    const { mermaid, provider, apiKey } = body;

    // Validate required fields
    if (!mermaid) {
      return c.json({ error: "Mermaid code is required" }, 400);
    }
    if (!provider) {
      return c.json({ error: "Provider is required" }, 400);
    }
    if (!apiKey) {
      return c.json({ error: "API key is required" }, 400);
    }

    // Set AI cursor to thinking state with a random position
    const boardId = c.req.header("X-Board-Id");
    if (boardId) {
      try {
        const id = c.env.BOARD_ROOM.idFromName(boardId);
        const room = c.env.BOARD_ROOM.get(id);
        // Random position in center area of typical canvas
        const position = {
          x: 200 + Math.random() * 400,
          y: 150 + Math.random() * 200,
        };
        await room.fetch(
          new Request(`https://dummy/rpc/set-ai-cursor`, {
            method: "POST",
            body: JSON.stringify({ state: "thinking", position }),
          })
        );
      } catch (err) {
        console.error("Failed to set AI cursor:", err);
      }
    }

    // Build the prompt
    const prompt = buildPrompt(REFACTOR_PROMPT, { MERMAID: mermaid });

    // Stream the response
    const stream = await streamAIResponse(
      { provider, apiKey },
      prompt,
      SYSTEM_PROMPT
    );

    // Reset AI cursor when response completes
    c.executionCtx.waitUntil(
      (async () => {
        await new Promise((resolve) => setTimeout(resolve, 30000));
        if (boardId) {
          try {
            const id = c.env.BOARD_ROOM.idFromName(boardId);
            const room = c.env.BOARD_ROOM.get(id);
            await room.fetch(
              new Request(`https://dummy/rpc/set-ai-cursor`, {
                method: "POST",
                body: JSON.stringify({ state: "idle" }),
              })
            );
          } catch (err) {
            console.error("Failed to reset AI cursor:", err);
          }
        }
      })()
    );

    return createStreamingResponse(stream);
  } catch (error) {
    console.error("Refactor error:", error);
    return c.json(
      { error: error instanceof Error ? error.message : "Refactor failed" },
      500
    );
  }
});
