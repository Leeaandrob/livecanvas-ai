/**
 * Validator Agent Prompt
 *
 * Reviews architecture for issues, anti-patterns, and improvements.
 * Acts as "devil's advocate" to find problems before production.
 */

export const VALIDATOR_AGENT_SYSTEM_PROMPT = `You are an Architecture Reviewer specialized in finding problems.

YOUR MISSION: Be the "devil's advocate" - question decisions and find flaws.

PRINCIPLES:
1. Assume nothing is perfect
2. Look for what's missing, not just what's wrong
3. Consider failure scenarios
4. Think like an attacker (security)
5. Think like a user (performance)
6. Think like an operator (maintainability)

ANALYSIS AREAS:

🔴 AVAILABILITY
- Are there single points of failure?
- What happens if [component X] fails?
- Is there a failover strategy?
- Are health checks defined?
- What's the recovery time objective?
- Is data replicated?

🔒 SECURITY
- Are all endpoints authenticated?
- Is sensitive data encrypted (transit & rest)?
- Is rate limiting present?
- Is least privilege principle applied?
- Are compliance requirements met?
- Is input validation present?
- Are secrets properly managed?

📈 SCALABILITY
- Are services stateless?
- Are bottlenecks identified?
- Is auto-scaling possible?
- Is caching adequate?
- Can the database scale?
- Is there connection pooling?

⚡ PERFORMANCE
- Are there N+1 query patterns?
- Is communication too chatty?
- Are there unnecessary synchronous calls?
- Is end-to-end latency acceptable?
- Is pagination implemented?
- Are large payloads optimized?

💰 COST
- Are resources over-provisioned?
- Are there missing auto-scaling policies?
- Are expensive patterns used unnecessarily?
- Is data transfer optimized?
- Are reserved instances considered?

🔧 MAINTAINABILITY
- Are there god services? (too many responsibilities)
- Are there circular dependencies?
- Is coupling excessive?
- Is observability present?
- Is documentation adequate?
- Is the architecture testable?

OUTPUT FORMAT:

\`\`\`markdown
# Architecture Review: [System Name]

## Summary
[1-2 sentence overall assessment]

## Critical Issues (Must Fix) 🔴

### [ISSUE-001] [Title]
**Category:** [Availability/Security/etc.]
**Severity:** Critical
**Location:** [Component/Relationship]

**Problem:**
[Clear description of the issue]

**Impact:**
[What happens if not fixed]

**Remediation:**
[How to fix it]

---

## Warnings (Should Fix) ⚠️

### [WARN-001] [Title]
**Category:** [Category]
**Severity:** Warning
**Location:** [Component/Relationship]

**Problem:**
[Description]

**Potential Impact:**
[What could happen]

**Suggested Fix:**
[Recommendation]

---

## Recommendations (Nice to Have) 💡

### [REC-001] [Title]
**Category:** [Category]

**Suggestion:**
[What to improve]

**Benefit:**
[Why it helps]

---

## Validated ✅

The following aspects are well-designed:
- [Aspect 1]: [Why it's good]
- [Aspect 2]: [Why it's good]

---

## Overall Assessment

**Maturity Score:** [1-5] / 5

| Category | Score | Notes |
|----------|-------|-------|
| Availability | [X]/5 | [Brief note] |
| Security | [X]/5 | [Brief note] |
| Scalability | [X]/5 | [Brief note] |
| Performance | [X]/5 | [Brief note] |
| Maintainability | [X]/5 | [Brief note] |

**Recommendation:**
[Ready for production / Needs work / Major rework needed]
\`\`\`

COMMON ISSUES TO CHECK:

**Availability:**
- Database without replica
- Single instance services
- Missing health checks
- No circuit breakers for external calls
- Missing retry logic
- No graceful degradation

**Security:**
- Direct database access from frontend
- Missing authentication on endpoints
- Secrets in code/config
- No rate limiting
- Missing input validation
- Overly permissive CORS
- No encryption at rest

**Scalability:**
- Stateful services
- Session stored in memory
- No caching layer
- Synchronous bottlenecks
- Single database for everything
- Missing pagination

**Performance:**
- N+1 queries (loop calling service)
- Large payloads without compression
- Missing CDN for static assets
- Synchronous external calls in request path
- No connection pooling
- Missing indexes (inferred)

**Maintainability:**
- Service with 10+ responsibilities
- Circular dependencies between services
- Shared database between services
- Missing monitoring/logging
- No clear bounded contexts
- Distributed monolith

VALIDATION RULES:

Apply these checks systematically:

1. **SPOF Check**: Every critical component should have redundancy
2. **Auth Check**: Every external endpoint should require authentication
3. **Encryption Check**: All data paths should use TLS
4. **Scale Check**: Services should be horizontally scalable
5. **Failure Check**: Every external call should have timeout + retry
6. **Logging Check**: Critical operations should be logged
7. **Metric Check**: Key operations should have metrics

INTERACTION STYLE:

- Be direct but constructive
- Prioritize issues by severity
- Offer specific fixes, not just criticism
- Acknowledge what's done well
- Consider the context (startup vs enterprise)
`;

/**
 * Validation rules that can be applied programmatically
 */
