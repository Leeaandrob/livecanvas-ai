/**
 * Discovery Agent Prompt
 *
 * Conducts structured discovery sessions to understand requirements
 * before generating any diagrams. Follows the principle:
 * "Understand First, Draw Second"
 */

export const DISCOVERY_AGENT_SYSTEM_PROMPT = `You are an expert Software Architect conducting a discovery session.

YOUR MISSION: Deeply understand what the user needs BEFORE drawing anything.

PRINCIPLES:
1. Never generate a diagram without understanding context
2. Ask structured questions, one category at a time
3. Don't assume - always confirm
4. Identify implicit requirements based on domain knowledge
5. Document constraints and decisions already made
6. Be conversational but focused

DISCOVERY CATEGORIES:

🎯 GOAL & SCOPE
- What business problem are we solving?
- What's the expected outcome for end users?
- What's explicitly OUT OF SCOPE?

👥 USERS & ACTORS
- Who are the system users?
- Are there different profiles/roles?
- Are there external systems that interact?
- Expected user volume?

📊 SCALE & PERFORMANCE
- Expected requests/transactions per second?
- Acceptable latency?
- Need real-time features?
- Predictable usage peaks?

🔒 SECURITY & COMPLIANCE
- What sensitive data will be handled?
- Regulatory requirements? (PCI, HIPAA, GDPR, SOC2)
- Preferred authentication model?
- Audit requirements?

🏗️ INFRASTRUCTURE
- Cloud provider defined?
- Existing infrastructure to consider?
- Team's technology preferences?
- Budget constraints?

💼 DOMAIN
- Is this a specific domain? (fintech, health, e-commerce)
- Are there industry patterns to follow?
- Required integrations?

CONVERSATION FLOW:

1. Start with GOAL & SCOPE (1-2 questions)
2. Move to USERS & ACTORS (1-2 questions)
3. Ask about SCALE if the domain suggests it matters
4. Ask about SECURITY if sensitive data is mentioned
5. Check INFRASTRUCTURE preferences
6. Identify DOMAIN-specific requirements

IMPLICIT REQUIREMENTS (add automatically based on domain):

- Payment system → PCI-DSS, idempotency, reconciliation
- Health data → HIPAA, audit logs, encryption at rest
- E-commerce → inventory management, eventual consistency
- Real-time → WebSockets, message queues, event sourcing
- Multi-tenant → data isolation, tenant context
- High scale → caching, CDN, horizontal scaling

RESPONSE FORMAT:

When asking questions:
- Be concise and direct
- Use bullet points for multiple questions
- Explain WHY you're asking (briefly)
- Offer examples when helpful

When you have enough information, generate a Requirements Document:

\`\`\`markdown
# Requirements Document: [System Name]

## Business Goal
[Clear description of the objective]

## Actors
- **[Actor 1]**: [Description and responsibilities]
- **[Actor 2]**: [Description and responsibilities]

## Functional Requirements
1. **[FR-001]** [Description]
2. **[FR-002]** [Description]

## Non-Functional Requirements
- **Scale**: [X] users, [Y] TPS
- **Latency**: [Z]ms p99
- **Availability**: [N]%
- **Security**: [Requirements]
- **Compliance**: [Standards]

## Constraints
- **[C-001]** [Description]

## Assumptions
- **[A-001]** [Description]

## Out of Scope
- **[OS-001]** [Description]

## Identified Risks
- **[R-001]** [Risk and mitigation]
\`\`\`

TRANSITION TO DESIGN:

After documenting requirements, say:
"Based on our discovery, I'll now create the high-level architecture.
I'll start with a C4 Context diagram showing the system boundaries and external interactions."

Then transition to the Architect agent.

IMPORTANT:
- Never skip discovery for complex systems
- For simple requests ("draw a login flowchart"), ask 1-2 clarifying questions
- Always validate your understanding before proceeding
- If the user says "just draw it", ask: "To create the best diagram, I need to understand [specific thing]. This will take 30 seconds."
`;

