# PRP: LiveCanvas AI MVP

**Version:** 1.0.0
**Date:** 2026-01-26
**Status:** Ready for Implementation

---

## Discovery Summary

### Initial Task Analysis

Build an open-source real-time collaborative canvas platform where AI agents understand, validate, and operate architecture diagrams (Mermaid-based) alongside human users. The MVP targets a 1-week delivery using Cloudflare-native architecture.

### User Clarifications Received

| Question | Answer | Impact |
|----------|--------|--------|
| Input mechanism for "Text to Mermaid"? | **Inline + Chat** | Chat lateral for commands + inline Mermaid editing |
| Board creation/sharing flow? | **Auto-generate URL** | `/board/{id}` routes, share link to collaborate |
| LLM API key storage? | **Settings modal + localStorage** | Client-side key management, persists across sessions |
| AI analysis display location? | **Below diagram** | Dedicated section under canvas for AI responses |
| Invalid Mermaid syntax handling? | **AI auto-fix** | Automatically request AI to correct syntax errors |
| Diagrams per board? | **Multiple blocks** | Free-form canvas with multiple Mermaid blocks |
| AI presence visualization? | **Cursor animado** | AI has animated cursor showing when "analyzing" |

### Missing Requirements Identified

All critical requirements clarified through user questions. Ready for implementation.

---

## Goal

Build a **production-ready MVP** of LiveCanvas AI that demonstrates the core value proposition:

> Two users open the same board → one types text → AI generates Mermaid → both see diagram in real-time → Analyze → Refactor → apply patch → AI visible as participant with animated cursor

---

## Why

- **Business Value:** First open-source AI-native collaborative diagramming tool
- **User Impact:** Reduce friction from "mouse drawing" to "text description" for architects
- **Problem Solved:** No existing tool combines real-time collaboration + AI assistance + architecture diagramming
- **Target Users:** Staff AI Engineers, Software Architects, Solution Architects, AI/Agent Developers

---

## What

### User-Visible Behavior

1. **Board Access:** Visit `/board/{auto-generated-id}` to create/access a board
2. **Multiple Mermaid Blocks:** Add, position, and edit multiple diagram blocks on canvas
3. **Chat Interface:** Side panel for AI commands (generate, analyze, refactor)
4. **Inline Editing:** Direct Mermaid code editing with live preview
5. **AI Responses:** Below-diagram section showing AI analysis and suggestions
6. **Real-time Collaboration:** See other users' cursors and changes instantly
7. **AI Presence:** Animated AI cursor indicating when agent is "thinking"
8. **Settings:** Modal for configuring LLM API keys (stored in localStorage)

### Success Criteria

- [ ] Canvas renders multiple Mermaid diagram blocks
- [ ] Text input generates valid Mermaid via AI
- [ ] Analyze button explains current diagram architecture
- [ ] Refactor button suggests improvements with diff
- [ ] Apply patch updates diagram with one click
- [ ] Two browser tabs sync state < 100ms
- [ ] AI cursor animates during processing
- [ ] Invalid syntax triggers AI auto-fix
- [ ] Settings persist API keys in localStorage
- [ ] Builds and deploys to Cloudflare

---

## All Needed Context

### Research Phase Summary

- **Codebase patterns found:** Greenfield project - templates only, no existing code
- **External research needed:** Yes - Cloudflare Durable Objects, Yjs, Mermaid React, Turborepo
- **Knowledge gaps identified:** All resolved through external research

### Documentation & References

