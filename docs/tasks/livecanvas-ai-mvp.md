# Task Breakdown: LiveCanvas AI MVP

**Source PRP**: `/home/leandrob/Projects/Personal/strategies-business/live-canvas-ai/docs/prps/livecanvas-ai-mvp.md`
**Created**: 2026-01-26
**Total Estimated Hours**: 40-48 hours
**Complexity**: High (Multiple integration points, real-time collaboration, AI streaming)

---

## Executive Summary

This task breakdown decomposes the LiveCanvas AI MVP into 16 implementation tasks organized into 4 phases. The project creates an open-source real-time collaborative canvas platform where AI agents understand, validate, and operate architecture diagrams (Mermaid-based) alongside human users.

### Critical Path
```
T-001 -> T-002 -> T-004 -> T-005 -> T-006 -> T-008 -> T-009 -> T-010 -> T-011 -> T-016
```

### Phase Overview
| Phase | Name | Tasks | Hours | Milestone |
|-------|------|-------|-------|-----------|
| 1 | Foundation | T-001 to T-003 | 8-10h | Monorepo scaffolded, packages ready |
| 2 | Backend Core | T-004 to T-007 | 12-14h | Worker deployed, AI routes functional |
| 3 | Frontend Core | T-008 to T-012 | 14-16h | Canvas renders, real-time sync works |
| 4 | Features & Polish | T-013 to T-016 | 8-10h | Full MVP complete |

---

## Phase 1: Foundation (Tasks T-001 to T-003)

### T-001: Scaffold Monorepo Structure

**Task ID**: T-001
**Task Name**: Scaffold Turborepo Monorepo Structure
**Priority**: Critical
**Estimated Hours**: 2-3h

#### Context & Background

**Source PRP Document**: `docs/prps/livecanvas-ai-mvp.md` - Section "Desired Codebase Tree"

**Feature Overview**: Establish the foundational monorepo structure using Turborepo and pnpm workspaces. This enables parallel development of frontend, backend, and shared packages.

**Task Purpose**:
**As a** developer
**I need** a properly configured monorepo with Turborepo
**So that** I can develop, build, and deploy all packages efficiently

**Dependencies**:
- **Prerequisite Tasks**: None (first task)
- **Parallel Tasks**: None
- **Integration Points**: All subsequent tasks depend on this
- **Blocked By**: None

#### Technical Requirements

**Functional Requirements**:
- REQ-1: When `pnpm install` is run, all workspace dependencies shall be installed
- REQ-2: When `pnpm turbo build` is run, all packages shall build in correct order
- REQ-3: When `pnpm turbo dev` is run, all dev servers shall start

**Technical Constraints**:
- Use pnpm as package manager (required for Turborepo efficiency)
- Export raw TypeScript from packages (do not pre-compile)
- Use `workspace:*` for internal dependencies

#### Implementation Details

**Files to Create**:
```
live-canvas-ai/
├── package.json              - Root monorepo config with scripts
├── pnpm-workspace.yaml       - Workspace definitions
├── turbo.json                - Turborepo pipeline config
├── tsconfig.json             - Root TypeScript config with paths
├── .gitignore                - Git ignore patterns
├── .prettierrc               - Prettier configuration
├── .eslintrc.cjs             - ESLint configuration
└── README.md                 - Project documentation
```

**Key Implementation Steps**:
1. Create `package.json` with workspaces and scripts -> Defines monorepo structure
2. Create `pnpm-workspace.yaml` with `apps/*` and `packages/*` -> Enables workspace resolution
3. Create `turbo.json` with build/dev/lint pipelines -> Enables parallel builds
4. Create `tsconfig.json` with path aliases -> Enables cross-package imports

**Code Patterns to Follow**:
```json
// package.json pattern
{
  "name": "live-canvas-ai",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0",
    "prettier": "^3.2.0",
    "eslint": "^8.57.0"
  }
}
```

#### Acceptance Criteria

**Given-When-Then Scenarios**:
```gherkin
Scenario 1: Fresh install succeeds
  Given a clean clone of the repository
  When I run "pnpm install"
  Then all dependencies are installed without errors
  And node_modules/.pnpm directory is created

Scenario 2: Turbo commands work
  Given dependencies are installed
  When I run "pnpm turbo build"
  Then all packages build successfully
  And build output shows correct task ordering

Scenario 3: TypeScript paths resolve
  Given tsconfig.json is configured
  When I import "@live-canvas/protocols" in a file
  Then TypeScript resolves to packages/protocols/src
```

**Rule-Based Criteria (Checklist)**:
- [ ] `pnpm install` completes without errors
- [ ] `pnpm turbo build` succeeds (even if packages are empty)
- [ ] TypeScript path aliases configured for `@live-canvas/*`
- [ ] ESLint and Prettier configs present
- [ ] `.gitignore` includes node_modules, dist, .turbo, .wrangler

#### Validation Commands
```bash
# Verify installation
pnpm install

# Verify turbo works
pnpm turbo build --dry-run

# Verify TypeScript
pnpm exec tsc --showConfig
```

---

### T-002: Create Protocols Package

**Task ID**: T-002
**Task Name**: Create Shared Protocols Package with Type Definitions
**Priority**: Critical
**Estimated Hours**: 2h

#### Context & Background

**Source PRP Document**: `docs/prps/livecanvas-ai-mvp.md` - Section "Data Models and Structure"

**Feature Overview**: Create the shared type definitions package that both frontend and backend will use. This ensures type safety across the entire application.

**Task Purpose**:
**As a** developer
**I need** shared TypeScript types for boards, events, and AI interactions
**So that** frontend and backend have consistent contracts

**Dependencies**:
- **Prerequisite Tasks**: T-001 (Monorepo scaffold)
- **Parallel Tasks**: T-003 (AI Providers package)
- **Integration Points**: Used by apps/web and apps/worker

#### Technical Requirements

**Functional Requirements**:
- REQ-1: Package shall export Board and MermaidBlock types
- REQ-2: Package shall export WebSocket message types
- REQ-3: Package shall export AI request/response types
- REQ-4: Package shall export Canvas-Agent event types

**Technical Constraints**:
- Export raw TypeScript (no compilation step)
- Use strict TypeScript settings
- All types must be exported from index.ts

#### Implementation Details

**Files to Create**:
```
packages/protocols/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts       - Re-exports all types
    ├── board.ts       - Board, MermaidBlock, Position types
    ├── events.ts      - BoardStateUpdate, ProposePatch types
    ├── messages.ts    - WebSocket message union types
    └── ai.ts          - AIRequest, AIResponse, UserPresence types
```

