/**
 * Fix Syntax Route
 *
 * POST /api/fix-syntax - Automatically fix invalid Mermaid syntax
 */

import { Hono } from "hono";
import type { Env } from "../index";
import type { AIRequest } from "@live-canvas/protocols";
import { createProvider } from "@live-canvas/ai-providers";
import { FIX_SYNTAX_PROMPT, buildPrompt } from "../lib/prompts";
import { extractMermaidCode } from "../lib/streaming";

export const fixSyntaxRoute = new Hono<{ Bindings: Env }>();

fixSyntaxRoute.post("/", async (c) => {
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
    const prompt = buildPrompt(FIX_SYNTAX_PROMPT, { MERMAID: mermaid });

    // Use complete (non-streaming) for fix-syntax since we need the full response
    const aiProvider = createProvider(provider, apiKey);
    const response = await aiProvider.complete(prompt);

    // Reset AI cursor
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

    // Extract the corrected Mermaid code
    const fixedCode = extractMermaidCode(response) || response.trim();

    return c.json({
      success: true,
      mermaid: fixedCode,
      original: mermaid,
    });
  } catch (error) {
    console.error("Fix syntax error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Fix syntax failed",
      },
      500
    );
  }
});
