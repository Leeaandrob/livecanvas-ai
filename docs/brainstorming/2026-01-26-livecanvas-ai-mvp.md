# Feature Brainstorming Session: LiveCanvas AI MVP

**Date:** 2026-01-26
**Session Type:** Feature Planning / Technical Design

---

## 1. Context & Problem Statement

### Problem Description

Software architects, engineers, and AI developers face significant friction when creating and iterating on system diagrams:

1. **Input Friction**: "Drawing with a mouse is horrible" - users know the components they need but the interface gets in the way
2. **No Validation**: No intelligent assistant to review architecture decisions and suggest improvements
3. **Collaboration Gap**: When teams collaborate on diagrams, there's no AI "third party" helping explain, validate, or improve the work

### Target Users

- **Primary Users:**
  - Staff AI Engineers building complex systems (first user is the founder)
  - Software Engineers designing system architecture
  - Solution Architects documenting integrations
  - AI/Agent Developers visualizing flows

- **Secondary Users:**
  - Technical leads reviewing architecture decisions
  - DevOps engineers understanding system dependencies
  - Product managers needing system overviews

### Success Criteria

- **Business Metrics:**
  - Open-source adoption (GitHub stars, forks, contributors)
  - User engagement (boards created, AI interactions per session)

- **User Metrics:**
  - Time from idea to diagram reduced by 80%
  - Diagram quality improved (fewer architectural anti-patterns)
  - Collaboration satisfaction (multi-user session completion)

- **Technical Metrics:**
  - Real-time sync latency < 100ms
  - AI response time < 5 seconds (streaming)
  - 99.9% uptime on Cloudflare edge

### Constraints & Assumptions

- **Technical Constraints:**
  - Cloudflare Workers CPU limit (30s paid tier)
  - Cloudflare Durable Objects for stateful connections
  - LLM API latency (5-15 seconds for complex queries)

- **Business Constraints:**
  - 1-week deadline for MVP
  - Solo developer (with Claude Code + Opus 4.5 assistance)
  - Open-source (Apache-2.0 license)

- **Regulatory/Compliance:**
  - No PII storage in diagrams
  - API keys managed by users (bring your own key)

- **Assumptions Made:**
  - Mermaid syntax is sufficient for MVP diagram representation
  - LLMs (Claude, GPT-4, Gemini) have strong architecture knowledge
  - Yjs/CRDTs can run efficiently in Durable Objects

---

## 2. Brainstormed Ideas & Options

### Option A: Traditional Monorepo with Self-Hosted Backend

- **Description:** Node.js backend on VPS/container, React frontend, WebSocket server for real-time
- **Key Features:**
  - Full control over infrastructure
  - Unlimited CPU/memory
  - Traditional deployment (Docker/K8s)
- **Pros:**
  - No platform limitations
  - Familiar stack for most developers
  - Easier local development
- **Cons:**
  - Infrastructure management overhead
  - Cold start latency
  - Scaling complexity
  - Higher ops burden for solo developer
- **Effort Estimate:** L
- **Risk Level:** Medium
- **Dependencies:** VPS provider, container orchestration

### Option B: Cloudflare-Native Architecture (CHOSEN)

- **Description:** Full Cloudflare stack - Pages, Workers, Durable Objects, KV, R2
- **Key Features:**
  - Edge-first deployment (global low latency)
  - Durable Objects for WebSocket + Yjs state
  - Serverless with stateful capabilities
  - Integrated storage (KV, R2)
- **Pros:**
  - Zero infrastructure management
  - Global edge distribution
  - Durable Objects perfect for collaboration rooms
  - Cost-effective for startups
  - Single platform, unified tooling
- **Cons:**
  - 30s CPU limit (mitigated by streaming)
  - Learning curve for Durable Objects
  - Platform lock-in
- **Effort Estimate:** M
- **Risk Level:** Low (founder has relevant experience)
- **Dependencies:** Cloudflare account, Wrangler CLI

### Option C: Vercel + Supabase

- **Description:** Vercel for frontend, Supabase for backend + real-time
- **Key Features:**
  - Supabase Realtime for collaboration
  - Edge functions for AI processing
  - PostgreSQL for persistence