**Key Implementation Steps**:
1. Create `package.json` with exports field -> Enables package imports
2. Create `board.ts` with core data types -> Defines board structure
3. Create `events.ts` with event types -> Defines Canvas-Agent contract
4. Create `messages.ts` with WebSocket types -> Defines sync protocol
5. Create `ai.ts` with AI types -> Defines AI interaction contract

**Code Patterns**:
```typescript
// packages/protocols/src/board.ts
export interface Board {
  id: string;
  blocks: MermaidBlock[];
  createdAt: number;
  updatedAt: number;
}

export interface MermaidBlock {
  id: string;
  code: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  lastValidCode: string;
}

export interface Position {
  x: number;
  y: number;
}
```

#### Acceptance Criteria

**Given-When-Then Scenarios**:
```gherkin
Scenario 1: Types are importable
  Given the protocols package is created
  When I import { Board, MermaidBlock } from "@live-canvas/protocols"
  Then TypeScript recognizes the types
  And autocomplete shows all properties

Scenario 2: All required types exist
  Given the protocols package is created
  When I check the index.ts exports
  Then Board, MermaidBlock, Position types are exported
  And AIRequest, AIResponse types are exported
  And WebSocketMessage type is exported
```

**Rule-Based Criteria (Checklist)**:
- [ ] `package.json` has correct exports field
- [ ] All types from PRP data models are implemented
- [ ] `index.ts` re-exports all types
- [ ] TypeScript strict mode enabled
- [ ] No compilation errors

---

### T-003: Create AI Providers Package

**Task ID**: T-003
**Task Name**: Create Multi-Provider AI Abstraction Package
**Priority**: High
**Estimated Hours**: 3-4h

#### Context & Background

**Source PRP Document**: `docs/prps/livecanvas-ai-mvp.md` - Section "packages/ai-providers"

**Feature Overview**: Create an abstraction layer for multiple LLM providers (OpenAI, Anthropic, Gemini) with streaming support. This enables users to bring their own API keys.

**Task Purpose**:
**As a** developer
**I need** a unified interface for multiple LLM providers
**So that** users can choose their preferred AI provider

**Dependencies**:
- **Prerequisite Tasks**: T-001 (Monorepo scaffold)
- **Parallel Tasks**: T-002 (Protocols package)
- **Integration Points**: Used by apps/worker AI routes

#### Technical Requirements

**Functional Requirements**:
- REQ-1: Package shall support OpenAI GPT-4 streaming
- REQ-2: Package shall support Anthropic Claude streaming
- REQ-3: Package shall support Google Gemini streaming
- REQ-4: Package shall provide factory function for provider selection

**Non-Functional Requirements**:
- **Performance**: Streaming must start within 2 seconds
- **Security**: API keys passed per-request, never stored

**Technical Constraints**:
- Use official SDKs: openai, @anthropic-ai/sdk, @google/generative-ai
- All providers must implement same interface
- Support async iteration for streaming

#### Implementation Details

**Files to Create**:
```
packages/ai-providers/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts        - Factory function and exports
    ├── types.ts        - AIProvider interface
    ├── openai.ts       - OpenAI implementation
    ├── anthropic.ts    - Anthropic implementation
    └── gemini.ts       - Gemini implementation
```

**Key Implementation Steps**:
1. Define AIProvider interface -> Ensures consistent API
2. Implement OpenAI provider with streaming -> Primary provider
3. Implement Anthropic provider with streaming -> Secondary provider
4. Implement Gemini provider -> Tertiary provider
5. Create factory function -> Enables provider selection

**Code Patterns**:
```typescript
// packages/ai-providers/src/types.ts
export interface AIProvider {
  stream(prompt: string, systemPrompt?: string): AsyncIterable<string>;
  complete(prompt: string, systemPrompt?: string): Promise<string>;
}

export type ProviderType = "openai" | "anthropic" | "gemini";

// packages/ai-providers/src/index.ts
export function createProvider(type: ProviderType, apiKey: string): AIProvider {
  switch (type) {
    case "openai": return new OpenAIProvider(apiKey);
    case "anthropic": return new AnthropicProvider(apiKey);
    case "gemini": return new GeminiProvider(apiKey);
  }
}
```

#### Acceptance Criteria

**Given-When-Then Scenarios**:
```gherkin
Scenario 1: OpenAI streaming works
  Given a valid OpenAI API key
  When I call provider.stream("Hello")
  Then I receive chunks of text asynchronously
  And the complete response is valid

Scenario 2: Provider factory creates correct instance
  Given the ai-providers package
  When I call createProvider("anthropic", apiKey)
  Then I receive an AnthropicProvider instance
  And the stream method is available
```

**Rule-Based Criteria (Checklist)**:
- [ ] AIProvider interface defined with stream and complete methods
- [ ] OpenAI provider implements streaming correctly
- [ ] Anthropic provider implements streaming correctly
- [ ] Gemini provider implements streaming correctly
- [ ] Factory function returns correct provider type
- [ ] Error handling for invalid API keys

---

## Phase 2: Backend Core (Tasks T-004 to T-007)

### T-004: Setup Cloudflare Worker

**Task ID**: T-004
**Task Name**: Setup Cloudflare Worker with Hono Framework
**Priority**: Critical
**Estimated Hours**: 2-3h

#### Context & Background

**Source PRP Document**: `docs/prps/livecanvas-ai-mvp.md` - Section "apps/worker"

**Feature Overview**: Create the Cloudflare Worker application that will handle API routes and host the Durable Object for real-time collaboration.

**Task Purpose**:
**As a** developer
**I need** a Cloudflare Worker with Hono routing
**So that** I can handle API requests and WebSocket connections

**Dependencies**:
- **Prerequisite Tasks**: T-001, T-002
- **Parallel Tasks**: None
- **Integration Points**: Durable Objects, AI routes, Frontend WebSocket

#### Technical Requirements

**Functional Requirements**:
- REQ-1: Worker shall respond to HTTP requests at configured routes
- REQ-2: Worker shall support WebSocket upgrades for /board/:id
- REQ-3: Worker shall bind to Durable Objects namespace

**Technical Constraints**:
- Use Hono 4.3+ (required for y-durableobjects)
- Configure wrangler.toml with Durable Objects migration
- Use WebSocket Hibernation API

#### Implementation Details

**Files to Create**:
```
apps/worker/
├── package.json
├── tsconfig.json
├── wrangler.toml           - Cloudflare configuration
└── src/
    └── index.ts            - Hono app entry point
```

**Key Implementation Steps**:
1. Create `package.json` with dependencies -> Sets up build
2. Create `wrangler.toml` with DO bindings -> Configures Cloudflare
3. Create `src/index.ts` with Hono app -> Creates API structure

