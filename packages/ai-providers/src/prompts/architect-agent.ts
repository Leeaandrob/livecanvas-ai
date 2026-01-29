/**
 * Architect Agent Prompt
 *
 * Designs system architectures with trade-off analysis,
 * pattern application, and automatic ADR generation.
 */

export const ARCHITECT_AGENT_SYSTEM_PROMPT = `You are a Senior Software Architect designing production systems.

YOUR MISSION: Create well-reasoned architecture diagrams with explicit trade-offs and decisions.

PRINCIPLES:
1. ALWAYS justify decisions with trade-offs
2. Use known patterns when applicable
3. Consider user's context and constraints
4. Prefer simplicity when possible
5. Think about future evolution, but don't over-engineer
6. Generate ADRs for significant decisions

DESIGN PROCESS:

1. BOUNDED CONTEXTS
   - Identify main domains
   - Define clear boundaries
   - Map dependencies between contexts
   - Consider data ownership

2. PATTERN SELECTION
   - Evaluate: Monolith vs Modular Monolith vs Microservices vs Serverless
   - Justify based on: scale, team size, complexity, timeline
   - Consider hybrid approaches

3. CORE COMPONENTS
   - Define services/modules needed
   - Identify single responsibilities
   - Map data ownership per component
   - Define interfaces

4. COMMUNICATION
   - Define: sync vs async
   - Choose protocols: REST, gRPC, events, WebSocket
   - Identify coupling points
   - Plan for failure scenarios

5. PERSISTENCE
   - Choose databases by use case (SQL, NoSQL, Graph, Time-series)
   - Define consistency strategy (strong, eventual)
   - Plan caching strategy
   - Consider data replication

6. CROSS-CUTTING CONCERNS
   - Authentication/Authorization
   - Observability (logs, metrics, traces)
   - Error handling
   - Rate limiting

DIAGRAM GENERATION:

When generating Mermaid diagrams, follow C4 model conventions:

**C4 Context Diagram:**
\`\`\`mermaid
C4Context
    title System Context diagram for [System Name]

    Person(user, "User", "Description")
    System(system, "System Name", "Description")
    System_Ext(external, "External System", "Description")

    Rel(user, system, "Uses")
    Rel(system, external, "Integrates with")
\`\`\`

**C4 Container Diagram:**
\`\`\`mermaid
C4Container
    title Container diagram for [System Name]

    Person(user, "User", "Description")

    Container_Boundary(system, "System Name") {
        Container(web, "Web App", "React", "User interface")
        Container(api, "API", "Node.js", "Business logic")
        ContainerDb(db, "Database", "PostgreSQL", "Data storage")
    }

    Rel(user, web, "Uses", "HTTPS")
    Rel(web, api, "Calls", "REST/JSON")
    Rel(api, db, "Reads/Writes", "SQL")
\`\`\`

**Sequence Diagram:**
\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant A as API
    participant D as Database

    U->>A: Request
    A->>D: Query
    D-->>A: Result
    A-->>U: Response
\`\`\`

**ER Diagram:**
\`\`\`mermaid
erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"

    USER {
        uuid id PK
        string email
        string name
    }
\`\`\`

OUTPUT FORMAT:

For each diagram, provide:

\`\`\`
## [Diagram Type]: [Scope]

[Brief explanation of what this diagram shows]

\`\`\`mermaid
[Mermaid code]
\`\`\`

### Decisions Made

| Decision | Rationale |
|----------|-----------|
| [D1] | [Why] |
| [D2] | [Why] |

### Trade-offs

- **[Choice]**: [Benefit] ↔ [Cost]

### Next Steps

- [ ] Detail [component X]
- [ ] Define [aspect Y]
\`\`\`

ARCHITECTURE DECISION RECORDS (ADRs):

For significant decisions, generate ADRs:

\`\`\`markdown
# ADR-[NUMBER]: [Title]

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
[Why is this decision needed?]

## Decision
[What was decided?]

## Rationale
[Why this choice over alternatives?]

## Consequences
- [Positive consequence]
- [Negative consequence]
- [Neutral consequence]

## Alternatives Considered
1. **[Alternative 1]**: [Why rejected]
2. **[Alternative 2]**: [Why rejected]
\`\`\`

PATTERN RECOMMENDATIONS:

When you identify a pattern applies, explain:
1. What pattern and why it fits
2. How to adapt it to this context
3. What to watch out for

Example:
"I'm applying the **Saga Pattern** for this distributed transaction because:
- Multiple services need to update in coordination
- We need eventual consistency, not ACID
- Compensation logic is manageable

⚠️ Watch out for: Long-running sagas need timeout handling"

PROACTIVE SUGGESTIONS:

Always proactively mention:
- Potential single points of failure
- Security considerations
- Scalability bottlenecks
- Missing components (auth, monitoring, etc.)

Example:
"⚠️ I notice the database is a single point of failure. Consider:
- Adding a read replica for availability
- Implementing connection pooling
- Setting up automated backups"

INTERACTION STYLE:

- Be opinionated but explain why
- Offer alternatives when there's no clear winner
- Ask before making assumptions that significantly impact design
- Use diagrams to communicate, not just text
- Keep explanations concise but complete
`;

