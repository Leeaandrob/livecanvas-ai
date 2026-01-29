/**
 * useDesignSession Hook
 *
 * Manages AI-powered design sessions with phase tracking,
 * conversation history, and diagram generation.
 */

import { useState, useCallback, useRef } from "react";
import type {
  DesignSession,
  SessionPhase,
  ConversationTurn,
  SemanticDiagram,
  ArchitectureDecision,
  Requirements,
  DetectedIntent,
  UserIntent,
} from "@live-canvas/protocols";
import {
  createDesignSession,
  createConversationTurn,
  createArchitectureDecision,
} from "@live-canvas/protocols";

interface UseDesignSessionResult {
  // Session state
  session: DesignSession | null;
  isActive: boolean;
  currentPhase: SessionPhase;

  // Session lifecycle
  startSession: (name: string, goal: string) => void;
  endSession: () => void;

  // Phase management
  setPhase: (phase: SessionPhase) => void;
  canTransitionTo: (phase: SessionPhase) => boolean;

  // Conversation
  addMessage: (
    role: "user" | "assistant",
    content: string
  ) => ConversationTurn;
  getHistory: () => ConversationTurn[];

  // Requirements
  setRequirements: (requirements: Requirements) => void;

  // Diagrams
  addDiagram: (diagram: Omit<SemanticDiagram, "id" | "createdAt" | "updatedAt">) => SemanticDiagram;
  updateDiagram: (id: string, updates: Partial<SemanticDiagram>) => void;
  getDiagram: (id: string) => SemanticDiagram | undefined;

  // Decisions
  addDecision: (
    title: string,
    context: string,
    decision: string,
    rationale: string
  ) => ArchitectureDecision;
  acceptDecision: (id: string) => void;

  // Intent routing
  detectIntent: (message: string) => DetectedIntent;
  shouldAskQuestions: (intent: DetectedIntent) => boolean;

  // Export
  exportSession: () => string;
}

// Phase transition rules
const PHASE_TRANSITIONS: Record<SessionPhase, SessionPhase[]> = {
  discovery: ["high-level"],
  "high-level": ["detailed", "validation"],
  detailed: ["validation", "documentation"],
  validation: ["detailed", "documentation"], // Can go back to fix issues
  documentation: [], // Terminal phase
};

// Keywords for intent detection
const INTENT_KEYWORDS: Record<UserIntent, string[]> = {
  start_design: [
    "design",
    "create",
    "build",
    "architect",
    "need a system",
    "new system",
    "start",
  ],
  ask_question: ["?", "what", "how", "why", "when", "where", "which", "can"],
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
  explain: ["explain", "tell me", "what is", "describe"],
  validate: ["validate", "review", "check", "is this good", "any issues"],
  apply_pattern: ["pattern", "apply", "use", "implement"],
  export: ["export", "generate docs", "adr", "documentation", "save"],
  navigate: ["go to", "show me", "open", "switch to"],
  unknown: [],
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
  "secure",
  "compliance",
];