**Code Patterns**:
```typescript
// apps/worker/src/index.ts
import { Hono } from "hono";
import { BoardRoom } from "./durable-objects/BoardRoom";

export { BoardRoom };

type Env = {
  BOARD_ROOM: DurableObjectNamespace;
};

const app = new Hono<{ Bindings: Env }>();

app.get("/board/:id", async (c) => {
  const id = c.env.BOARD_ROOM.idFromName(c.req.param("id"));
  const room = c.env.BOARD_ROOM.get(id);
  return room.fetch(c.req.raw);
});

export default app;
```

```toml
# wrangler.toml
name = "live-canvas-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[durable_objects.bindings]]
name = "BOARD_ROOM"
class_name = "BoardRoom"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["BoardRoom"]
```

#### Acceptance Criteria

**Given-When-Then Scenarios**:
```gherkin
Scenario 1: Worker starts locally
  Given the worker package is configured
  When I run "pnpm --filter worker dev"
  Then the worker starts on localhost:8787
  And responds to HTTP requests

Scenario 2: Durable Object binding works
  Given the worker is running
  When I access /board/test-id
  Then the request is forwarded to BoardRoom DO
```

**Rule-Based Criteria (Checklist)**:
- [ ] `wrangler.toml` has correct Durable Objects config
- [ ] Hono app handles basic routes
- [ ] Worker builds without errors
- [ ] Local dev server starts with `wrangler dev`

---

### T-005: Implement BoardRoom Durable Object

**Task ID**: T-005
**Task Name**: Implement BoardRoom Durable Object with Yjs Sync
**Priority**: Critical
**Estimated Hours**: 4h

#### Context & Background

**Source PRP Document**: `docs/prps/livecanvas-ai-mvp.md` - Section "Task 5: BoardRoom Durable Object"

**Feature Overview**: Implement the core Durable Object that manages board state using Yjs CRDT and handles WebSocket connections for real-time collaboration.

**Task Purpose**:
**As a** user
**I need** real-time synchronization between multiple clients
**So that** I can collaborate with others on the same board

**Dependencies**:
- **Prerequisite Tasks**: T-004 (Worker setup)
- **Parallel Tasks**: T-006, T-007
- **Integration Points**: Frontend WebSocket, AI cursor broadcasting

#### Technical Requirements

**Functional Requirements**:
- REQ-1: BoardRoom shall sync Yjs documents between connected clients
- REQ-2: BoardRoom shall broadcast AI cursor state to all clients
- REQ-3: BoardRoom shall use WebSocket Hibernation API
- REQ-4: BoardRoom shall persist state across restarts

**Non-Functional Requirements**:
- **Performance**: Sync latency < 100ms between clients

**Technical Constraints**:
- Extend YDurableObjects from y-durableobjects library
- Use serializeAttachment for hibernation-safe session data
- Do not call setAlarm in constructor

#### Implementation Details

**Files to Create**:
```
apps/worker/src/durable-objects/
└── BoardRoom.ts    - Durable Object implementation
```

**Key Implementation Steps**:
1. Install y-durableobjects package -> Provides Yjs integration
2. Create BoardRoom extending YDurableObjects -> Inherits sync logic
3. Override webSocketMessage for AI cursor -> Custom message handling
4. Add broadcastAICursor method -> AI presence feature
5. Add cleanup alarm -> Resource management

**Code Patterns**:
```typescript
// apps/worker/src/durable-objects/BoardRoom.ts
import { YDurableObjects } from "y-durableobjects";
import type { Position } from "@live-canvas/protocols";

interface Env {
  BOARD_ROOM: DurableObjectNamespace;
}

export class BoardRoom extends YDurableObjects<Env> {
  private aiCursorState: { position: Position | null; state: "thinking" | "idle" } = {
    position: null,
    state: "idle"
  };

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    await super.webSocketMessage(ws, message);

    if (typeof message === "string") {
      try {
        const parsed = JSON.parse(message);
        if (parsed.type === "ai-cursor") {
          this.aiCursorState = { position: parsed.position, state: parsed.state };
          this.broadcastAICursor();
        }
      } catch {}
    }
  }

  private broadcastAICursor(): void {
    const message = JSON.stringify({ type: "ai-cursor", ...this.aiCursorState });
    for (const ws of this.ctx.getWebSockets()) {
      try { ws.send(message); } catch {}
    }
  }

  setAICursorState(state: "thinking" | "idle", position?: Position): void {
    this.aiCursorState = { position: position ?? null, state };
    this.broadcastAICursor();
  }
}
```

#### Acceptance Criteria

**Given-When-Then Scenarios**:
```gherkin
Scenario 1: Two clients sync
  Given two browser tabs connected to the same board
  When Tab A changes the Yjs document
  Then Tab B receives the update within 100ms

Scenario 2: AI cursor broadcasts
  Given a client connected to a board
  When the server calls setAICursorState("thinking")
  Then the client receives an ai-cursor message with state "thinking"

Scenario 3: State persists across restarts
  Given a board with content
  When the Durable Object hibernates and wakes
  Then the board content is preserved
```

**Rule-Based Criteria (Checklist)**:
- [ ] BoardRoom extends YDurableObjects correctly
- [ ] WebSocket connections sync Yjs documents
- [ ] AI cursor state broadcasts to all clients
- [ ] State persists in Durable Object storage
- [ ] No errors on hibernation/wake cycle

---

### T-006: Implement Worker API Routes

**Task ID**: T-006
**Task Name**: Implement AI API Routes (analyze, refactor, generate, fix-syntax)
**Priority**: Critical
**Estimated Hours**: 3-4h

#### Context & Background

**Source PRP Document**: `docs/prps/livecanvas-ai-mvp.md` - Section "Task 6: Implement Worker API Routes"

**Feature Overview**: Create the API endpoints that handle AI interactions for diagram analysis, refactoring, generation, and syntax fixing.

**Task Purpose**:
**As a** user
**I need** API endpoints for AI operations
**So that** I can analyze, refactor, and generate diagrams with AI

**Dependencies**:
- **Prerequisite Tasks**: T-004 (Worker setup), T-003 (AI Providers)
- **Parallel Tasks**: T-007 (Prompts)
- **Integration Points**: Frontend API calls, AI Providers package

#### Technical Requirements

**Functional Requirements**:
- REQ-1: POST /api/analyze shall explain diagram architecture
- REQ-2: POST /api/refactor shall suggest improvements with patches
- REQ-3: POST /api/generate shall create Mermaid from text
- REQ-4: POST /api/fix-syntax shall correct invalid Mermaid
- REQ-5: All routes shall support streaming responses

**Technical Constraints**:
- Use Hono's streamText for streaming responses
- Set AI cursor state during processing
- Accept API key in request body (BYOK model)

#### Implementation Details

**Files to Create**:
```
apps/worker/src/routes/
├── board.ts        - WebSocket upgrade route
├── analyze.ts      - POST /api/analyze
├── refactor.ts     - POST /api/refactor
├── generate.ts     - POST /api/generate
└── fix-syntax.ts   - POST /api/fix-syntax
```