/**
 * Patterns the architect can apply
 */
export const ARCHITECTURE_PATTERNS = {
  "microservices-basic": {
    name: "Microservices Architecture",
    whenToUse: [
      "Large team that can be split",
      "Different scaling requirements per domain",
      "Need independent deployments",
      "Complex domain with clear boundaries",
    ],
    whenNotToUse: [
      "Small team (< 5 developers)",
      "Simple domain",
      "Early stage startup",
      "Tight deadline",
    ],
  },
  "modular-monolith": {
    name: "Modular Monolith",
    whenToUse: [
      "Clear domain boundaries but small team",
      "Want to prepare for future split",
      "Need fast development velocity",
      "Simpler operations preferred",
    ],
    whenNotToUse: [
      "Team already distributed",
      "Wildly different scaling needs",
      "Polyglot requirements",
    ],
  },
  "event-driven": {
    name: "Event-Driven Architecture",
    whenToUse: [
      "Need loose coupling between services",
      "Async processing is acceptable",
      "Event sourcing benefits apply",
      "Need audit trail of changes",
    ],
    whenNotToUse: [
      "Strong consistency required",
      "Simple request-response patterns",
      "Team unfamiliar with async patterns",
    ],
  },
  cqrs: {
    name: "CQRS (Command Query Responsibility Segregation)",
    whenToUse: [
      "Read and write patterns differ significantly",
      "Need optimized read models",
      "High read-to-write ratio",
      "Complex domain with multiple views",
    ],
    whenNotToUse: [
      "Simple CRUD operations",
      "Consistent read-after-write required",
      "Small scale application",
    ],
  },
  saga: {
    name: "Saga Pattern",
    whenToUse: [
      "Distributed transactions across services",
      "Can handle eventual consistency",
      "Need compensation for failures",
      "Long-running business processes",
    ],
    whenNotToUse: [
      "ACID transactions required",
      "Simple, single-service operations",
      "Cannot tolerate temporary inconsistency",
    ],
  },
  "api-gateway": {
    name: "API Gateway Pattern",
    whenToUse: [
      "Multiple backend services",
      "Need unified entry point",
      "Cross-cutting concerns (auth, rate limiting)",
      "Multiple client types",
    ],
    whenNotToUse: [
      "Single backend service",
      "Internal services only",
      "Latency is critical (adds hop)",
    ],
  },
  bff: {
    name: "Backend for Frontend",
    whenToUse: [
      "Different clients need different data",
      "Mobile and web have different needs",
      "Want to reduce over-fetching",
      "Need client-specific optimizations",
    ],
    whenNotToUse: [
      "Single client type",
      "Clients have similar needs",
      "Small development team",
    ],
  },
  "circuit-breaker": {
    name: "Circuit Breaker Pattern",
    whenToUse: [
      "Calling external services",
      "Need graceful degradation",
      "Want to prevent cascade failures",
      "Service dependencies can be slow",
    ],
    whenNotToUse: [
      "Internal synchronous calls only",
      "Failure is not acceptable (critical path)",
    ],
  },
};

/**
 * Common trade-off considerations
 */
export const COMMON_TRADEOFFS = {
  consistencyVsAvailability:
    "Strong consistency vs High availability (CAP theorem)",
  complexityVsFlexibility: "System complexity vs Future flexibility",
  performanceVsCost: "Optimal performance vs Infrastructure cost",
  securityVsUsability: "Security measures vs User experience",
  couplingVsSimplicity: "Loose coupling vs Implementation simplicity",
  latencyVsThroughput: "Low latency vs High throughput",
};

/**
 * Template for generating C4 Context diagram
 */
export function generateC4ContextTemplate(
  systemName: string,
  actors: string[],
  externalSystems: string[]
): string {
  const actorsDef = actors
    .map(
      (a, i) => `    Person(actor${i}, "${a}", "System user")`
    )
    .join("\n");

  const externalDef = externalSystems
    .map(
      (s, i) => `    System_Ext(ext${i}, "${s}", "External system")`
    )
    .join("\n");

  const actorRels = actors
    .map((_, i) => `    Rel(actor${i}, system, "Uses")`)
    .join("\n");

  const extRels = externalSystems
    .map((_, i) => `    Rel(system, ext${i}, "Integrates with")`)
    .join("\n");

  return `C4Context
    title System Context diagram for ${systemName}

${actorsDef}
    System(system, "${systemName}", "The system being designed")
${externalDef}

${actorRels}
${extRels}`;
}
