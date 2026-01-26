# Architecture Decision Record Template

## Overview

Architecture Decision Records (ADRs) capture important architectural decisions made along with their context and consequences. This template follows the MADR (Markdown Any Decision Records) format.

## Template

```markdown
# ADR-[NUMBER]: [TITLE]

## Status

[Proposed | Accepted | Deprecated | Superseded by ADR-XXX]

## Date

[YYYY-MM-DD]

## Context

### Problem Statement

[Describe the problem or question that requires a decision. What is the issue that we're seeing that motivates this decision?]

### Decision Drivers

- [Driver 1: e.g., performance requirements]
- [Driver 2: e.g., team expertise]
- [Driver 3: e.g., time constraints]
- [Driver 4: e.g., cost considerations]

### Constraints

- [Constraint 1: e.g., must work with existing system X]
- [Constraint 2: e.g., budget limitations]
- [Constraint 3: e.g., compliance requirements]

## Decision

### Chosen Option

**[Option Name]**: [Brief description of the chosen solution]

### Detailed Description

[Detailed explanation of what was decided and how it addresses the problem]

## Alternatives Considered

### Option 1: [Name]

**Description**: [What this option involves]

**Pros**:
- [Advantage 1]
- [Advantage 2]

**Cons**:
- [Disadvantage 1]
- [Disadvantage 2]

**Why Not Chosen**: [Reason for rejection]

### Option 2: [Name]

**Description**: [What this option involves]

**Pros**:
- [Advantage 1]
- [Advantage 2]

**Cons**:
- [Disadvantage 1]
- [Disadvantage 2]

**Why Not Chosen**: [Reason for rejection]

### Option 3: [Name]

[Same structure as above]

## Consequences

### Positive

- [Benefit 1: Specific positive outcome]
- [Benefit 2: Another positive outcome]
- [Benefit 3: Additional benefit]

### Negative

- [Trade-off 1: What we're giving up]
- [Trade-off 2: Potential downside]

### Neutral

- [Observation 1: Neither positive nor negative impact]

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk 1] | Low/Medium/High | Low/Medium/High | [How to mitigate] |
| [Risk 2] | Low/Medium/High | Low/Medium/High | [How to mitigate] |

## Implementation

### Technical Approach

[Brief description of how the decision will be implemented]

### Affected Components

- [Component/Module 1]
- [Component/Module 2]
- [Component/Module 3]

### Migration Path (if applicable)

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Validation

### Success Metrics

- [Metric 1: How we'll know this decision was correct]
- [Metric 2: Another success indicator]

### Review Date

[When this decision should be reviewed]

## Related

### Related ADRs

- [ADR-XXX: Related Decision](./ADR-XXX-related.md)

### Related Documentation

- [Link to related docs]
- [Link to relevant PRPs]

### Related Code

- `path/to/relevant/code`
- `path/to/another/file`

## Notes

[Any additional notes, discussions, or context that doesn't fit elsewhere]

---

**Author**: [Name]
**Reviewers**: [Names]
**Approval Date**: [YYYY-MM-DD]
```

## Example ADR

```markdown
# ADR-001: Use PostgreSQL for Primary Database

## Status

Accepted

## Date

2024-01-15

## Context

### Problem Statement

We need to select a primary database for our application that will store user data, transactions, and application state. The database needs to support complex queries, ACID transactions, and scale to handle expected growth.

### Decision Drivers

- Strong consistency requirements for financial transactions
- Need for complex relational queries
- Team familiarity with SQL databases
- Long-term data integrity requirements

### Constraints

- Must support ACID transactions
- Should have good tooling and community support
- Need to integrate with our existing cloud infrastructure (AWS)

## Decision

### Chosen Option

**PostgreSQL**: We will use PostgreSQL 15+ as our primary relational database.

### Detailed Description

PostgreSQL provides the reliability, feature set, and performance characteristics needed for our application. We'll deploy using Amazon RDS for managed infrastructure with Multi-AZ deployment for high availability.

## Alternatives Considered

### Option 1: MySQL

**Description**: MySQL/MariaDB as relational database

**Pros**:
- Wide adoption
- Good performance for read-heavy workloads

**Cons**:
- Weaker support for advanced features (CTEs, window functions)
- Less strict ACID compliance by default

**Why Not Chosen**: PostgreSQL offers better feature set for our complex query needs

### Option 2: MongoDB

**Description**: Document-oriented NoSQL database

**Pros**:
- Flexible schema
- Horizontal scaling

**Cons**:
- Eventual consistency model
- More complex for relational data

**Why Not Chosen**: Our data model is inherently relational with strong consistency requirements

## Consequences

### Positive

- Strong ACID compliance ensures data integrity
- Rich feature set for complex queries
- Excellent JSON support for flexible data
- Strong community and ecosystem

### Negative

- Requires more careful schema design upfront
- Vertical scaling limitations compared to NoSQL

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scaling limitations | Medium | High | Use read replicas, implement caching |
| Schema migrations complexity | Medium | Medium | Use migration tools, plan changes carefully |

## Related

### Related ADRs

- ADR-002: Database Connection Pooling Strategy

### Related Code

- `src/database/connection.ts`
- `src/migrations/`
```

## Best Practices

1. **Keep it concise** - Focus on the decision and key context
2. **Be objective** - Present facts, not opinions
3. **Document alternatives** - Show what was considered
4. **Include consequences** - Both positive and negative
5. **Link related decisions** - Create a decision trail
6. **Update status** - Mark deprecated decisions
7. **Review periodically** - Decisions may need revisiting
