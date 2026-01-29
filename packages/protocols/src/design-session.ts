/**
 * Design Session Types
 *
 * Semantic model for AI-powered system design sessions.
 * Enables the AI to understand, validate, and reason about architecture.
 */

// =============================================================================
// ENTITY TYPES
// =============================================================================

/**
 * Types of entities in a system architecture
 */
export type EntityType =
  | "user" // External actor (human)
  | "system" // External system
  | "service" // Microservice/module
  | "database" // Persistence layer
  | "queue" // Message queue
  | "cache" // Caching layer
  | "gateway" // API Gateway/BFF
  | "function" // Serverless function
  | "storage" // Object storage (S3, etc)
  | "cdn" // Content delivery network
  | "loadbalancer" // Load balancer
  | "container" // Container/pod
  | "webapp" // Web application
  | "mobile"; // Mobile application

/**
 * Types of relationships between entities
 */
export type RelationType =
  | "calls" // Synchronous call
  | "publishes" // Publishes event/message
  | "subscribes" // Subscribes to event/message
  | "queries" // Reads data
  | "commands" // Writes data
  | "authenticates" // Authentication flow
  | "proxies" // Proxies/forwards requests
  | "caches" // Caches data from
  | "replicates"; // Replicates data to

/**
 * C4 Model levels for diagram abstraction
 */
export type C4Level =
  | "context" // System context (level 1)
  | "container" // Containers (level 2)
  | "component" // Components (level 3)
  | "code"; // Code level (level 4)

/**
 * Types of diagrams supported
 */
export type DiagramType =
  | "c4-context"
  | "c4-container"
  | "c4-component"
  | "sequence"
  | "flowchart"
  | "er"
  | "state"
  | "class"
  | "deployment"
  | "data-flow";

/**
 * Design session phases
 */
export type SessionPhase =
  | "discovery" // Understanding requirements
  | "high-level" // C4 Context design
  | "detailed" // C4 Container/Component
  | "validation" // Architecture review
  | "documentation"; // Generating docs

/**
 * Architecture decision status
 */
export type DecisionStatus =
  | "proposed"
  | "accepted"
  | "deprecated"
  | "superseded";

/**
 * Validation rule severity
 */
export type ValidationSeverity = "error" | "warning" | "info";

/**
 * Validation categories
 */
export type ValidationCategory =
  | "availability"
  | "security"
  | "scalability"
  | "performance"
  | "cost"
  | "maintainability";

// =============================================================================
// CORE INTERFACES
// =============================================================================

/**
 * Quality attribute of an entity (NFR)
 */
export interface QualityAttribute {
  name: string;
  value: string | number | boolean;
  description?: string;
}

/**
 * Constraint on an entity or relationship
 */
export interface Constraint {
  type: string;
  description: string;
  enforced: boolean;
}

/**
 * Data flow specification
 */
export interface DataFlowSpec {
  dataType: string;
  direction: "in" | "out" | "bidirectional";
  volume?: string;
  frequency?: string;
  sensitive?: boolean;
}

/**
 * Interface exposed or consumed by an entity
 */
export interface EntityInterface {
  name: string;
  type: "rest" | "graphql" | "grpc" | "websocket" | "event" | "file";
  protocol?: string;
  port?: number;
  path?: string;
  methods?: string[];
}

/**
 * Reference to a dependency
 */
export interface DependencyRef {
  entityId: string;
  type: "required" | "optional";
  reason?: string;
}

/**
 * A semantic entity in the architecture
 */
export interface SemanticEntity {
  id: string;
  name: string;
  type: EntityType;
  description?: string;
  domain?: string; // Bounded context
  responsibilities: string[];
  dataOwnership: string[]; // Data this entity "owns"
  dependencies: DependencyRef[];
  exposedInterfaces: EntityInterface[];
  consumedInterfaces: EntityInterface[];
  qualityAttributes: QualityAttribute[];
  constraints: Constraint[];
  technology?: string;
  metadata: Record<string, unknown>;
}

/**
 * A relationship between two entities
 */
export interface SemanticRelationship {
  id: string;
  from: string; // Entity ID
  to: string; // Entity ID
  type: RelationType;
  label?: string;
  protocol?: string;
  async: boolean;
  dataFlow: DataFlowSpec[];
  constraints: Constraint[];
  metadata: Record<string, unknown>;
}

/**
 * An invariant (rule that must be true)
 */
export interface Invariant {
  id: string;
  description: string;
  scope: string[]; // Entity IDs this applies to
  expression?: string; // Formal expression if available
}

/**
 * A semantic diagram with full understanding
 */
