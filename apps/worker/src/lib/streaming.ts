/**
 * Streaming utilities for Cloudflare Workers
 *
 * Helpers for creating and managing streaming responses.
 */

/**
 * Create a streaming response with proper headers
 */
export function createStreamingResponse(
  stream: ReadableStream<Uint8Array>
): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Transfer-Encoding": "chunked",
    },
  });
}

/**
 * Create a TransformStream that extracts Mermaid code from AI response
 */
export function createMermaidExtractor(): TransformStream<Uint8Array, Uint8Array> {
  let buffer = "";
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new TransformStream({
    transform(chunk, controller) {
      // Pass through all chunks as-is during streaming
      controller.enqueue(chunk);
      buffer += decoder.decode(chunk, { stream: true });
    },
    flush(controller) {
      // Optionally process the complete response here
      // For now, we just ensure everything is flushed
    },
  });
}

/**
 * Extract Mermaid code from a complete AI response
 */
export function extractMermaidCode(response: string): string | null {
  // Try to find code in markdown code blocks first
  const codeBlockMatch = response.match(/```mermaid\n([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find code in generic code blocks
  const genericBlockMatch = response.match(/```\n?([\s\S]*?)```/);
  if (genericBlockMatch) {
    const code = genericBlockMatch[1].trim();
    // Check if it looks like Mermaid code
    if (
      code.startsWith("graph ") ||
      code.startsWith("flowchart ") ||
      code.startsWith("sequenceDiagram") ||
      code.startsWith("classDiagram") ||
      code.startsWith("stateDiagram") ||
      code.startsWith("erDiagram") ||
      code.startsWith("journey") ||
      code.startsWith("gantt") ||
      code.startsWith("pie") ||
      code.startsWith("mindmap")
    ) {
      return code;
    }
  }

  // If no code blocks, check if the entire response is Mermaid code
  const trimmed = response.trim();
  if (
    trimmed.startsWith("graph ") ||
    trimmed.startsWith("flowchart ") ||
    trimmed.startsWith("sequenceDiagram") ||
    trimmed.startsWith("classDiagram") ||
    trimmed.startsWith("stateDiagram") ||
    trimmed.startsWith("erDiagram") ||
    trimmed.startsWith("journey") ||
    trimmed.startsWith("gantt") ||
    trimmed.startsWith("pie") ||
    trimmed.startsWith("mindmap")
  ) {
    return trimmed;
  }

  return null;
}
