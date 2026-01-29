/**
 * DesignSessionContext
 *
 * React context for sharing design session state across components.
 * Provides access to session management, intent routing, and conversation history.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import type {
  DesignSession,
  SessionPhase,
  ConversationTurn,
  SemanticDiagram,
  ArchitectureDecision,
  Requirements,
  DetectedIntent,
} from "@live-canvas/protocols";
import {
  createDesignSession,
  createConversationTurn,
  createArchitectureDecision,
} from "@live-canvas/protocols";
import {
  DISCOVERY_AGENT_SYSTEM_PROMPT,
  ARCHITECT_AGENT_SYSTEM_PROMPT,
  VALIDATOR_AGENT_SYSTEM_PROMPT,
  DESIGN_SESSION_SYSTEM_PROMPT,
  getRelevantQuestions,
} from "@live-canvas/ai-providers";

type AgentType = "discovery" | "architect" | "validator" | "general";

interface DesignSessionContextValue {
  // Session state
  session: DesignSession | null;
  isActive: boolean;
  currentPhase: SessionPhase;
  currentAgent: AgentType;

  // Session lifecycle
  startSession: (name: string, goal: string) => void;
  endSession: () => void;

  // Phase management
  setPhase: (phase: SessionPhase) => void;

  // Agent management
  switchAgent: (agent: AgentType) => void;
  getSystemPrompt: () => string;

  // Conversation
  addMessage: (role: "user" | "assistant", content: string) => ConversationTurn;
  getHistory: () => ConversationTurn[];

  // Requirements
  setRequirements: (requirements: Requirements) => void;

  // Diagrams
  addDiagram: (
    diagram: Omit<SemanticDiagram, "id" | "createdAt" | "updatedAt">
  ) => SemanticDiagram;

  // Decisions
  addDecision: (
    title: string,
    context: string,
    decision: string,
    rationale: string
  ) => ArchitectureDecision;

  // Intent detection
  detectIntent: (message: string) => DetectedIntent;
  getQuestionsForTopic: (topic: string) => string[];
}

const DesignSessionContext = createContext<DesignSessionContextValue | null>(
  null
);

// Keywords for intent detection
const INTENT_KEYWORDS: Record<string, string[]> = {
  start_design: [
    "design",
    "create",
    "build",
    "architect",
    "need a system",
    "new system",
  ],
  generate_diagram: [
    "draw",
    "diagram",
    "flowchart",
    "sequence",
    "er",
    "show",
    "visualize",
    "c4",
  ],
  modify_diagram: ["change", "modify", "add", "remove", "update", "edit"],
  validate: ["validate", "review", "check", "is this good", "any issues"],
  explain: ["explain", "tell me", "what is", "describe", "why"],
};

// Complex topics that require discovery
const COMPLEX_TOPICS = [
  "payment",
  "authentication",
  "e-commerce",
  "marketplace",
  "real-time",
  "microservices",
  "distributed",
  "scalable",
];

interface DesignSessionProviderProps {
  children: ReactNode;
}

export function DesignSessionProvider({
  children,
}: DesignSessionProviderProps) {
  const [session, setSession] = useState<DesignSession | null>(null);
  const [currentAgent, setCurrentAgent] = useState<AgentType>("general");

  /**
   * Start a new design session
   */
  const startSession = useCallback((name: string, goal: string) => {
    const newSession = createDesignSession(name, goal);
    setSession(newSession);
    setCurrentAgent("discovery");
  }, []);

  /**
   * End the current session
   */
  const endSession = useCallback(() => {
    if (session) {
      setSession({
        ...session,
        completedAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }, [session]);

  /**
   * Set the current phase
   */
  const setPhase = useCallback(
    (phase: SessionPhase) => {
      if (!session) return;

      // Update agent based on phase
      let agent: AgentType = "general";
      switch (phase) {
        case "discovery":
          agent = "discovery";
          break;
        case "high-level":
        case "detailed":
          agent = "architect";
          break;
        case "validation":
          agent = "validator";
          break;
      }

      setCurrentAgent(agent);
      setSession({
        ...session,
        phase,
        updatedAt: new Date(),
      });
    },
    [session]
  );

  /**
   * Switch to a different agent
   */
  const switchAgent = useCallback((agent: AgentType) => {
    setCurrentAgent(agent);
  }, []);

  /**
   * Get the system prompt for the current agent
   */
  const getSystemPrompt = useCallback((): string => {
    switch (currentAgent) {
      case "discovery":
        return DISCOVERY_AGENT_SYSTEM_PROMPT;
      case "architect":
        return ARCHITECT_AGENT_SYSTEM_PROMPT;
      case "validator":
        return VALIDATOR_AGENT_SYSTEM_PROMPT;
      default:
        return DESIGN_SESSION_SYSTEM_PROMPT;
    }
  }, [currentAgent]);

  /**
   * Add a message to conversation history
   */
  const addMessage = useCallback(
    (role: "user" | "assistant", content: string): ConversationTurn => {
      const turn = createConversationTurn(
        role,
        content,
        session?.phase || "discovery"
      );

      if (session) {
        setSession({
          ...session,
          conversationHistory: [...session.conversationHistory, turn],
          updatedAt: new Date(),
        });
      }

      return turn;
    },
    [session]
  );

  /**
   * Get conversation history
   */
  const getHistory = useCallback((): ConversationTurn[] => {
    return session?.conversationHistory || [];
  }, [session]);

  /**
   * Set requirements from discovery phase
   */
  const setRequirements = useCallback(
    (requirements: Requirements) => {
      if (!session) return;
      setSession({
        ...session,
        requirements,
        updatedAt: new Date(),
      });
    },
    [session]
  );

  /**
   * Add a diagram to the session
   */
  const addDiagram = useCallback(
    (
      diagram: Omit<SemanticDiagram, "id" | "createdAt" | "updatedAt">
    ): SemanticDiagram => {
      const newDiagram: SemanticDiagram = {
        ...diagram,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (session) {
        setSession({
          ...session,
          diagrams: [...session.diagrams, newDiagram],
          updatedAt: new Date(),
        });
      }

      return newDiagram;
    },
    [session]
  );

  /**
   * Add an architecture decision
   */
  const addDecision = useCallback(
    (
      title: string,
      context: string,
      decision: string,
      rationale: string
    ): ArchitectureDecision => {
      const adr = createArchitectureDecision(
        title,
        context,
        decision,
        rationale
      );

      if (session) {
        setSession({
          ...session,
          decisions: [...session.decisions, adr],
          updatedAt: new Date(),
        });
      }

      return adr;
    },
    [session]
  );

  /**
   * Detect user intent from message
   */
  const detectIntent = useCallback((message: string): DetectedIntent => {
    const lowerMessage = message.toLowerCase();
    let detectedIntent: DetectedIntent["intent"] = "unknown";
    let maxScore = 0;

    // Score each intent by keyword matches
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      const score = keywords.filter((k) => lowerMessage.includes(k)).length;
      if (score > maxScore) {
        maxScore = score;
        detectedIntent = intent as DetectedIntent["intent"];
      }
    }

    // Check if topic is complex
    const isComplex = COMPLEX_TOPICS.some((t) => lowerMessage.includes(t));

    // Extract entities
    const entities: Record<string, string> = {};

    // Try to extract system name
    const systemMatch = lowerMessage.match(
      /(?:design|create|build|system for)\s+(?:a\s+)?([^,.]+)/i
    );
    if (systemMatch) {
      entities.system_name = systemMatch[1].trim();
    }

    return {
      intent: detectedIntent,
      confidence: maxScore > 0 ? Math.min(maxScore / 3, 1) : 0.3,
      entities,
      requiresDiscovery: isComplex || detectedIntent === "start_design",
    };
  }, []);

  /**
   * Get relevant questions for a topic
   */
  const getQuestionsForTopic = useCallback((topic: string): string[] => {
    const categories = getRelevantQuestions(topic);
    return categories.flatMap(
      (c: { category: string; questions: string[] }) => c.questions
    );
  }, []);

  const value = useMemo<DesignSessionContextValue>(
    () => ({
      session,
      isActive: session !== null && !session.completedAt,
      currentPhase: session?.phase || "discovery",
      currentAgent,

      startSession,
      endSession,

      setPhase,

      switchAgent,
      getSystemPrompt,

      addMessage,
      getHistory,

      setRequirements,

      addDiagram,

      addDecision,

      detectIntent,
      getQuestionsForTopic,
    }),
    [
      session,
      currentAgent,
      startSession,
      endSession,
      setPhase,
      switchAgent,
      getSystemPrompt,
      addMessage,
      getHistory,
      setRequirements,
      addDiagram,
      addDecision,
      detectIntent,
      getQuestionsForTopic,
    ]
  );

  return (
    <DesignSessionContext.Provider value={value}>
      {children}
    </DesignSessionContext.Provider>
  );
}

/**
 * Hook to access the design session context
 */
export function useDesignSessionContext(): DesignSessionContextValue {
  const context = useContext(DesignSessionContext);
  if (!context) {
    throw new Error(
      "useDesignSessionContext must be used within a DesignSessionProvider"
    );
  }
  return context;
}

export type { AgentType };