export interface SemanticDiagram {
  id: string;
  name: string;
  type: DiagramType;
  level: C4Level;
  scope: string; // What part of the system this represents
  entities: SemanticEntity[];
  relationships: SemanticRelationship[];
  invariants: Invariant[];
  linkedDiagrams: string[]; // Related diagram IDs
  mermaidCode: string; // The actual Mermaid code
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// ARCHITECTURE DECISIONS
// =============================================================================

/**
 * An alternative considered for a decision
 */
export interface DecisionAlternative {
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  rejected: boolean;
  rejectionReason?: string;
}

/**
 * An Architecture Decision Record (ADR)
 */
export interface ArchitectureDecision {
  id: string;
  title: string;
  status: DecisionStatus;
  context: string;
  decision: string;
  rationale: string;
  consequences: string[];
  alternatives: DecisionAlternative[];
  relatedEntities: string[];
  relatedDecisions: string[];
  createdAt: Date;
  updatedAt: Date;
  decidedBy: string;
  supersededBy?: string;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * A validation issue found in the architecture
 */
export interface ValidationIssue {
  id: string;
  ruleId: string;
  severity: ValidationSeverity;
  category: ValidationCategory;
  message: string;
  entityId?: string;
  relationshipId?: string;
  remediation: string;
  references: string[];
}

/**
 * Result of validation
 */
export interface ValidationResult {
  passed: boolean;
  issues: ValidationIssue[];
  timestamp: Date;
  duration: number;
}

// =============================================================================
// DESIGN SESSION
// =============================================================================

/**
 * A turn in the design conversation
 */
export interface ConversationTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  phase: SessionPhase;
  diagramsCreated?: string[];
  decisionsCreated?: string[];
}

/**
 * Requirements gathered during discovery
 */
export interface Requirements {
  businessGoal: string;
  actors: Array<{ name: string; description: string }>;
  functionalRequirements: Array<{ id: string; description: string }>;
  nonFunctionalRequirements: {
    scale?: string;
    latency?: string;
    availability?: string;
    security?: string[];
    compliance?: string[];
  };
  constraints: Array<{ id: string; description: string }>;
  assumptions: Array<{ id: string; description: string }>;
  outOfScope: Array<{ id: string; description: string }>;
}

/**
 * A complete design session
 */
export interface DesignSession {
  id: string;
  name: string;
  goal: string;
  phase: SessionPhase;
  requirements?: Requirements;
  diagrams: SemanticDiagram[];
  decisions: ArchitectureDecision[];
  entities: Record<string, SemanticEntity>; // Global entity registry
  conversationHistory: ConversationTurn[];
  validationResults: ValidationResult[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// =============================================================================
// PATTERN LIBRARY
// =============================================================================

/**
 * A pattern variable that can be customized
 */
export interface PatternVariable {
  name: string;
  description: string;
  type: "string" | "number" | "boolean" | "select";
  options?: string[];
  default?: string | number | boolean;
  defaultValue?: string | number | boolean; // Alias for default
  required?: boolean;
}

/**
 * Validation specific to a pattern
 */
export interface PatternValidation {
  id?: string;
  rule?: string; // Alias for description
  description?: string;
  check?: string; // Description of what to check
  severity: ValidationSeverity;
}

/**
 * An architecture pattern
 */
export interface ArchitecturePattern {
  id: string;
  name: string;
  category:
    | "architecture"
    | "data"
    | "integration"
    | "resilience"
    | "security"
    | "scalability"
    | "deployment";
  description: string;
  whenToUse: string[];
  whenNotToUse: string[];
  tradeoffs: {
    pros: string[];
    cons: string[];
  };
  relatedPatterns: string[];
  templates: {
    c4Context?: string;
    c4Container?: string;
    c4Component?: string;
    c4Deployment?: string;
    sequence?: string;
    flowchart?: string;
    flowchart2?: string;
    er?: string;
    state?: string;
    stateDiagram?: string;
    class?: string;
  };
  variables: PatternVariable[];
  validations: PatternValidation[];
  examples: Array<{
    name: string;
    description: string;
    mermaidCode?: string;
    code?: string; // For non-mermaid code examples
  }>;
}

// =============================================================================
// INTENT ROUTING
// =============================================================================

/**
 * Types of user intents detected
 */
export type UserIntent =
  | "start_design" // Start a new design session
  | "ask_question" // Clarification question
  | "generate_diagram" // Generate a specific diagram
  | "modify_diagram" // Modify existing diagram
  | "explain" // Explain a concept or decision
  | "validate" // Validate architecture
  | "apply_pattern" // Apply a pattern
  | "export" // Export documentation
  | "navigate" // Navigate between diagrams
  | "unknown"; // Unknown intent

/**
 * Detected intent from user message
 */
export interface DetectedIntent {
  intent: UserIntent;
  confidence: number;
  entities: Record<string, string>; // Extracted entities
  suggestedDiagramType?: DiagramType;
  suggestedPhase?: SessionPhase;
  requiresDiscovery: boolean;
}

// =============================================================================
// HELPER TYPES
// =============================================================================

/**
 * Create a new empty design session
 */
export function createDesignSession(
  name: string,
  goal: string
): DesignSession {
  return {
    id: crypto.randomUUID(),
    name,
    goal,
    phase: "discovery",
    diagrams: [],
    decisions: [],
    entities: {},
    conversationHistory: [],
    validationResults: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Create a new semantic entity
 */
export function createSemanticEntity(
  name: string,
  type: EntityType,
  options?: Partial<SemanticEntity>
): SemanticEntity {
  return {
    id: crypto.randomUUID(),
    name,
    type,
    responsibilities: [],
    dataOwnership: [],
    dependencies: [],
    exposedInterfaces: [],
    consumedInterfaces: [],
    qualityAttributes: [],
    constraints: [],
    metadata: {},
    ...options,
  };
}

/**
 * Create a new architecture decision
 */
export function createArchitectureDecision(
  title: string,
  context: string,
  decision: string,
  rationale: string
): ArchitectureDecision {
  return {
    id: `ADR-${Date.now()}`,
    title,
    status: "proposed",
    context,
    decision,
    rationale,
    consequences: [],
    alternatives: [],
    relatedEntities: [],
    relatedDecisions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    decidedBy: "AI Architect",
  };
}

/**
 * Create a conversation turn
 */
export function createConversationTurn(
  role: "user" | "assistant",
  content: string,
  phase: SessionPhase
): ConversationTurn {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date(),
    phase,
  };
}