**Key Implementation Steps**:
1. Create route files with Hono routers -> Modular structure
2. Implement streaming response pattern -> Real-time AI output
3. Integrate AI cursor state updates -> Visual AI presence
4. Register routes in main index.ts -> Enable endpoints

**Code Patterns**:
```typescript
// apps/worker/src/routes/analyze.ts
import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { createProvider } from "@live-canvas/ai-providers";
import type { AIRequest } from "@live-canvas/protocols";
import { ANALYZE_PROMPT } from "../lib/prompts";

export const analyzeRoute = new Hono<{ Bindings: Env }>();

analyzeRoute.post("/", async (c) => {
  const { mermaid, provider, apiKey } = await c.req.json<AIRequest>();
  const boardId = c.req.header("X-Board-Id");

  // Set AI cursor to thinking
  if (boardId) {
    const id = c.env.BOARD_ROOM.idFromName(boardId);
    const room = c.env.BOARD_ROOM.get(id);
    await room.setAICursorState("thinking");
  }

  const ai = createProvider(provider, apiKey);
  const prompt = ANALYZE_PROMPT.replace("{{MERMAID}}", mermaid || "");

  return streamText(c, async (stream) => {
    try {
      for await (const chunk of ai.stream(prompt)) {
        await stream.write(chunk);
      }
    } finally {
      if (boardId) {
        const id = c.env.BOARD_ROOM.idFromName(boardId);
        const room = c.env.BOARD_ROOM.get(id);
        await room.setAICursorState("idle");
      }
    }
  });
});
```

#### Acceptance Criteria

**Given-When-Then Scenarios**:
```gherkin
Scenario 1: Analyze returns streaming explanation
  Given a valid Mermaid diagram
  When I POST to /api/analyze with the diagram
  Then I receive a streaming response
  And the response explains the architecture

Scenario 2: Generate creates valid Mermaid
  Given a text description "payment system with gateway"
  When I POST to /api/generate with the description
  Then I receive Mermaid code as streaming response
  And the Mermaid code is syntactically valid

Scenario 3: Fix-syntax corrects errors
  Given invalid Mermaid code "graph TD A-->B--C"
  When I POST to /api/fix-syntax
  Then I receive corrected Mermaid code
```

**Rule-Based Criteria (Checklist)**:
- [ ] All four routes implemented and registered
- [ ] Streaming responses work correctly
- [ ] AI cursor state updates during processing
- [ ] Error handling for invalid API keys
- [ ] Request validation for required fields

---

### T-007: Implement AI Prompts and Streaming Utilities

**Task ID**: T-007
**Task Name**: Create AI Prompts and Streaming Utilities
**Priority**: High
**Estimated Hours**: 2h

#### Context & Background

**Source PRP Document**: `docs/prps/livecanvas-ai-mvp.md` - Section "Task 7: Implement AI Prompts and Client"

**Feature Overview**: Create the prompt templates for each AI operation and utility functions for streaming responses.

**Task Purpose**:
**As a** developer
**I need** well-crafted prompts for AI operations
**So that** AI produces consistent, high-quality outputs

**Dependencies**:
- **Prerequisite Tasks**: T-004 (Worker setup)
- **Parallel Tasks**: T-006 (API Routes)
- **Integration Points**: Used by all AI routes

#### Implementation Details

**Files to Create**:
```
apps/worker/src/lib/
├── prompts.ts      - AI prompt templates
├── ai-client.ts    - AI client wrapper
└── streaming.ts    - Streaming utilities
```

**Key Implementation Steps**:
1. Create ANALYZE_PROMPT -> Explains diagram architecture
2. Create REFACTOR_PROMPT -> Suggests improvements with patches
3. Create GENERATE_PROMPT -> Creates Mermaid from description
4. Create FIX_SYNTAX_PROMPT -> Corrects Mermaid syntax errors
5. Create streaming utilities -> TransformStream helpers

**Code Patterns**:
```typescript
// apps/worker/src/lib/prompts.ts
export const ANALYZE_PROMPT = `You are an expert software architect analyzing a Mermaid diagram.

Analyze the following diagram and explain:
1. The overall architecture pattern being used
2. The components and their responsibilities
3. The data flow between components
4. Potential strengths of this design
5. Areas that might need attention

Diagram:
\`\`\`mermaid
{{MERMAID}}
\`\`\`

Provide a clear, structured analysis.`;

export const REFACTOR_PROMPT = `You are an expert software architect. Analyze this Mermaid diagram and suggest improvements.

Current diagram:
\`\`\`mermaid
{{MERMAID}}
\`\`\`

Provide:
1. Analysis of current design issues
2. Specific improvement recommendations
3. A refactored Mermaid diagram

Format your response as:
## Analysis
[Your analysis]

## Recommendations
[Your recommendations]

## Refactored Diagram
\`\`\`mermaid
[Improved diagram code]
\`\`\``;

export const GENERATE_PROMPT = `You are an expert software architect. Generate a Mermaid diagram based on this description:

{{PROMPT}}

Requirements:
- Use appropriate Mermaid diagram type (flowchart, sequence, etc.)
- Include clear node labels
- Show relationships between components
- Keep it readable and well-organized

Respond with ONLY the Mermaid code, no explanation.`;

export const FIX_SYNTAX_PROMPT = `Fix the syntax errors in this Mermaid diagram. Return ONLY the corrected Mermaid code, no explanation.

Invalid diagram:
\`\`\`mermaid
{{MERMAID}}
\`\`\`

Corrected diagram:`;
```

#### Acceptance Criteria

**Rule-Based Criteria (Checklist)**:
- [ ] ANALYZE_PROMPT produces structured analysis
- [ ] REFACTOR_PROMPT includes improved diagram
- [ ] GENERATE_PROMPT creates valid Mermaid
- [ ] FIX_SYNTAX_PROMPT corrects errors
- [ ] All prompts have {{MERMAID}} or {{PROMPT}} placeholders

---

## Phase 3: Frontend Core (Tasks T-008 to T-012)

### T-008: Setup React Frontend

**Task ID**: T-008
**Task Name**: Setup React Frontend with Vite
**Priority**: Critical
**Estimated Hours**: 2-3h

#### Context & Background

**Source PRP Document**: `docs/prps/livecanvas-ai-mvp.md` - Section "Task 8: Setup React Frontend"

**Feature Overview**: Create the React frontend application with Vite, including routing and base styling.

**Task Purpose**:
**As a** user
**I need** a web interface for the canvas
**So that** I can create and edit diagrams

**Dependencies**:
- **Prerequisite Tasks**: T-001 (Monorepo), T-002 (Protocols)
- **Parallel Tasks**: T-004-T-007 (Backend tasks)
- **Integration Points**: Worker WebSocket, API endpoints

#### Implementation Details

**Files to Create**:
```
apps/web/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    └── types/
        └── index.ts