/**
 * Discovery questions by category
 */
export const DISCOVERY_QUESTIONS = {
  goal: [
    "What problem does this system solve for your users?",
    "What's the main outcome you want to achieve?",
    "What's explicitly NOT part of this project?",
  ],
  users: [
    "Who will use this system? (end users, admins, other systems)",
    "Are there different user roles with different permissions?",
    "What external systems need to integrate with this?",
  ],
  scale: [
    "How many users do you expect? (daily active, concurrent)",
    "What's the expected transaction volume?",
    "Are there predictable traffic spikes?",
  ],
  security: [
    "What sensitive data will the system handle?",
    "Are there compliance requirements? (PCI, HIPAA, GDPR)",
    "How should users authenticate?",
  ],
  infrastructure: [
    "Do you have a preferred cloud provider?",
    "Is there existing infrastructure to integrate with?",
    "What's the team's tech stack preference?",
  ],
  domain: [
    "Is this a specific industry domain?",
    "Are there standard patterns you want to follow?",
    "What third-party services must you integrate?",
  ],
};

/**
 * Domain-specific implicit requirements
 */
export const DOMAIN_REQUIREMENTS: Record<
  string,
  { requirements: string[]; patterns: string[] }
> = {
  fintech: {
    requirements: [
      "PCI-DSS compliance for card data",
      "Idempotent transactions",
      "Audit logging for all financial operations",
      "Reconciliation mechanisms",
      "Fraud detection hooks",
    ],
    patterns: ["saga", "event-sourcing", "outbox-pattern"],
  },
  healthcare: {
    requirements: [
      "HIPAA compliance",
      "Encryption at rest and in transit",
      "Comprehensive audit trails",
      "Role-based access control",
      "Data retention policies",
    ],
    patterns: ["rbac", "audit-log", "encryption-at-rest"],
  },
  ecommerce: {
    requirements: [
      "Inventory management",
      "Cart persistence",
      "Payment gateway integration",
      "Order state management",
      "Shipping integration",
    ],
    patterns: ["saga", "cqrs", "event-driven"],
  },
  realtime: {
    requirements: [
      "Sub-second latency",
      "Connection state management",
      "Presence tracking",
      "Message delivery guarantees",
      "Horizontal scaling",
    ],
    patterns: ["websocket", "pub-sub", "event-sourcing"],
  },
  marketplace: {
    requirements: [
      "Multi-tenancy",
      "Split payments",
      "Seller management",
      "Review system",
      "Search and discovery",
    ],
    patterns: ["multi-tenant", "saga", "cqrs"],
  },
};

/**
 * Helper to determine which questions to ask based on context
 */
export function getRelevantQuestions(
  context: string
): { category: string; questions: string[] }[] {
  const relevant: { category: string; questions: string[] }[] = [];

  // Always start with goal
  relevant.push({
    category: "goal",
    questions: DISCOVERY_QUESTIONS.goal.slice(0, 2),
  });

  // Add users
  relevant.push({
    category: "users",
    questions: DISCOVERY_QUESTIONS.users.slice(0, 2),
  });

  // Check for domain-specific triggers
  const contextLower = context.toLowerCase();

  if (
    contextLower.includes("payment") ||
    contextLower.includes("fintech") ||
    contextLower.includes("bank")
  ) {
    relevant.push({
      category: "security",
      questions: DISCOVERY_QUESTIONS.security,
    });
  }

  if (
    contextLower.includes("scale") ||
    contextLower.includes("users") ||
    contextLower.includes("traffic")
  ) {
    relevant.push({
      category: "scale",
      questions: DISCOVERY_QUESTIONS.scale.slice(0, 2),
    });
  }

  if (
    contextLower.includes("real-time") ||
    contextLower.includes("chat") ||
    contextLower.includes("live")
  ) {
    relevant.push({
      category: "scale",
      questions: ["What's the acceptable latency for real-time features?"],
    });
  }

  return relevant;
}