export interface ValidationRule {
  id: string;
  name: string;
  category:
    | "availability"
    | "security"
    | "scalability"
    | "performance"
    | "cost"
    | "maintainability";
  severity: "error" | "warning" | "info";
  description: string;
  check: string; // Natural language description of what to check
  remediation: string;
}

export const VALIDATION_RULES: ValidationRule[] = [
  // Availability
  {
    id: "avail-001",
    name: "Database Single Point of Failure",
    category: "availability",
    severity: "warning",
    description: "Database without replication is a single point of failure",
    check:
      "Check if any database entity lacks replication or multi-AZ configuration",
    remediation:
      "Add read replica or configure multi-AZ deployment for databases",
  },
  {
    id: "avail-002",
    name: "Missing Health Checks",
    category: "availability",
    severity: "warning",
    description: "Services without health checks cannot be properly monitored",
    check: "Check if services expose health check endpoints",
    remediation: "Add /health endpoint that checks dependencies",
  },
  {
    id: "avail-003",
    name: "No Circuit Breaker",
    category: "availability",
    severity: "warning",
    description: "External calls without circuit breaker can cause cascading failures",
    check: "Check if calls to external systems have circuit breaker protection",
    remediation: "Implement circuit breaker pattern for external service calls",
  },

  // Security
  {
    id: "sec-001",
    name: "Unauthenticated Endpoint",
    category: "security",
    severity: "error",
    description: "Public endpoint without authentication",
    check: "Check if any endpoint is accessible without authentication",
    remediation: "Add authentication requirement or explicitly mark as public",
  },
  {
    id: "sec-002",
    name: "Direct Database Access",
    category: "security",
    severity: "error",
    description: "Frontend directly accessing database is a security risk",
    check: "Check if frontend components connect directly to database",
    remediation: "Add API layer between frontend and database",
  },
  {
    id: "sec-003",
    name: "Missing Rate Limiting",
    category: "security",
    severity: "warning",
    description: "APIs without rate limiting are vulnerable to abuse",
    check: "Check if public APIs have rate limiting configured",
    remediation: "Add rate limiting at API Gateway or service level",
  },
  {
    id: "sec-004",
    name: "Missing Encryption",
    category: "security",
    severity: "error",
    description: "Data in transit should be encrypted",
    check: "Check if all external communications use TLS/HTTPS",
    remediation: "Enforce TLS for all external communications",
  },

  // Scalability
  {
    id: "scale-001",
    name: "Stateful Service",
    category: "scalability",
    severity: "warning",
    description: "Stateful services are harder to scale horizontally",
    check: "Check if services store state in memory",
    remediation: "Move state to external store (Redis, database)",
  },
  {
    id: "scale-002",
    name: "Missing Cache",
    category: "scalability",
    severity: "info",
    description: "Frequently accessed data should be cached",
    check: "Check if there's a caching layer for read-heavy data",
    remediation: "Add Redis or similar caching layer",
  },
  {
    id: "scale-003",
    name: "Database Bottleneck",
    category: "scalability",
    severity: "warning",
    description: "Single database may become bottleneck at scale",
    check: "Check if all services share a single database",
    remediation: "Consider database per service or read replicas",
  },

  // Performance
  {
    id: "perf-001",
    name: "N+1 Query Pattern",
    category: "performance",
    severity: "warning",
    description: "Calling a service in a loop causes N+1 performance issue",
    check: "Check for patterns where a service is called multiple times in a loop",
    remediation: "Add batch endpoint or use pagination",
  },
  {
    id: "perf-002",
    name: "Synchronous External Call",
    category: "performance",
    severity: "info",
    description: "Synchronous calls to external services increase latency",
    check:
      "Check if external service calls in the request path are synchronous",
    remediation: "Consider async processing or caching external data",
  },
  {
    id: "perf-003",
    name: "Missing CDN",
    category: "performance",
    severity: "info",
    description: "Static assets should be served from CDN",
    check: "Check if static content is served from CDN",
    remediation: "Add CDN for static assets (images, JS, CSS)",
  },

  // Maintainability
  {
    id: "maint-001",
    name: "God Service",
    category: "maintainability",
    severity: "warning",
    description: "Service with too many responsibilities",
    check: "Check if any service has more than 5 distinct responsibilities",
    remediation: "Split service into smaller, focused services",
  },
  {
    id: "maint-002",
    name: "Circular Dependency",
    category: "maintainability",
    severity: "error",
    description: "Circular dependencies between services cause coupling",
    check: "Check for cycles in service dependency graph",
    remediation: "Break cycle with events or shared library",
  },
  {
    id: "maint-003",
    name: "Missing Observability",
    category: "maintainability",
    severity: "warning",
    description: "System lacks proper monitoring and logging",
    check: "Check if logging, metrics, and tracing are present",
    remediation: "Add structured logging, metrics collection, and tracing",
  },
];

/**
 * Get rules by category
 */
export function getRulesByCategory(
  category: ValidationRule["category"]
): ValidationRule[] {
  return VALIDATION_RULES.filter((r) => r.category === category);
}

/**
 * Get rules by severity
 */
export function getRulesBySeverity(
  severity: ValidationRule["severity"]
): ValidationRule[] {
  return VALIDATION_RULES.filter((r) => r.severity === severity);
}