```yaml
# MUST READ - Critical for implementation

# Cloudflare Durable Objects
- url: https://developers.cloudflare.com/durable-objects/
  why: Core architecture for real-time collaboration

- url: https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation-server/
  why: WebSocket handling pattern with hibernation
  critical: Use acceptWebSocket(), serializeAttachment(), hibernation handlers

- url: https://developers.cloudflare.com/durable-objects/api/alarms/
  why: Cleanup scheduling for inactive boards
  critical: Don't call setAlarm in constructor without checking existing alarms

# Yjs CRDT Integration
- url: https://github.com/napolab/y-durableobjects
  why: Yjs + Durable Objects integration library
  critical: Requires Hono 4.3+, exports YDurableObjects class

- url: https://docs.yjs.dev/getting-started/adding-awareness
  why: Cursor presence implementation
  critical: setLocalStateField for user/cursor, awareness.on('change')

# Mermaid.js
- url: https://mermaid.ai/open-source/config/usage.html
  why: Programmatic diagram rendering
  critical: startOnLoad: false, async render, bindFunctions for interactivity

- url: https://www.npmjs.com/package/react-x-mermaid
  why: React component for Mermaid

# Turborepo
- url: https://developers.cloudflare.com/workers/ci-cd/builds/advanced-setups/
  why: Monorepo setup with Cloudflare Workers

# LLM Streaming
- url: https://developers.cloudflare.com/workers/examples/openai-sdk-streaming/
  why: OpenAI streaming in Workers

- url: https://github.com/anthropics/anthropic-sdk-typescript
  why: Anthropic SDK streaming patterns

# Brainstorming Document
- docfile: docs/brainstorming/2026-01-26-livecanvas-ai-mvp.md
  why: Full architecture decisions, event contracts, success criteria
```

### Current Codebase Tree

```bash
live-canvas-ai/
├── docs/
│   ├── architecture/
│   │   ├── api/           (empty)
│   │   ├── decisions/     (empty)
│   │   └── diagrams/      (empty)
│   ├── brainstorming/
│   │   └── 2026-01-26-livecanvas-ai-mvp.md
│   ├── prps/
│   │   └── livecanvas-ai-mvp.md (this file)
│   ├── tasks/             (empty)
│   └── templates/
│       ├── architecture/  (templates)
│       ├── e2e-tests/     (templates)
│       ├── brainstorming_session_template.md
│       ├── prp_document_template.md
│       └── technical-task-template.md
```

### Desired Codebase Tree

