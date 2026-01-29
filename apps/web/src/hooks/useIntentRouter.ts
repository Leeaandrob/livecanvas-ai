/**
 * useIntentRouter Hook
 *
 * Routes user messages to appropriate AI agents based on intent.
 * Manages the flow between Discovery, Architect, and Validator agents.
 */

import { useCallback, useState } from "react";
import type {
  DetectedIntent,
  SessionPhase,
  DiagramType,
} from "@live-canvas/protocols";
import {
  DISCOVERY_AGENT_SYSTEM_PROMPT,
  ARCHITECT_AGENT_SYSTEM_PROMPT,
  VALIDATOR_AGENT_SYSTEM_PROMPT,
  DESIGN_SESSION_SYSTEM_PROMPT,
  getRelevantQuestions,
} from "@live-canvas/ai-providers";
import { useDesignSession } from "./useDesignSession";

type AgentType = "discovery" | "architect" | "validator" | "general";

interface RouterState {
  currentAgent: AgentType;
  pendingQuestions: string[];
  awaitingResponse: boolean;
}

interface UseIntentRouterResult {
  // State
  currentAgent: AgentType;
  isProcessing: boolean;

  // Routing
  routeMessage: (message: string) => Promise<RouterResponse>;
  getSystemPrompt: () => string;

  // Agent control
  switchAgent: (agent: AgentType) => void;

  // Questions
  getPendingQuestions: () => string[];
  clearPendingQuestions: () => void;
}

interface RouterResponse {
  agent: AgentType;
  systemPrompt: string;
  enhancedMessage: string;
  shouldAskQuestions: boolean;
  suggestedQuestions?: string[];
  suggestedPhase?: SessionPhase;
  suggestedDiagramType?: DiagramType;
}

/**
 * Get the appropriate system prompt for an agent
 */
function getAgentSystemPrompt(agent: AgentType): string {
  switch (agent) {
    case "discovery":
      return DISCOVERY_AGENT_SYSTEM_PROMPT;
    case "architect":
      return ARCHITECT_AGENT_SYSTEM_PROMPT;
    case "validator":
      return VALIDATOR_AGENT_SYSTEM_PROMPT;
    default:
      return DESIGN_SESSION_SYSTEM_PROMPT;
  }
}

/**
 * Determine which agent should handle a message based on intent
 */
function selectAgent(intent: DetectedIntent, currentPhase: SessionPhase): AgentType {
  // Explicit validation requests
  if (intent.intent === "validate") {
    return "validator";
  }

  // Design requests go to appropriate agent based on phase
  if (intent.intent === "start_design") {
    return "discovery";
  }

  if (intent.intent === "generate_diagram" || intent.intent === "modify_diagram") {
    return "architect";
  }

  // Phase-based routing
  switch (currentPhase) {
    case "discovery":
      return "discovery";
    case "high-level":
    case "detailed":
      return "architect";
    case "validation":
      return "validator";
    default:
      return "general";
  }
}

/**
 * Enhance user message with context for the AI
 */
function enhanceMessage(
  message: string,
  intent: DetectedIntent,
  phase: SessionPhase
): string {
  const parts: string[] = [];

  // Add phase context
  parts.push(`[Current Phase: ${phase}]`);

  // Add detected intent
  if (intent.intent !== "unknown") {
    parts.push(`[Detected Intent: ${intent.intent}]`);
  }

  // Add entities if detected
  if (Object.keys(intent.entities).length > 0) {
    parts.push(`[Extracted Entities: ${JSON.stringify(intent.entities)}]`);
  }

  // Add suggested diagram type if applicable
  if (intent.suggestedDiagramType) {
    parts.push(`[Suggested Diagram: ${intent.suggestedDiagramType}]`);
  }

  // Add the original message
  parts.push(`\nUser Message: ${message}`);

  return parts.join("\n");
}

export function useIntentRouter(): UseIntentRouterResult {
  const { detectIntent, shouldAskQuestions, currentPhase, session } =
    useDesignSession();

  const [state, setState] = useState<RouterState>({
    currentAgent: "general",
    pendingQuestions: [],
    awaitingResponse: false,
  });

  /**
   * Route a message to the appropriate agent
   */
  const routeMessage = useCallback(
    async (message: string): Promise<RouterResponse> => {
      setState((s) => ({ ...s, awaitingResponse: true }));

      try {
        // Detect intent from the message
        const intent = detectIntent(message);

        // Determine which agent should handle this
        const agent = selectAgent(intent, currentPhase);

        // Check if we need to ask questions first
        const needsQuestions = shouldAskQuestions(intent);

        // Get relevant questions if in discovery mode
        let suggestedQuestions: string[] | undefined;
        if (needsQuestions && agent === "discovery") {
          const relevantCategories = getRelevantQuestions(message);
          suggestedQuestions = relevantCategories.flatMap((c: { category: string; questions: string[] }) => c.questions);
        }

        // Enhance the message with context
        const enhancedMessage = enhanceMessage(message, intent, currentPhase);

        // Get the system prompt for the agent
        const systemPrompt = getAgentSystemPrompt(agent);

        // Update state
        setState((s) => ({
          ...s,
          currentAgent: agent,
          pendingQuestions: suggestedQuestions || [],
          awaitingResponse: false,
        }));

        return {
          agent,
          systemPrompt,
          enhancedMessage,
          shouldAskQuestions: needsQuestions,
          suggestedQuestions,
          suggestedPhase: intent.suggestedPhase,
          suggestedDiagramType: intent.suggestedDiagramType,
        };
      } catch (error) {
        setState((s) => ({ ...s, awaitingResponse: false }));
        throw error;
      }
    },
    [detectIntent, shouldAskQuestions, currentPhase]
  );

  /**
   * Get the current system prompt
   */
  const getSystemPrompt = useCallback((): string => {
    return getAgentSystemPrompt(state.currentAgent);
  }, [state.currentAgent]);

  /**
   * Manually switch to a different agent
   */
  const switchAgent = useCallback((agent: AgentType) => {
    setState((s) => ({ ...s, currentAgent: agent }));
  }, []);

  /**
   * Get pending questions from discovery
   */
  const getPendingQuestions = useCallback((): string[] => {
    return state.pendingQuestions;
  }, [state.pendingQuestions]);

  /**
   * Clear pending questions
   */
  const clearPendingQuestions = useCallback(() => {
    setState((s) => ({ ...s, pendingQuestions: [] }));
  }, []);

  return {
    currentAgent: state.currentAgent,
    isProcessing: state.awaitingResponse,

    routeMessage,
    getSystemPrompt,

    switchAgent,

    getPendingQuestions,
    clearPendingQuestions,
  };
}

/**
 * Exported agent types for use in other components
 */
export type { AgentType, RouterResponse };