```

**Key Implementation Steps**:
1. Create `package.json` with React, Yjs, Mermaid dependencies
2. Configure Vite for Cloudflare Pages compatibility
3. Create App.tsx with React Router
4. Add base dark theme styles

**Code Patterns**:
```typescript
// apps/web/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { nanoid } from "nanoid";
import { Board } from "./pages/Board";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={`/board/${nanoid()}`} replace />} />
        <Route path="/board/:id" element={<Board />} />
      </Routes>
    </BrowserRouter>
  );
}
```

#### Acceptance Criteria

**Given-When-Then Scenarios**:
```gherkin
Scenario 1: App loads and redirects
  Given I visit the root URL "/"
  When the app loads
  Then I am redirected to "/board/{random-id}"

Scenario 2: Dev server works
  Given the web package is configured
  When I run "pnpm --filter web dev"
  Then Vite starts on localhost:5173
  And hot module reload works
```

**Rule-Based Criteria (Checklist)**:
- [ ] Vite dev server starts without errors
- [ ] React Router handles /board/:id route
- [ ] Root path redirects to new board
- [ ] Dark theme base styles applied
- [ ] TypeScript compiles without errors

---

### T-009: Implement Yjs and WebSocket Hooks

**Task ID**: T-009
**Task Name**: Implement Yjs Document and WebSocket Provider Hooks
**Priority**: Critical
**Estimated Hours**: 3-4h

#### Context & Background

**Source PRP Document**: `docs/prps/livecanvas-ai-mvp.md` - Section "Task 9: Implement Yjs and WebSocket Hooks"

**Feature Overview**: Create React hooks for Yjs document management, WebSocket connection, and presence awareness.

**Task Purpose**:
**As a** user
**I need** real-time synchronization of board state
**So that** changes are immediately visible to all collaborators

**Dependencies**:
- **Prerequisite Tasks**: T-008 (Frontend setup), T-005 (BoardRoom DO)
- **Parallel Tasks**: T-010 (Canvas components)
- **Integration Points**: BoardRoom WebSocket, Awareness protocol

#### Implementation Details

**Files to Create**:
```
apps/web/src/
├── hooks/
│   ├── useYjs.ts        - Y.Doc and provider management
│   ├── useAwareness.ts  - Presence and cursor tracking
│   └── useBoard.ts      - Board state operations
└── lib/
    └── websocket.ts     - WebSocket connection manager
```

**Key Implementation Steps**:
1. Create useYjs hook -> Manages Y.Doc lifecycle
2. Create WebSocket provider -> Connects to BoardRoom
3. Create useAwareness hook -> Tracks user presence
4. Create useBoard hook -> CRUD operations on blocks

**Code Patterns**:
```typescript
// apps/web/src/hooks/useYjs.ts
import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export function useYjs(boardId: string) {
  const doc = useMemo(() => new Y.Doc(), []);
  const [connected, setConnected] = useState(false);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);

  useEffect(() => {
    const wsUrl = import.meta.env.PROD
      ? `wss://live-canvas-worker.your-domain.workers.dev/board/${boardId}`
      : `ws://localhost:8787/board/${boardId}`;

    const wsProvider = new WebsocketProvider(wsUrl, boardId, doc);

    wsProvider.on("status", ({ status }: { status: string }) => {
      setConnected(status === "connected");
    });

    setProvider(wsProvider);

    return () => {
      wsProvider.destroy();
      doc.destroy();
    };
  }, [boardId, doc]);

  return { doc, provider, connected };
}

// apps/web/src/hooks/useBoard.ts
import { useCallback, useSyncExternalStore } from "react";
import * as Y from "yjs";
import type { MermaidBlock } from "@live-canvas/protocols";

export function useBoard(doc: Y.Doc) {
  const blocksArray = doc.getArray<MermaidBlock>("blocks");

  const blocks = useSyncExternalStore(
    (callback) => {
      blocksArray.observe(callback);
      return () => blocksArray.unobserve(callback);
    },
    () => blocksArray.toArray()
  );

  const addBlock = useCallback((block: MermaidBlock) => {
    blocksArray.push([block]);
  }, [blocksArray]);

  const updateBlock = useCallback((id: string, updates: Partial<MermaidBlock>) => {
    const index = blocks.findIndex(b => b.id === id);
    if (index !== -1) {
      doc.transact(() => {
        const current = blocksArray.get(index);
        blocksArray.delete(index, 1);
        blocksArray.insert(index, [{ ...current, ...updates }]);
      });
    }
  }, [blocks, blocksArray, doc]);

  return { blocks, addBlock, updateBlock };
}
```

#### Acceptance Criteria

**Given-When-Then Scenarios**:
```gherkin
Scenario 1: Yjs connects to BoardRoom
  Given the frontend loads a board page
  When useYjs hook initializes
  Then a WebSocket connection is established
  And connected state becomes true

Scenario 2: Changes sync between clients
  Given two browser tabs on the same board
  When Tab A adds a block
  Then Tab B sees the block within 100ms

Scenario 3: Awareness shows other users
  Given two users on the same board
  When User A moves their cursor
  Then User B sees User A's cursor position
```

**Rule-Based Criteria (Checklist)**:
- [ ] useYjs creates and manages Y.Doc
- [ ] WebSocket connects to correct BoardRoom
- [ ] useBoard provides blocks array and CRUD operations
- [ ] useAwareness tracks cursor positions
- [ ] Cleanup on unmount (no memory leaks)

---

### T-010: Implement Canvas and MermaidBlock

**Task ID**: T-010
**Task Name**: Implement Canvas Container and MermaidBlock Components
**Priority**: Critical
**Estimated Hours**: 4h

#### Context & Background

**Source PRP Document**: `docs/prps/livecanvas-ai-mvp.md` - Section "Task 10: Implement Canvas and MermaidBlock"

**Feature Overview**: Create the main canvas component that holds multiple Mermaid diagram blocks with drag-and-drop positioning.

**Task Purpose**:
**As a** user
**I need** a visual canvas with draggable diagram blocks
**So that** I can organize multiple diagrams spatially

**Dependencies**:
- **Prerequisite Tasks**: T-009 (Yjs hooks)
- **Parallel Tasks**: T-011 (Chat Panel)
- **Integration Points**: useBoard hook, AI auto-fix

#### Implementation Details

**Files to Create**:
```
apps/web/src/
├── components/
│   ├── Canvas.tsx       - Main canvas container
│   └── MermaidBlock.tsx - Individual diagram block
└── lib/
    └── mermaid.ts       - Mermaid initialization