- **Pros:**
  - Great DX
  - Built-in auth and real-time
  - Generous free tier
- **Cons:**
  - Less control over real-time implementation
  - Supabase Realtime may not fit Yjs model well
  - Two platforms to manage
- **Effort Estimate:** M
- **Risk Level:** Medium
- **Dependencies:** Supabase account, Vercel account

### Additional Ideas Considered

- Firebase/Firestore for real-time (rejected: not ideal for CRDT)
- Liveblocks for collaboration (considered for future: adds dependency)
- tldraw as canvas base (considered for Phase 2: Moto)

---

## 3. Decision Outcome

### Chosen Approach

**Selected Solution:** Option B - Cloudflare-Native Architecture

### Rationale

**Primary Factors in Decision:**
1. **Durable Objects are ideal for this use case**: WebSocket handling, persistent state per board, single-threaded coordination - exactly what Yjs collaboration needs
2. **Edge-first aligns with real-time requirements**: Global low latency for collaboration
3. **Reduced operational complexity**: Solo developer needs to focus on product, not infrastructure
4. **Founder experience**: Already has experience with similar real-time systems (Gemini Live, LiveKit)

### Trade-offs Accepted

- **What We're Gaining:**
  - Zero-ops infrastructure
  - Global edge performance
  - Unified platform
  - Cost efficiency

- **What We're Sacrificing:**
  - Unlimited compute time (mitigated by streaming)
  - Some platform flexibility
  - Standard Node.js patterns (Workers have some differences)

- **Future Considerations:**
  - If multimodal processing needs more compute, can add external workers
  - Can migrate specific heavy workloads if needed

---

## 4. Implementation Plan

### MVP Scope (Phase 1) - 1 Week

**Core Features for Initial Release:**

- [x] Canvas visual with Mermaid rendering
- [x] Text to Mermaid (agent generates diagram from description)
- [x] Analyze (agent explains diagram)
- [x] Refactor (agent suggests architectural improvements)
- [x] Apply patch automatically (accept AI suggestions)
- [x] Multi-user real-time collaboration (Yjs/Durable Objects)
- [x] Presence awareness (cursors, user indicators)
- [x] AI as visible collaborator on board
- [x] Architecture designed multimodal-ready

**Acceptance Criteria:**

1. As a user, I can open a canvas and type "create a payment system with gateway and ledger" so that the AI generates a Mermaid diagram
2. As a user, I can click "Analyze" so that the AI explains the current diagram architecture
3. As a user, I can click "Refactor" so that the AI suggests improvements based on best practices
4. As a user, I can apply AI suggestions with one click so that the diagram updates automatically
5. As two users, we can open the same board and see each other's cursors in real-time
6. As a user, I can see the AI agent as a participant in the collaboration session

**Definition of Done:**

- [ ] Feature implemented and tested
- [ ] Code builds and deploys to Cloudflare
- [ ] Real-time sync works between 2+ users
- [ ] AI responses stream correctly
- [ ] Performance criteria met (< 100ms sync, < 5s AI response start)
- [ ] Docker compose for local development works
- [ ] Basic README documentation

### Future Enhancements (Phase 2+)

**Features for Later Iterations:**

- **Multimodal perception (Phase 3)**: AI watches canvas visually, understands screenshots
- **Voice input**: Speak diagram changes instead of typing
- **Gemini Live integration**: Full stateful multimodal sessions
- **tldraw canvas**: More flexible whiteboard beyond Mermaid blocks
- **Multiple diagram types**: Sequence diagrams, ERDs, flowcharts
- **Template library**: Pre-built architecture patterns
- **Export options**: PNG, SVG, PDF export

**Nice-to-Have Improvements:**

- Undo/redo with AI awareness
- Diagram version history
- Comments and annotations
- Keyboard shortcuts
- Mobile responsive design

---

## 5. Action Items & Next Steps

### Immediate Actions (Day 1-2)

- [ ] **Scaffold monorepo structure**
  - **Dependencies:** None
  - **Success Criteria:** `apps/web`, `apps/worker`, `packages/*` directories created with basic configs