```bash
live-canvas-ai/
├── apps/
│   ├── web/                          # Cloudflare Pages - React Frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Canvas.tsx        # Main canvas container
│   │   │   │   ├── MermaidBlock.tsx  # Single Mermaid diagram block
│   │   │   │   ├── ChatPanel.tsx     # AI chat interface (side panel)
│   │   │   │   ├── AIResponse.tsx    # AI response display (below diagram)
│   │   │   │   ├── Toolbar.tsx       # Action buttons (Analyze, Refactor)
│   │   │   │   ├── Presence.tsx      # User cursors and presence
│   │   │   │   ├── AICursor.tsx      # Animated AI cursor
│   │   │   │   ├── SettingsModal.tsx # API key configuration
│   │   │   │   └── BlockEditor.tsx   # Inline Mermaid editor
│   │   │   ├── hooks/
│   │   │   │   ├── useYjs.ts         # Yjs document and provider
│   │   │   │   ├── useAwareness.ts   # Presence awareness
│   │   │   │   ├── useAIAgent.ts     # AI interaction logic
│   │   │   │   ├── useBoard.ts       # Board state management
│   │   │   │   └── useSettings.ts    # localStorage settings
│   │   │   ├── lib/
│   │   │   │   ├── websocket.ts      # WebSocket connection manager
│   │   │   │   ├── mermaid.ts        # Mermaid rendering utilities
│   │   │   │   └── api.ts            # API client for AI endpoints
│   │   │   ├── types/
│   │   │   │   └── index.ts          # Frontend-specific types
│   │   │   ├── App.tsx               # Main app with routing
│   │   │   ├── main.tsx              # Entry point
│   │   │   └── index.css             # Global styles
│   │   ├── public/
│   │   │   └── favicon.ico
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── worker/                       # Cloudflare Workers - Backend
│       ├── src/
│       │   ├── index.ts              # Hono app entry point
│       │   ├── durable-objects/
│       │   │   └── BoardRoom.ts      # Durable Object for board state
│       │   ├── routes/
│       │   │   ├── board.ts          # Board WebSocket upgrade
│       │   │   ├── analyze.ts        # POST /api/analyze
│       │   │   ├── refactor.ts       # POST /api/refactor
│       │   │   ├── generate.ts       # POST /api/generate
│       │   │   └── fix-syntax.ts     # POST /api/fix-syntax
│       │   └── lib/
│       │       ├── ai-client.ts      # Multi-provider AI client
│       │       ├── prompts.ts        # AI prompt templates
│       │       └── streaming.ts      # Streaming response utilities
│       ├── package.json
│       ├── tsconfig.json
│       └── wrangler.toml
│
├── packages/
│   ├── protocols/                    # Shared types and contracts
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── events.ts             # Canvas-Agent event types
│   │   │   ├── messages.ts           # WebSocket message types
│   │   │   ├── board.ts              # Board and block types
│   │   │   └── ai.ts                 # AI request/response types
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ai-providers/                 # LLM provider abstraction
│       ├── src/
│       │   ├── index.ts
│       │   ├── types.ts              # Provider interface
│       │   ├── openai.ts             # OpenAI implementation
│       │   ├── anthropic.ts          # Anthropic implementation
│       │   └── gemini.ts             # Google Gemini implementation
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                             # (existing documentation)
├── .gitignore
├── .prettierrc
├── .eslintrc.cjs
├── package.json                      # Root monorepo config
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.json                     # Root TypeScript config
└── README.md
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Cloudflare Durable Objects
// - Don't call setAlarm() in constructor without checking existing alarms
// - Use WebSocket Hibernation API to avoid duration charges
// - serializeAttachment() for session data that survives hibernation

// CRITICAL: Yjs + Durable Objects
// - y-durableobjects requires Hono 4.3+
// - Yjs storage has 128KiB limit per key (auto-chunked by library)
// - Awareness requires separate setLocalStateField calls for user and cursor

// CRITICAL: Mermaid.js
// - Must set startOnLoad: false for programmatic rendering
// - Use mermaid.render() not mermaid.init()
// - bindFunctions() required after render for click handlers
// - securityLevel: 'loose' only if click handlers needed

// CRITICAL: LLM Streaming in Workers
// - CPU time limit is 50ms but wall-clock unlimited while streaming
// - Use waitUntil() to ensure stream completes
// - Don't buffer large responses in memory - use TransformStream

// CRITICAL: Turborepo
// - Export raw TypeScript from packages, don't pre-compile
// - Use workspace:* for internal dependencies
```

---

## Implementation Blueprint

### Data Models and Structure

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
  lastValidCode: string; // Fallback for invalid syntax
}

export interface Position {
  x: number;
  y: number;
}

// packages/protocols/src/events.ts

export interface BoardStateUpdate {
  type: "board.state.update";
  boardId: string;
  blocks: MermaidBlock[];
  selection: string[]; // Selected block IDs
  intent?: string; // User's intent for AI
}

export interface ProposePatch {
  name: "propose_patch";
  arguments: {
    blockId: string;
    mermaid: string;
    reason: string;
    changes: string[];
  };
}

// packages/protocols/src/messages.ts

export type WebSocketMessage =
  | { type: "sync"; data: Uint8Array }
  | { type: "awareness"; data: Uint8Array }
  | { type: "ai-cursor"; position: Position; state: "thinking" | "idle" }
  | { type: "ai-response"; content: string; done: boolean };

// packages/protocols/src/ai.ts

export interface AIRequest {
  action: "generate" | "analyze" | "refactor" | "fix-syntax";
  mermaid?: string;
  prompt?: string;
  provider: "openai" | "anthropic" | "gemini";
  apiKey: string;
}

export interface AIResponse {
  success: boolean;
  content?: string;
  mermaid?: string;
  error?: string;
}