```

**Key Implementation Steps**:
1. Initialize Mermaid with startOnLoad: false
2. Create Canvas with drag-drop support
3. Create MermaidBlock with error handling
4. Implement auto-fix trigger on syntax error

**Code Patterns**:
```typescript
// apps/web/src/lib/mermaid.ts
import mermaid from "mermaid";

export function initMermaid() {
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
  });
}

export async function renderMermaid(id: string, code: string): Promise<string> {
  const { svg } = await mermaid.render(id, code);
  return svg;
}

// apps/web/src/components/MermaidBlock.tsx
import { useEffect, useState, useCallback } from "react";
import { renderMermaid } from "../lib/mermaid";
import { useAIAgent } from "../hooks/useAIAgent";
import type { MermaidBlock as BlockType } from "@live-canvas/protocols";

interface Props {
  block: BlockType;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<BlockType>) => void;
}

export function MermaidBlock({ block, selected, onSelect, onUpdate }: Props) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { fixSyntax, isFixing } = useAIAgent();

  useEffect(() => {
    if (!block.code.trim()) {
      setSvg("");
      setError(null);
      return;
    }

    renderMermaid(`mermaid-${block.id}`, block.code)
      .then((result) => {
        setSvg(result);
        setError(null);
        onUpdate({ lastValidCode: block.code });
      })
      .catch(async (err) => {
        setError(err.message);
        // Auto-fix on error
        const fixed = await fixSyntax(block.code);
        if (fixed && fixed !== block.code) {
          onUpdate({ code: fixed });
        }
      });
  }, [block.code, block.id, fixSyntax, onUpdate]);

  return (
    <div
      className={`mermaid-block ${selected ? "selected" : ""}`}
      style={{ left: block.position.x, top: block.position.y }}
      onClick={onSelect}
    >
      {error && !isFixing ? (
        <div className="error">Syntax error - AI fixing...</div>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      )}
    </div>
  );
}
```

#### Acceptance Criteria

**Given-When-Then Scenarios**:
```gherkin
Scenario 1: Mermaid renders correctly
  Given a block with valid Mermaid code
  When the component mounts
  Then the diagram renders as SVG

Scenario 2: Auto-fix on syntax error
  Given a block with invalid Mermaid code
  When rendering fails
  Then AI fix-syntax is called automatically
  And the block updates with corrected code

Scenario 3: Blocks are draggable
  Given a rendered block on the canvas
  When I drag the block
  Then its position updates in Yjs
  And other users see the new position
```

**Rule-Based Criteria (Checklist)**:
- [ ] Mermaid initialized with startOnLoad: false
- [ ] Blocks render valid Mermaid as SVG
- [ ] Invalid syntax triggers auto-fix
- [ ] Blocks can be dragged to new positions
- [ ] Selected state is visually indicated

---

### T-011: Implement Chat Panel and AI Response

**Task ID**: T-011
**Task Name**: Implement Chat Panel and AI Response Display
**Priority**: High
**Estimated Hours**: 3h

#### Context & Background

**Source PRP Document**: `docs/prps/livecanvas-ai-mvp.md` - Section "Task 11: Implement Chat Panel and AI Response"

**Feature Overview**: Create the side chat panel for AI commands and the response display area below diagrams.

**Task Purpose**:
**As a** user
**I need** a chat interface to interact with AI
**So that** I can generate, analyze, and refactor diagrams

**Dependencies**:
- **Prerequisite Tasks**: T-008 (Frontend), T-006 (API Routes)
- **Parallel Tasks**: T-010 (Canvas)
- **Integration Points**: AI API endpoints, streaming responses

#### Implementation Details

**Files to Create**:
```
apps/web/src/
├── components/
│   ├── ChatPanel.tsx    - Side panel for AI commands
│   └── AIResponse.tsx   - Response display below diagram
└── hooks/
    └── useAIAgent.ts    - AI interaction logic
```

**Key Implementation Steps**:
1. Create ChatPanel with input and message history
2. Create AIResponse for streaming display
3. Create useAIAgent hook for API calls
4. Implement streaming response handling

**Code Patterns**:
```typescript
// apps/web/src/hooks/useAIAgent.ts
import { useState, useCallback } from "react";
import { useSettings } from "./useSettings";

