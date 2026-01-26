/**
 * useAIAgent Hook
 *
 * Manages AI interactions for the canvas
 */

import { useState, useCallback } from "react";
import { useSettings } from "./useSettings";
import {
  analyzeStream,
  refactorStream,
  generateStream,
  modifyStream,
  fixSyntax as fixSyntaxApi,
} from "../lib/api";

/**
 * Extract clean Mermaid code from response that might contain markdown markers
 */
function extractMermaidCode(text: string): string {
  const mermaidKeywords = "graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph";

  // Try to extract from ```mermaid blocks
  const mermaidMatch = text.match(/```mermaid[\s\n]*([\s\S]*?)```/i);
  if (mermaidMatch) {
    return mermaidMatch[1].trim();
  }

  // Try to extract from generic ``` blocks with mermaid content
  const genericRegex = new RegExp(
    "```[\\s\\n]*((?:" + mermaidKeywords + ")[\\s\\S]*?)```",
    "i"
  );
  const genericMatch = text.match(genericRegex);
  if (genericMatch) {
    return genericMatch[1].trim();
  }

  // Check if the text itself starts with a mermaid keyword (already clean)
  const startsWithKeyword = new RegExp("^\\s*(" + mermaidKeywords + ")", "i");
  if (startsWithKeyword.test(text)) {
    return text.trim();
  }

  // Return as-is if no pattern matched
  return text.trim();
}

interface UseAIAgentResult {
  isLoading: boolean;
  response: string;
  error: string | null;
  analyze: (mermaid: string, boardId?: string) => Promise<void>;
  refactor: (mermaid: string, boardId?: string) => Promise<void>;
  generate: (prompt: string, boardId?: string) => Promise<string | null>;
  modify: (mermaid: string, instructions: string, boardId?: string) => Promise<string | null>;
  fixSyntax: (mermaid: string, boardId?: string) => Promise<string | null>;
  clearResponse: () => void;
}

export function useAIAgent(): UseAIAgentResult {
  const { settings } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);

  const getConfig = useCallback(
    (boardId?: string) => ({
      provider: settings.provider,
      apiKey: settings.apiKey,
      boardId,
    }),
    [settings.provider, settings.apiKey]
  );

  const analyze = useCallback(
    async (mermaid: string, boardId?: string) => {
      if (!settings.apiKey) {
        setError("Please configure your API key in settings");
        return;
      }

      setIsLoading(true);
      setResponse("");
      setError(null);

      try {
        for await (const chunk of analyzeStream(mermaid, getConfig(boardId))) {
          setResponse((prev) => prev + chunk);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
      } finally {
        setIsLoading(false);
      }
    },
    [settings.apiKey, getConfig]
  );

  const refactor = useCallback(
    async (mermaid: string, boardId?: string) => {
      if (!settings.apiKey) {
        setError("Please configure your API key in settings");
        return;
      }

      setIsLoading(true);
      setResponse("");
      setError(null);

      try {
        for await (const chunk of refactorStream(mermaid, getConfig(boardId))) {
          setResponse((prev) => prev + chunk);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Refactor failed");
      } finally {
        setIsLoading(false);
      }
    },
    [settings.apiKey, getConfig]
  );

  const generate = useCallback(
    async (prompt: string, boardId?: string): Promise<string | null> => {
      if (!settings.apiKey) {
        setError("Please configure your API key in settings");
        return null;
      }

      setIsLoading(true);
      // Don't set response for generate - block is created directly
      // This prevents the AIResponse panel from appearing
      setResponse("");
      setError(null);

      let fullResponse = "";

      try {
        for await (const chunk of generateStream(prompt, getConfig(boardId))) {
          fullResponse += chunk;
          // Don't update response during streaming for generate
          // The diagram will be created directly by ChatPanel
        }
        // Extract clean mermaid code (remove markdown markers if present)
        const cleanCode = extractMermaidCode(fullResponse);
        return cleanCode;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Generation failed");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [settings.apiKey, getConfig]
  );

  const modify = useCallback(
    async (mermaid: string, instructions: string, boardId?: string): Promise<string | null> => {
      if (!settings.apiKey) {
        setError("Please configure your API key in settings");
        return null;
      }

      setIsLoading(true);
      setResponse("");
      setError(null);

      let fullResponse = "";

      try {
        for await (const chunk of modifyStream(mermaid, instructions, getConfig(boardId))) {
          fullResponse += chunk;
        }
        // Extract clean mermaid code (remove markdown markers if present)
        const cleanCode = extractMermaidCode(fullResponse);
        return cleanCode;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Modification failed");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [settings.apiKey, getConfig]
  );

  const fixSyntax = useCallback(
    async (mermaid: string, boardId?: string): Promise<string | null> => {
      if (!settings.apiKey) {
        return null;
      }

      try {
        return await fixSyntaxApi(mermaid, getConfig(boardId));
      } catch {
        return null;
      }
    },
    [settings.apiKey, getConfig]
  );

  const clearResponse = useCallback(() => {
    setResponse("");
    setError(null);
  }, []);

  return {
    isLoading,
    response,
    error,
    analyze,
    refactor,
    generate,
    modify,
    fixSyntax,
    clearResponse,
  };
}