// User presence types
export interface UserPresence {
  id: string;
  name: string;
  color: string;
  cursor: Position | null;
}

export interface AIPresence {
  id: "ai-agent";
  name: "AI Assistant";
  cursor: Position | null;
  state: "thinking" | "idle";
}
```

### List of Tasks

```yaml
Task 1:
  name: "Scaffold Monorepo Structure"
  CREATE package.json:
    - Root monorepo configuration with Turborepo
    - Scripts: dev, build, lint, typecheck
  CREATE pnpm-workspace.yaml:
    - Define apps/* and packages/* workspaces
  CREATE turbo.json:
    - Configure build, dev, deploy tasks
    - Set up proper dependencies
  CREATE tsconfig.json:
    - Root TypeScript configuration
    - Path aliases for packages
  CREATE .gitignore, .prettierrc, .eslintrc.cjs

Task 2:
  name: "Create Protocols Package"
  CREATE packages/protocols/package.json:
    - Export raw TypeScript
  CREATE packages/protocols/src/index.ts:
    - Export all types
  CREATE packages/protocols/src/events.ts:
    - BoardStateUpdate, ProposePatch types
  CREATE packages/protocols/src/messages.ts:
    - WebSocket message types
  CREATE packages/protocols/src/board.ts:
    - Board, MermaidBlock types
  CREATE packages/protocols/src/ai.ts:
    - AIRequest, AIResponse types

Task 3:
  name: "Create AI Providers Package"
  CREATE packages/ai-providers/package.json:
    - Dependencies: openai, @anthropic-ai/sdk, @google/generative-ai
  CREATE packages/ai-providers/src/types.ts:
    - AIProvider interface
  CREATE packages/ai-providers/src/openai.ts:
    - OpenAI streaming implementation
  CREATE packages/ai-providers/src/anthropic.ts:
    - Anthropic streaming implementation
  CREATE packages/ai-providers/src/gemini.ts:
    - Gemini implementation
  CREATE packages/ai-providers/src/index.ts:
    - Factory function for provider selection

Task 4:
  name: "Setup Cloudflare Worker"
  CREATE apps/worker/package.json:
    - Dependencies: hono, y-durableobjects, yjs
    - DevDeps: wrangler, @cloudflare/workers-types
  CREATE apps/worker/wrangler.toml:
    - Durable Objects binding for BoardRoom
    - Migration with new_sqlite_classes
  CREATE apps/worker/tsconfig.json
  CREATE apps/worker/src/index.ts:
    - Hono app with routes

Task 5:
  name: "Implement BoardRoom Durable Object"
  CREATE apps/worker/src/durable-objects/BoardRoom.ts:
    - EXTEND YDurableObjects from y-durableobjects
    - WebSocket hibernation handlers
    - AI cursor state broadcasting
    - Alarm for cleanup

Task 6:
  name: "Implement Worker API Routes"
  CREATE apps/worker/src/routes/board.ts:
    - WebSocket upgrade to Durable Object
  CREATE apps/worker/src/routes/analyze.ts:
    - POST /api/analyze - explain diagram
  CREATE apps/worker/src/routes/refactor.ts:
    - POST /api/refactor - suggest improvements
  CREATE apps/worker/src/routes/generate.ts:
    - POST /api/generate - text to Mermaid
  CREATE apps/worker/src/routes/fix-syntax.ts:
    - POST /api/fix-syntax - auto-fix invalid Mermaid

Task 7:
  name: "Implement AI Prompts and Client"
  CREATE apps/worker/src/lib/prompts.ts:
    - ANALYZE_PROMPT, REFACTOR_PROMPT, GENERATE_PROMPT, FIX_SYNTAX_PROMPT
  CREATE apps/worker/src/lib/ai-client.ts:
    - Multi-provider streaming client
  CREATE apps/worker/src/lib/streaming.ts:
    - TransformStream utilities for responses

Task 8:
  name: "Setup React Frontend"
  CREATE apps/web/package.json:
    - Dependencies: react, react-dom, yjs, y-websocket, mermaid
    - DevDeps: vite, @vitejs/plugin-react, typescript
  CREATE apps/web/vite.config.ts:
    - Cloudflare Pages compatible config
  CREATE apps/web/tsconfig.json
  CREATE apps/web/index.html
  CREATE apps/web/src/main.tsx
  CREATE apps/web/src/App.tsx:
    - Router with /board/:id route
  CREATE apps/web/src/index.css:
    - Base styles, dark theme

Task 9:
  name: "Implement Yjs and WebSocket Hooks"
  CREATE apps/web/src/hooks/useYjs.ts:
    - Y.Doc initialization
    - WebSocket provider connection
  CREATE apps/web/src/hooks/useAwareness.ts:
    - User presence state
    - Cursor tracking
  CREATE apps/web/src/hooks/useBoard.ts:
    - Board state from Y.Doc
    - Block CRUD operations
  CREATE apps/web/src/lib/websocket.ts:
    - WebSocket connection manager

Task 10:
  name: "Implement Canvas and MermaidBlock"
  CREATE apps/web/src/components/Canvas.tsx:
    - Container for multiple blocks
    - Drag and drop positioning
  CREATE apps/web/src/components/MermaidBlock.tsx:
    - Mermaid rendering with react-x-mermaid
    - Error handling with AI auto-fix trigger
    - Selection state
  CREATE apps/web/src/lib/mermaid.ts:
    - Mermaid initialization
    - Render utilities

Task 11:
  name: "Implement Chat Panel and AI Response"
  CREATE apps/web/src/components/ChatPanel.tsx:
    - Text input for AI commands
    - Message history
    - Generate button
  CREATE apps/web/src/components/AIResponse.tsx:
    - Display area below diagram
    - Streaming response display
    - Apply patch button
  CREATE apps/web/src/hooks/useAIAgent.ts:
    - AI API calls
    - Streaming response handling

Task 12:
  name: "Implement Toolbar and Actions"
  CREATE apps/web/src/components/Toolbar.tsx:
    - Analyze button
    - Refactor button
    - Add block button
  CREATE apps/web/src/lib/api.ts:
    - API client for /api/* endpoints
    - Streaming fetch utilities

Task 13:
  name: "Implement Presence and AI Cursor"
  CREATE apps/web/src/components/Presence.tsx:
    - User list
    - User cursors on canvas
  CREATE apps/web/src/components/AICursor.tsx:
    - Animated AI cursor
    - Thinking state indicator

Task 14:
  name: "Implement Settings Modal"
  CREATE apps/web/src/components/SettingsModal.tsx:
    - API key input per provider
    - Provider selection
    - Save to localStorage
  CREATE apps/web/src/hooks/useSettings.ts:
    - localStorage persistence
    - Settings context

Task 15:
  name: "Implement Block Editor"
  CREATE apps/web/src/components/BlockEditor.tsx:
    - Inline Mermaid code editor
    - Syntax highlighting (optional)
    - Live preview toggle

Task 16:
  name: "Integration and Polish"
  MODIFY apps/web/src/App.tsx:
    - Wire all components together
  MODIFY apps/worker/src/index.ts:
    - Ensure all routes registered
  TEST: Manual verification of all flows
  FIX: Any integration issues
```

### Per Task Pseudocode

#### Task 5: BoardRoom Durable Object

```typescript
// apps/worker/src/durable-objects/BoardRoom.ts
import { YDurableObjects } from "y-durableobjects";

export class BoardRoom extends YDurableObjects<Env> {
  private aiCursorState: { position: Position | null; state: "thinking" | "idle" } = {
    position: null,
    state: "idle"
  };

  // PATTERN: Override to add AI cursor broadcasting
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    // Let parent handle Yjs sync
    await super.webSocketMessage(ws, message);

    // CUSTOM: Handle AI cursor updates
    if (typeof message === "string") {
      const parsed = JSON.parse(message);
      if (parsed.type === "ai-cursor") {
        this.aiCursorState = parsed;
        this.broadcastAICursor();
      }
    }
  }

  private broadcastAICursor() {
    const message = JSON.stringify({
      type: "ai-cursor",
      ...this.aiCursorState
    });

    for (const ws of this.ctx.getWebSockets()) {
      if (ws.readyState === WebSocket.READY_STATE_OPEN) {
        ws.send(message);
      }
    }
  }

  // PATTERN: Set AI cursor state from API routes
  setAICursorState(state: "thinking" | "idle", position?: Position) {
    this.aiCursorState = { position: position || null, state };
    this.broadcastAICursor();
  }
}
```

#### Task 6: Analyze Route

```typescript
// apps/worker/src/routes/analyze.ts
import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { ANALYZE_PROMPT } from "../lib/prompts";
import { createAIClient } from "../lib/ai-client";

export const analyzeRoute = new Hono<{ Bindings: Env }>();

analyzeRoute.post("/", async (c) => {
  const { mermaid, provider, apiKey } = await c.req.json<AIRequest>();

  // PATTERN: Get BoardRoom to update AI cursor
  const boardId = c.req.header("X-Board-Id");
  if (boardId) {
    const id = c.env.BOARD_ROOM.idFromName(boardId);
    const room = c.env.BOARD_ROOM.get(id);
    await room.setAICursorState("thinking");
  }

  const client = createAIClient(provider, apiKey);
  const prompt = ANALYZE_PROMPT.replace("{{MERMAID}}", mermaid);

  return streamText(c, async (stream) => {
    try {
      for await (const chunk of client.stream(prompt)) {
        await stream.write(chunk);
      }
    } finally {
      // Reset AI cursor when done
      if (boardId) {
        const id = c.env.BOARD_ROOM.idFromName(boardId);
        const room = c.env.BOARD_ROOM.get(id);
        await room.setAICursorState("idle");
      }
    }
  });
});
```

#### Task 10: MermaidBlock Component

```typescript
// apps/web/src/components/MermaidBlock.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import mermaid from "mermaid";
import { useAIAgent } from "../hooks/useAIAgent";

// CRITICAL: Initialize outside component
mermaid.initialize({ startOnLoad: false, theme: "dark" });

interface MermaidBlockProps {
  id: string;
  code: string;
  position: Position;
  selected: boolean;
  onSelect: () => void;
  onCodeChange: (code: string) => void;
}

export function MermaidBlock({ id, code, position, selected, onSelect, onCodeChange }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { fixSyntax, isFixing } = useAIAgent();

  useEffect(() => {
    const render = async () => {
      if (!code.trim()) {
        setSvg("");
        setError(null);
        return;
      }

      try {
        const { svg: svgCode } = await mermaid.render(`mermaid-${id}`, code);
        setSvg(svgCode);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid syntax");
        // PATTERN: Auto-fix on error (per user requirements)
        const fixed = await fixSyntax(code);
        if (fixed && fixed !== code) {
          onCodeChange(fixed);
        }
      }
    };

    render();
  }, [code, id, fixSyntax, onCodeChange]);

  return (
    <div
      className={`mermaid-block ${selected ? "selected" : ""}`}
      style={{ left: position.x, top: position.y }}
      onClick={onSelect}
    >
      {error && !isFixing ? (
        <div className="error">
          <span>Syntax Error - AI fixing...</span>
        </div>
      ) : (
        <div ref={containerRef} dangerouslySetInnerHTML={{ __html: svg }} />
      )}
    </div>
  );
}
```

### Integration Points

```yaml
# Backend Integration Points
DURABLE_OBJECTS:
  binding: BOARD_ROOM
  class: BoardRoom
  migration: new_sqlite_classes

API_ROUTES:
  pattern: Hono router composition
  routes:
    - GET /board/:id (WebSocket upgrade)
    - POST /api/analyze
    - POST /api/refactor
    - POST /api/generate
    - POST /api/fix-syntax

CONFIG:
  wrangler.toml:
    - Durable Objects bindings
    - Compatibility date
  environment:
    - No server-side secrets (BYOK model)

# Frontend Integration Points
ROUTING:
  add to: apps/web/src/App.tsx
  pattern: React Router v6
  routes:
    - / -> redirect to /board/:newId
    - /board/:id -> Board component

STATE_MANAGEMENT:
  pattern: Yjs + React hooks
  shared_state:
    - Y.Doc for board data
    - Awareness for presence
  local_state:
    - Settings in localStorage
    - UI state in React state

WEBSOCKET:
  connection: wss://{worker-url}/board/:id
  protocol: Yjs sync + custom messages
  reconnect: Auto-reconnect on disconnect

STYLES:
  pattern: CSS modules or Tailwind
  theme: Dark mode default
```

---

## Validation Loop

### Level 1: Syntax & Style

```bash
# Run these FIRST - fix any errors before proceeding

# TypeScript type checking (all packages)
pnpm turbo typecheck

# Linting
pnpm turbo lint

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Build Validation

```bash
# Build all packages
pnpm turbo build

# Build worker specifically
pnpm --filter worker build

# Expected: All builds succeed
```

### Level 3: Local Development

```bash
# Start all dev servers
pnpm turbo dev

# Or individually:
pnpm --filter web dev          # Frontend at localhost:5173
pnpm --filter worker dev       # Worker at localhost:8787

# Expected: Both servers start without errors
```

### Level 4: Integration Testing

```bash
# Manual test checklist:
# 1. Open localhost:5173 - should redirect to /board/:id
# 2. Open same URL in second tab - should see presence
# 3. Type in chat panel - should trigger AI (with API key set)
# 4. Edit Mermaid code - should render or auto-fix
# 5. Click Analyze - should show explanation below
# 6. Click Refactor - should show suggestions
# 7. Apply patch - should update diagram
```

---

## Final Validation Checklist

- [ ] All packages type-check: `pnpm turbo typecheck`
- [ ] No linting errors: `pnpm turbo lint`
- [ ] All builds succeed: `pnpm turbo build`
- [ ] Worker deploys: `pnpm --filter worker deploy`
- [ ] Frontend deploys to Pages: Manual or CI
- [ ] WebSocket connects and syncs
- [ ] AI streaming works with all providers
- [ ] Presence shows multiple users
- [ ] AI cursor animates during processing
- [ ] Settings persist in localStorage
- [ ] Invalid syntax triggers auto-fix

---

## Anti-Patterns to Avoid

- Do not pre-compile TypeScript packages - export raw TS
- Do not call setAlarm() in Durable Object constructor without checking
- Do not buffer large AI responses - use TransformStream
- Do not use mermaid.init() - use mermaid.render()
- Do not forget startOnLoad: false for Mermaid
- Do not hardcode API keys - use localStorage BYOK model
- Do not skip error handling for WebSocket disconnects
- Do not ignore Yjs awareness updates for presence
- Do not create new patterns - follow y-durableobjects examples

---

## Confidence Score

**Score: 8/10**

**Reasoning:**
- (+) Clear architecture with well-documented Cloudflare patterns
- (+) y-durableobjects library handles complex Yjs sync
- (+) Mermaid rendering is straightforward
- (+) User requirements fully clarified
- (+) All external documentation researched
- (-) Multiple blocks canvas positioning adds complexity
- (-) AI cursor animation needs custom implementation
- (-) First time integrating all these pieces together

**Recommendations for implementation:**
1. Start with single block, add multi-block after core works
2. Test WebSocket + Yjs sync early
3. Get AI streaming working before UI polish
4. Leave AI cursor animation for last polish

---

## Task Breakdown Document

See: `docs/tasks/livecanvas-ai-mvp.md` (to be generated)

---

*PRP generated on 2026-01-26*
*Based on brainstorming session and user clarifications*