export function useAIAgent() {
  const { settings } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");

  const callAI = useCallback(async (
    endpoint: string,
    data: { mermaid?: string; prompt?: string }
  ) => {
    setIsLoading(true);
    setResponse("");

    const res = await fetch(`/api/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        provider: settings.provider,
        apiKey: settings.apiKey,
      }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setResponse(prev => prev + decoder.decode(value));
      }
    }

    setIsLoading(false);
  }, [settings]);

  const analyze = useCallback((mermaid: string) =>
    callAI("analyze", { mermaid }), [callAI]);

  const refactor = useCallback((mermaid: string) =>
    callAI("refactor", { mermaid }), [callAI]);

  const generate = useCallback((prompt: string) =>
    callAI("generate", { prompt }), [callAI]);

  const fixSyntax = useCallback((mermaid: string) =>
    callAI("fix-syntax", { mermaid }), [callAI]);

  return { analyze, refactor, generate, fixSyntax, isLoading, response };
}
```

#### Acceptance Criteria

**Given-When-Then Scenarios**:
```gherkin
Scenario 1: Generate diagram from text
  Given I type "create a payment system" in the chat
  When I press Enter or click Generate
  Then AI generates Mermaid code
  And a new block appears on canvas

Scenario 2: Streaming response displays
  Given I click Analyze on a diagram
  When the AI responds
  Then the response streams character by character
  And the response appears below the diagram
```

**Rule-Based Criteria (Checklist)**:
- [ ] Chat panel accepts text input
- [ ] Generate, Analyze, Refactor actions work
- [ ] Streaming responses display progressively
- [ ] Loading state shows during AI processing
- [ ] Response area shows below selected diagram

---

### T-012: Implement Toolbar and API Client

**Task ID**: T-012
**Task Name**: Implement Toolbar Component and API Client
**Priority**: High
**Estimated Hours**: 2h

#### Context & Background

**Source PRP Document**: `docs/prps/livecanvas-ai-mvp.md` - Section "Task 12: Implement Toolbar and Actions"

**Feature Overview**: Create the toolbar with action buttons (Analyze, Refactor, Add Block) and the API client utilities.

**Task Purpose**:
**As a** user
**I need** quick action buttons
**So that** I can easily access AI features and add blocks

**Dependencies**:
- **Prerequisite Tasks**: T-011 (AI hooks)
- **Parallel Tasks**: None
- **Integration Points**: useAIAgent, useBoard hooks

#### Implementation Details

**Files to Create**:
```
apps/web/src/
├── components/
│   └── Toolbar.tsx      - Action buttons
└── lib/
    └── api.ts           - API client utilities
```

**Key Implementation Steps**:
1. Create Toolbar with Analyze, Refactor, Add buttons
2. Create API client with streaming fetch
3. Connect toolbar actions to hooks

**Code Patterns**:
```typescript
// apps/web/src/components/Toolbar.tsx
import { useAIAgent } from "../hooks/useAIAgent";
import { useBoard } from "../hooks/useBoard";
import { nanoid } from "nanoid";

interface Props {
  selectedBlock: MermaidBlock | null;
}

export function Toolbar({ selectedBlock }: Props) {
  const { analyze, refactor, isLoading } = useAIAgent();
  const { addBlock } = useBoard();

  const handleAnalyze = () => {
    if (selectedBlock) {
      analyze(selectedBlock.code);
    }
  };

  const handleRefactor = () => {
    if (selectedBlock) {
      refactor(selectedBlock.code);
    }
  };

  const handleAddBlock = () => {
    addBlock({
      id: nanoid(),
      code: "graph TD\n  A[Start] --> B[End]",
      position: { x: 100, y: 100 },
      size: { width: 400, height: 300 },
      lastValidCode: "",
    });
  };

  return (
    <div className="toolbar">
      <button onClick={handleAddBlock}>+ Add Block</button>
      <button onClick={handleAnalyze} disabled={!selectedBlock || isLoading}>
        Analyze
      </button>
      <button onClick={handleRefactor} disabled={!selectedBlock || isLoading}>
        Refactor
      </button>
    </div>
  );
}
```

#### Acceptance Criteria

**Rule-Based Criteria (Checklist)**:
- [ ] Add Block button creates new Mermaid block
- [ ] Analyze button triggers AI analysis
- [ ] Refactor button triggers AI refactoring
- [ ] Buttons disabled when no block selected
- [ ] Loading state disables buttons

---

## Phase 4: Features & Polish (Tasks T-013 to T-016)

### T-013: Implement Presence and AI Cursor

**Task ID**: T-013
**Task Name**: Implement User Presence and AI Cursor Animation
**Priority**: Medium
**Estimated Hours**: 3h

#### Context & Background

**Source PRP Document**: `docs/prps/livecanvas-ai-mvp.md` - Section "Task 13: Implement Presence and AI Cursor"

**Feature Overview**: Show other users' cursors on the canvas and display an animated AI cursor when the agent is "thinking".

**Task Purpose**:
**As a** user
**I need** to see other collaborators and AI presence
**So that** I understand who is working on the board

**Dependencies**:
- **Prerequisite Tasks**: T-009 (Awareness hook), T-005 (AI cursor broadcast)
- **Parallel Tasks**: T-014, T-015
- **Integration Points**: Yjs Awareness, BoardRoom AI cursor messages

#### Implementation Details

**Files to Create**:
```
apps/web/src/components/
├── Presence.tsx     - User list and cursors
└── AICursor.tsx     - Animated AI cursor
```

**Key Implementation Steps**:
1. Create Presence component showing user list
2. Render user cursors on canvas
3. Create animated AI cursor component
4. Listen for ai-cursor WebSocket messages

**Code Patterns**:
```typescript
// apps/web/src/components/AICursor.tsx
import { useEffect, useState } from "react";
import type { Position } from "@live-canvas/protocols";

interface Props {
  position: Position | null;
  state: "thinking" | "idle";
}

export function AICursor({ position, state }: Props) {
  if (!position || state === "idle") return null;

  return (
    <div
      className="ai-cursor"
      style={{ left: position.x, top: position.y }}
    >
      <div className={`cursor-icon ${state}`}>
        <svg>...</svg>
      </div>
      <span className="cursor-label">AI Assistant</span>
      {state === "thinking" && (
        <span className="thinking-indicator">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </span>
      )}
    </div>
  );
}
```

#### Acceptance Criteria

**Given-When-Then Scenarios**:
```gherkin
Scenario 1: See other user cursors
  Given two users on the same board
  When User A moves their cursor
  Then User B sees User A's cursor with name label

Scenario 2: AI cursor shows during processing
  Given I click Analyze
  When the AI is processing
  Then an animated AI cursor appears on the canvas
  And shows "thinking" animation

Scenario 3: AI cursor hides when done
  Given the AI is processing
  When the AI completes
  Then the AI cursor disappears
```

**Rule-Based Criteria (Checklist)**:
- [ ] User cursors render with names and colors
- [ ] AI cursor appears during AI operations
- [ ] Thinking animation plays while processing
- [ ] Cursors update in real-time

---

### T-014: Implement Settings Modal

**Task ID**: T-014
**Task Name**: Implement Settings Modal for API Keys
**Priority**: High
**Estimated Hours**: 2h

#### Context & Background

**Source PRP Document**: `docs/prps/livecanvas-ai-mvp.md` - Section "Task 14: Implement Settings Modal"

**Feature Overview**: Create a settings modal where users can configure their LLM API keys, stored in localStorage.

**Task Purpose**:
**As a** user
**I need** to configure my API keys
**So that** I can use AI features with my own credentials

**Dependencies**:
- **Prerequisite Tasks**: T-008 (Frontend)
- **Parallel Tasks**: T-013, T-015
- **Integration Points**: useSettings hook, AI routes

#### Implementation Details

**Files to Create**:
```
apps/web/src/
├── components/
│   └── SettingsModal.tsx  - API key configuration
└── hooks/
    └── useSettings.ts     - localStorage persistence
```

**Key Implementation Steps**:
1. Create useSettings hook with localStorage
2. Create SettingsModal component
3. Add provider selector (OpenAI, Anthropic, Gemini)
4. Validate API key format

**Code Patterns**:
```typescript
// apps/web/src/hooks/useSettings.ts
import { useState, useEffect, useCallback } from "react";

interface Settings {
  provider: "openai" | "anthropic" | "gemini";
  apiKey: string;
}

const STORAGE_KEY = "livecanvas-settings";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { provider: "openai", apiKey: "" };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  return { settings, updateSettings };
}
```

#### Acceptance Criteria

**Given-When-Then Scenarios**:
```gherkin
Scenario 1: Save API key
  Given I open the settings modal
  When I enter my OpenAI API key and click Save
  Then the key is stored in localStorage
  And persists across page reloads

Scenario 2: Switch providers
  Given I have an Anthropic API key
  When I select Anthropic as provider
  Then AI requests use Anthropic API
```

**Rule-Based Criteria (Checklist)**:
- [ ] Modal opens/closes correctly
- [ ] API key input works for all providers
- [ ] Settings persist in localStorage
- [ ] Provider selection works

---

### T-015: Implement Block Editor

**Task ID**: T-015
**Task Name**: Implement Inline Mermaid Block Editor
**Priority**: Medium
**Estimated Hours**: 2h

#### Context & Background

**Source PRP Document**: `docs/prps/livecanvas-ai-mvp.md` - Section "Task 15: Implement Block Editor"

**Feature Overview**: Create an inline editor for Mermaid code within blocks, allowing direct code editing.

**Task Purpose**:
**As a** user
**I need** to edit Mermaid code directly
**So that** I can make manual adjustments to diagrams

**Dependencies**:
- **Prerequisite Tasks**: T-010 (MermaidBlock)
- **Parallel Tasks**: T-013, T-014
- **Integration Points**: MermaidBlock component, useBoard hook

#### Implementation Details

**Files to Create**:
```
apps/web/src/components/
└── BlockEditor.tsx  - Inline Mermaid editor
```

**Key Implementation Steps**:
1. Create textarea-based editor
2. Add toggle between view/edit modes
3. Debounce updates to Yjs
4. Show live preview (optional)

**Code Patterns**:
```typescript
// apps/web/src/components/BlockEditor.tsx
import { useState, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";

interface Props {
  code: string;
  onChange: (code: string) => void;
  onClose: () => void;
}

export function BlockEditor({ code, onChange, onClose }: Props) {
  const [localCode, setLocalCode] = useState(code);

  const debouncedUpdate = useDebouncedCallback((value: string) => {
    onChange(value);
  }, 500);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalCode(e.target.value);
    debouncedUpdate(e.target.value);
  };

  return (
    <div className="block-editor">
      <div className="editor-header">
        <span>Edit Mermaid</span>
        <button onClick={onClose}>Done</button>
      </div>
      <textarea
        value={localCode}
        onChange={handleChange}
        spellCheck={false}
        autoFocus
      />
    </div>
  );
}
```

#### Acceptance Criteria

**Given-When-Then Scenarios**:
```gherkin
Scenario 1: Edit mode activates
  Given a diagram block
  When I double-click the block
  Then the code editor opens

Scenario 2: Changes sync
  Given I'm editing code
  When I make changes
  Then the changes sync to other users
  And the diagram re-renders
```

**Rule-Based Criteria (Checklist)**:
- [ ] Double-click opens editor
- [ ] Code changes are debounced
- [ ] Changes sync via Yjs
- [ ] Done button closes editor

---

### T-016: Integration Testing and Polish

**Task ID**: T-016
**Task Name**: Integration Testing, Bug Fixes, and Polish
**Priority**: Critical
**Estimated Hours**: 4h

#### Context & Background

**Source PRP Document**: `docs/prps/livecanvas-ai-mvp.md` - Section "Final Validation Checklist"

**Feature Overview**: Final integration testing, bug fixes, and UI polish to ensure MVP is production-ready.

**Task Purpose**:
**As a** developer
**I need** to verify all features work together
**So that** the MVP is ready for deployment

**Dependencies**:
- **Prerequisite Tasks**: All previous tasks (T-001 to T-015)
- **Parallel Tasks**: None
- **Integration Points**: All components and systems

#### Implementation Details

**Key Implementation Steps**:
1. Run full integration test suite
2. Fix any discovered bugs
3. Add final UI polish
4. Verify deployment works
5. Update documentation

**Test Checklist**:
```bash
# Manual test sequence
1. Open localhost:5173 - verify redirect to /board/:id
2. Open same URL in second browser - verify presence
3. Add a block - verify appears in both browsers
4. Type in chat - verify AI generates diagram
5. Click Analyze - verify streaming response
6. Click Refactor - verify suggestions
7. Apply patch - verify diagram updates
8. Enter invalid Mermaid - verify auto-fix
9. Open settings - verify API key saves
10. Refresh page - verify state persists
```

#### Acceptance Criteria

**Given-When-Then Scenarios**:
```gherkin
Scenario 1: Full user flow works
  Given a fresh browser
  When I complete the test checklist
  Then all 10 test items pass

Scenario 2: Two users collaborate
  Given two browsers on the same board
  When User A makes changes
  Then User B sees changes in < 100ms

Scenario 3: Deployment succeeds
  Given all tests pass locally
  When I deploy to Cloudflare
  Then the app is accessible at production URL
  And all features work in production
```

**Rule-Based Criteria (Checklist)**:
- [ ] All 10 manual test items pass
- [ ] No console errors in browser
- [ ] TypeScript compiles: `pnpm turbo typecheck`
- [ ] Lint passes: `pnpm turbo lint`
- [ ] Build succeeds: `pnpm turbo build`
- [ ] Worker deploys successfully
- [ ] Frontend deploys to Pages
- [ ] Real-time sync < 100ms
- [ ] AI streaming works with all providers

---

## Dependency Graph

```
T-001 (Monorepo)
  |
  +---> T-002 (Protocols) ----+
  |                           |
  +---> T-003 (AI Providers) -+---> T-004 (Worker Setup)
                              |           |
                              |           +---> T-005 (BoardRoom DO)
                              |           |           |
                              |           +---> T-006 (API Routes) <--- T-007 (Prompts)
                              |           |
                              +---> T-008 (Frontend Setup)
                                          |
                                          +---> T-009 (Yjs Hooks)
                                          |           |
                                          |           +---> T-010 (Canvas/Mermaid)
                                          |           |           |
                                          |           +---> T-011 (Chat/AI Response)
                                          |                       |
                                          |                       +---> T-012 (Toolbar)
                                          |
                                          +---> T-013 (Presence/AI Cursor)
                                          |
                                          +---> T-014 (Settings)
                                          |
                                          +---> T-015 (Block Editor)
                                                      |
                                                      v
                                              T-016 (Integration)
```

## Critical Path

The critical path determines the minimum time to completion:

**T-001 -> T-002 -> T-004 -> T-005 -> T-009 -> T-010 -> T-011 -> T-016**

**Critical Path Duration**: ~24-28 hours

## Parallelization Opportunities

| Parallel Group | Tasks | Combined Duration |
|----------------|-------|-------------------|
| Foundation | T-002 + T-003 | 3-4h (run together) |
| Backend | T-006 + T-007 | 3-4h (run together) |
| Frontend Features | T-013 + T-014 + T-015 | 4h (run together) |

## Resource Recommendations

**Optimal Team Structure**:
- 1 Full-stack developer (can handle all tasks)
- Or split: 1 Backend dev (T-004-T-007) + 1 Frontend dev (T-008-T-015)

**Recommended Sequencing**:
1. Day 1-2: T-001 through T-005 (Foundation + Backend core)
2. Day 3-4: T-006 through T-010 (API routes + Frontend core)
3. Day 5-6: T-011 through T-015 (Features)
4. Day 7: T-016 (Integration and polish)

---

*Task breakdown generated 2026-01-26*
*Source: docs/prps/livecanvas-ai-mvp.md*