- [ ] **Set up Cloudflare Pages + Workers**
  - **Dependencies:** Cloudflare account
  - **Success Criteria:** Hello world deploys to both Pages and Workers

- [ ] **Implement Durable Object BoardRoom**
  - **Dependencies:** Worker setup
  - **Success Criteria:** WebSocket connects, basic message echo works

- [ ] **Integrate Yjs with Durable Objects**
  - **Dependencies:** BoardRoom DO
  - **Success Criteria:** Two browser tabs sync state

### Short-term Actions (Day 3-5)

- [ ] **Build React canvas with Mermaid component**
- [ ] **Implement AI provider abstraction**
- [ ] **Create /analyze and /refactor endpoints**
- [ ] **Add presence (cursors, user indicators)**
- [ ] **Implement apply patch flow**

### Final Actions (Day 6-7)

- [ ] **Testing and bug fixes**
- [ ] **Documentation and README**
- [ ] **Demo recording**

---

## 6. Risks & Dependencies

### Technical Risks

- **Risk:** Yjs integration with Durable Objects may have edge cases
  - **Impact:** High
  - **Probability:** Low (y-durable-objects exists)
  - **Mitigation Strategy:** Start with simple sync, iterate; consult existing implementations

- **Risk:** LLM responses may timeout in Workers
  - **Impact:** Medium
  - **Probability:** Low
  - **Mitigation Strategy:** Use streaming responses, which work well within time limits

- **Risk:** Complex Mermaid diagrams may have rendering issues
  - **Impact:** Low
  - **Probability:** Medium
  - **Mitigation Strategy:** Start with simple diagrams, validate Mermaid syntax before render

### Dependencies

| Dependency | Type | Risk Level |
|------------|------|------------|
| Cloudflare Workers/DO | Platform | Low |
| Yjs | Library | Low |
| Mermaid.js | Library | Low |
| OpenAI/Claude/Gemini API | External Service | Low |
| React + Vite | Framework | Low |

---

## 7. Resources & References

### Technical Documentation

- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/) - Core WebSocket + state management
- [Yjs Documentation](https://docs.yjs.dev/) - CRDT implementation
- [Mermaid.js](https://mermaid.js.org/) - Diagram syntax and rendering
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) - Cloudflare deployment tool

### Codebase References

- `y-durable-objects` - Yjs provider for Cloudflare Durable Objects
- `@cloudflare/workers-types` - TypeScript types for Workers

### External Research

- [Gemini Live API](https://ai.google.dev/gemini-api/docs/live) - Future multimodal integration
- [LiveKit Agents](https://docs.livekit.io/agents/) - Real-time agent patterns
- [tldraw](https://tldraw.dev/) - Canvas library for future phases

---

## 8. Session Notes & Insights

### Key Insights Discovered

1. **Multimodal-first architecture is critical**: Even though MVP won't have full multimodal, the architecture must support it from day one. This means rich event contracts, stateful sessions, and hooks for visual perception.

2. **Domain-agnostic agent is the right choice**: Instead of training for specific domains (fintech, e-commerce), leveraging LLM's native architecture knowledge makes the product more broadly applicable.

3. **Durable Objects solve the hardest problem**: The combination of WebSocket handling + persistent state + single-threaded coordination is exactly what collaborative real-time AI needs.

4. **The "AI as collaborator" framing is powerful**: Not just a tool you query, but a participant that's present in the session, watching and contributing.

### Questions Raised (For Future Investigation)

- How to handle AI agent "cursor" or presence indicator visually?
- What's the optimal debounce for sending canvas state to AI?
- How to handle conflict between AI suggestion and concurrent human edit?
- What multimodal capabilities will Gemini Live support in production?

### Team Feedback

- Founder has strong technical foundation (Gemini Live, LiveKit experience)
- Gap in Yjs/CRDTs knowledge acknowledged - needs focused learning
- 1-week timeline is aggressive but achievable with Claude Code assistance

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐         ┌─────────────────────────┐   │
│  │ Cloudflare      │         │ Cloudflare Workers      │   │
│  │ Pages           │────────▶│ (API Routes)            │   │
│  │                 │         │                         │   │
│  │ - React + Vite  │         │ - /api/analyze          │   │
│  │ - Mermaid       │         │ - /api/refactor         │   │
│  │ - Canvas UI     │         │ - /api/generate         │   │
│  └─────────────────┘         └───────────┬─────────────┘   │
│                                          │                  │
│                                          ▼                  │
│                              ┌─────────────────────────┐   │
│                              │ Durable Objects         │   │
│                              │                         │   │
│                              │ - BoardRoom (per board) │   │
│                              │ - Yjs CRDT state        │   │
│                              │ - WebSocket hub         │   │
│                              │ - AI Agent session      │   │
│                              │ - Presence/cursors      │   │
│                              └───────────┬─────────────┘   │
│                                          │                  │
│  ┌─────────────────┐                     │                  │
│  │ KV Namespace    │◀────────────────────┤                  │
│  │ - Board metadata│                     │                  │
│  │ - User sessions │                     ▼                  │
│  └─────────────────┘         ┌─────────────────────────┐   │
│                              │ R2 Bucket               │   │
│  ┌─────────────────┐         │ - Board snapshots       │   │
│  │ Queues          │         │ - Export files          │   │
│  │ - Async AI jobs │         └─────────────────────────┘   │
│  └─────────────────┘                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │      LLM Providers            │
              │  - OpenAI API                 │
              │  - Anthropic Claude API       │
              │  - Google Gemini Live         │
              └───────────────────────────────┘
```

---

## Monorepo Structure

```
live-canvas-ai/
├── apps/
│   ├── web/                    # Cloudflare Pages
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Canvas.tsx
│   │   │   │   ├── MermaidBlock.tsx
│   │   │   │   ├── Toolbar.tsx
│   │   │   │   ├── Presence.tsx
│   │   │   │   └── AIAgent.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useYjs.ts
│   │   │   │   ├── useAIAgent.ts
│   │   │   │   └── usePresence.ts
│   │   │   └── lib/
│   │   │       └── websocket.ts
│   │   └── vite.config.ts
│   │
│   └── worker/                 # Cloudflare Workers
│       ├── src/
│       │   ├── index.ts
│       │   ├── durable-objects/
│       │   │   └── BoardRoom.ts
│       │   ├── routes/
│       │   │   ├── analyze.ts
│       │   │   ├── refactor.ts
│       │   │   └── generate.ts
│       │   └── lib/
│       │       ├── ai-providers.ts
│       │       └── yjs-sync.ts
│       └── wrangler.toml
│
├── packages/
│   ├── protocols/              # Shared types
│   │   ├── events.ts
│   │   ├── messages.ts
│   │   └── mermaid.ts
│   │
│   └── ai-providers/           # LLM abstraction
│       ├── openai.ts
│       ├── anthropic.ts
│       └── gemini.ts
│
├── wrangler.toml
├── package.json
├── turbo.json
└── README.md
```

---

## Event Contracts

### Canvas → Agent

```json
{
  "type": "board.state.update",
  "boardId": "uuid",
  "mermaid": "graph TD\n  A[Gateway] --> B[Processor]\n  B --> C[Ledger]",
  "nodes": ["Gateway", "Processor", "Ledger"],
  "edges": [
    {"from": "Gateway", "to": "Processor"},
    {"from": "Processor", "to": "Ledger"}
  ],
  "selection": ["Processor"],
  "intent": "optimize for high availability"
}
```

### Agent → System (Tool Call)

```json
{
  "name": "propose_patch",
  "arguments": {
    "mermaid": "graph TD\n  A[Gateway] --> LB[Load Balancer]\n  LB --> B1[Processor 1]\n  LB --> B2[Processor 2]\n  B1 --> C[Ledger]\n  B2 --> C",
    "reason": "Added load balancer and redundant processors for high availability",
    "changes": [
      "Added Load Balancer between Gateway and Processors",
      "Split Processor into two instances for redundancy"
    ]
  }
}
```

---

*Document generated from brainstorming session on 2026-01-26*
*Facilitated using Scrum Master methodology*