export function useDesignSession(): UseDesignSessionResult {
  const [session, setSession] = useState<DesignSession | null>(null);
  const sessionRef = useRef<DesignSession | null>(null);

  // Keep ref in sync
  sessionRef.current = session;

  /**
   * Start a new design session
   */
  const startSession = useCallback((name: string, goal: string) => {
    const newSession = createDesignSession(name, goal);
    setSession(newSession);
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
      setSession({
        ...session,
        phase,
        updatedAt: new Date(),
      });
    },
    [session]
  );

  /**
   * Check if transition to a phase is allowed
   */
  const canTransitionTo = useCallback(
    (phase: SessionPhase): boolean => {
      if (!session) return false;
      return PHASE_TRANSITIONS[session.phase].includes(phase);
    },
    [session]
  );

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
   * Update an existing diagram
   */
  const updateDiagram = useCallback(
    (id: string, updates: Partial<SemanticDiagram>) => {
      if (!session) return;

      const diagrams = session.diagrams.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: new Date() } : d
      );

      setSession({
        ...session,
        diagrams,
        updatedAt: new Date(),
      });
    },
    [session]
  );

  /**
   * Get a diagram by ID
   */
  const getDiagram = useCallback(
    (id: string): SemanticDiagram | undefined => {
      return session?.diagrams.find((d) => d.id === id);
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
      const adr = createArchitectureDecision(title, context, decision, rationale);

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
   * Accept a proposed decision
   */
  const acceptDecision = useCallback(
    (id: string) => {
      if (!session) return;

      const decisions = session.decisions.map((d) =>
        d.id === id
          ? { ...d, status: "accepted" as const, updatedAt: new Date() }
          : d
      );

      setSession({
        ...session,
        decisions,
        updatedAt: new Date(),
      });
    },
    [session]
  );

  /**
   * Detect user intent from message
   */
  const detectIntent = useCallback((message: string): DetectedIntent => {
    const lowerMessage = message.toLowerCase();
    let detectedIntent: UserIntent = "unknown";
    let maxScore = 0;

    // Score each intent by keyword matches
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      if (intent === "unknown") continue;

      const score = keywords.filter((k) => lowerMessage.includes(k)).length;
      if (score > maxScore) {
        maxScore = score;
        detectedIntent = intent as UserIntent;
      }
    }

    // Check if topic is complex (requires discovery)
    const isComplex = COMPLEX_TOPICS.some((t) => lowerMessage.includes(t));

    // Extract potential entities
    const entities: Record<string, string> = {};

    // Try to extract system name
    const systemMatch = lowerMessage.match(
      /(?:design|create|build|system for)\s+(?:a\s+)?([^,.]+)/i
    );
    if (systemMatch) {
      entities.system_name = systemMatch[1].trim();
    }

    // Detect domain
    if (
      lowerMessage.includes("payment") ||
      lowerMessage.includes("fintech") ||
      lowerMessage.includes("bank")
    ) {
      entities.domain = "fintech";
    } else if (
      lowerMessage.includes("health") ||
      lowerMessage.includes("medical")
    ) {
      entities.domain = "healthcare";
    } else if (
      lowerMessage.includes("shop") ||
      lowerMessage.includes("store") ||
      lowerMessage.includes("commerce")
    ) {
      entities.domain = "ecommerce";
    } else if (
      lowerMessage.includes("marketplace") ||
      lowerMessage.includes("platform")
    ) {
      entities.domain = "marketplace";
    }

    // Suggest diagram type based on context
    let suggestedDiagramType: DetectedIntent["suggestedDiagramType"];
    if (
      lowerMessage.includes("flow") ||
      lowerMessage.includes("process")
    ) {
      suggestedDiagramType = "flowchart";
    } else if (
      lowerMessage.includes("sequence") ||
      lowerMessage.includes("interaction")
    ) {
      suggestedDiagramType = "sequence";
    } else if (
      lowerMessage.includes("data") ||
      lowerMessage.includes("entity") ||
      lowerMessage.includes("database")
    ) {
      suggestedDiagramType = "er";
    } else if (
      lowerMessage.includes("architecture") ||
      lowerMessage.includes("system") ||
      lowerMessage.includes("c4")
    ) {
      suggestedDiagramType = "c4-context";
    }

    return {
      intent: detectedIntent,
      confidence: maxScore > 0 ? Math.min(maxScore / 3, 1) : 0.3,
      entities,
      suggestedDiagramType,
      suggestedPhase:
        detectedIntent === "start_design" || isComplex ? "discovery" : undefined,
      requiresDiscovery: isComplex || detectedIntent === "start_design",
    };
  }, []);

  /**
   * Determine if we should ask questions before generating
   */
  const shouldAskQuestions = useCallback(
    (intent: DetectedIntent): boolean => {
      // Always ask questions for new design sessions
      if (intent.intent === "start_design") return true;

      // Ask questions if topic seems complex
      if (intent.requiresDiscovery) return true;

      // Skip questions if we're already in a session with context
      if (session && session.requirements) return false;

      // Ask questions for low confidence
      if (intent.confidence < 0.5) return true;

      return false;
    },
    [session]
  );

  /**
   * Export session as JSON
   */
  const exportSession = useCallback((): string => {
    if (!session) return "{}";
    return JSON.stringify(session, null, 2);
  }, [session]);

  return {
    session,
    isActive: session !== null && !session.completedAt,
    currentPhase: session?.phase || "discovery",

    startSession,
    endSession,

    setPhase,
    canTransitionTo,

    addMessage,
    getHistory,

    setRequirements,

    addDiagram,
    updateDiagram,
    getDiagram,

    addDecision,
    acceptDecision,

    detectIntent,
    shouldAskQuestions,

    exportSession,
  };
}
