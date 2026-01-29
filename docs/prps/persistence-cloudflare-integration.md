# PRP: Persistência e Integração Cloudflare

**Version:** 1.0.0
**Date:** 2026-01-27
**Status:** Draft

---

## Goal

Implementar persistência completa para LiveCanvas AI utilizando o ecossistema Cloudflare, garantindo que:
- Boards persistam entre sessões
- Usuários possam listar e gerenciar seus boards
- Sistema seja escalável e production-ready

---

## Cloudflare Services Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLOUDFLARE ECOSYSTEM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   PAGES      │    │   WORKERS    │    │   D1         │                  │
│  │   (Frontend) │───▶│   (API)      │───▶│   (SQLite)   │                  │
│  │              │    │              │    │              │                  │
│  │  - React App │    │  - Hono API  │    │  - boards    │                  │
│  │  - Static    │    │  - Auth      │    │  - users     │                  │
│  └──────────────┘    │  - Routes    │    │  - activity  │                  │
│                      └──────┬───────┘    └──────────────┘                  │
│                             │                                               │
│                             ▼                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   DURABLE    │    │     KV       │    │     R2       │                  │
│  │   OBJECTS    │    │   (Cache)    │    │   (Storage)  │                  │
│  │              │    │              │    │              │                  │
│  │  - BoardRoom │    │  - Sessions  │    │  - Exports   │                  │
│  │  - Yjs State │    │  - Rate Limit│    │  - Thumbnails│                  │
│  │  - WebSocket │    │  - API Cache │    │  - Backups   │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   QUEUES     │    │  WORKERS AI  │    │  VECTORIZE   │                  │
│  │  (Jobs)      │    │  (Optional)  │    │  (Optional)  │                  │
│  │              │    │              │    │              │                  │
│  │  - Cleanup   │    │  - Fallback  │    │  - Diagram   │                  │
│  │  - Notify    │    │    LLM       │    │    Search    │                  │
│  │  - Export    │    │  - Embedding │    │              │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Core Persistence (Priority: HIGH)
**Objetivo:** Boards não perdem dados após desconexão

| Component | Service | Description |
|-----------|---------|-------------|
| Yjs State | Durable Objects | Usar `y-durableobjects` para persistir documento |
| Board Registry | D1 | Tabela de boards com metadata |
| User Sessions | KV | Session tokens, anonymous IDs |

### Phase 2: User Management (Priority: MEDIUM)
**Objetivo:** Usuários podem listar e gerenciar boards

| Component | Service | Description |
|-----------|---------|-------------|
| User Accounts | D1 | Tabela de usuários (opcional, pode ser anônimo) |
| Board Ownership | D1 | Relação user ↔ boards |
| Colaboradores | D1 | Permissões de acesso |

### Phase 3: Advanced Features (Priority: LOW)
**Objetivo:** Features de produção

| Component | Service | Description |
|-----------|---------|-------------|
| Export PNG/SVG | R2 | Armazenar exports |
| Thumbnails | R2 + Images | Preview de boards |
| Cleanup Jobs | Queues | Limpar boards órfãos |
| Search | Vectorize | Busca semântica de diagramas |

---

## D1 Database Schema

```sql
-- Board registry
CREATE TABLE boards (
  id TEXT PRIMARY KEY,
  name TEXT DEFAULT 'Untitled Board',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT, -- anonymous ID or user ID
  is_public INTEGER DEFAULT 1,
  thumbnail_url TEXT,
  block_count INTEGER DEFAULT 0
);

-- Index for listing user's boards
CREATE INDEX idx_boards_created_by ON boards(created_by);
CREATE INDEX idx_boards_updated_at ON boards(updated_at DESC);

-- Board collaborators (for future sharing)
CREATE TABLE board_collaborators (
  board_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor', -- 'owner', 'editor', 'viewer'
  added_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (board_id, user_id),
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- Activity log (opcional - para analytics)
CREATE TABLE board_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id TEXT NOT NULL,
  user_id TEXT,
  action TEXT NOT NULL, -- 'created', 'edited', 'shared', 'exported'
  metadata TEXT, -- JSON extra data
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE INDEX idx_activity_board ON board_activity(board_id);
CREATE INDEX idx_activity_created ON board_activity(created_at DESC);
```

---

## Updated wrangler.toml

```toml
name = "live-canvas-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# Durable Objects
[durable_objects]
bindings = [
  { name = "BOARD_ROOM", class_name = "BoardRoom" }
]

[[migrations]]
tag = "v1"
new_sqlite_classes = ["BoardRoom"]

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "livecanvas-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# KV Namespace
[[kv_namespaces]]
binding = "KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# R2 Bucket (Phase 3)
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "livecanvas-assets"

# Queues (Phase 3)
[[queues.producers]]
binding = "JOBS_QUEUE"
queue = "livecanvas-jobs"

[[queues.consumers]]
queue = "livecanvas-jobs"
max_batch_size = 10
max_batch_timeout = 30

# Environment variables
[vars]
ENVIRONMENT = "development"
```

---

## API Routes

### Board Management

```yaml
# List user's boards
GET /api/boards
  Query: ?limit=20&offset=0
  Response: { boards: Board[], total: number }

# Create new board
POST /api/boards
  Body: { name?: string }
  Response: { id: string, name: string }

# Get board details
GET /api/boards/:id
  Response: Board | 404

# Update board metadata
PATCH /api/boards/:id
  Body: { name?: string, is_public?: boolean }
  Response: Board

# Delete board
DELETE /api/boards/:id
  Response: 204 | 404

# WebSocket connection (existing)
GET /board/:id/ws
  Upgrade: websocket
```

---

## Implementation Tasks

### Task 1: Install y-durableobjects
```bash
pnpm --filter worker add y-durableobjects yjs
```

### Task 2: Refactor BoardRoom to use YDurableObjects
```typescript
// apps/worker/src/durable-objects/BoardRoom.ts
import { YDurableObjects } from "y-durableobjects";
import type { Position } from "@live-canvas/protocols";

interface Env {
  BOARD_ROOM: DurableObjectNamespace;
  DB: D1Database;
  KV: KVNamespace;
}

export class BoardRoom extends YDurableObjects<Env> {
  private aiCursorState = { position: null, state: "idle" };

  // Override to add custom message handling
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    // Let parent handle Yjs sync + persistence
    await super.webSocketMessage(ws, message);

    // Handle custom messages (AI cursor, etc.)
    if (typeof message === "string") {
      try {
        const parsed = JSON.parse(message);
        if (parsed.type === "ai-cursor") {
          this.aiCursorState = parsed;
          this.broadcastAICursor();
        }
      } catch {
        // Not JSON, already handled by parent
      }
    }
  }

  // Update board metadata in D1 when document changes
  async onDocumentUpdate() {
    const boardId = this.ctx.id.toString();
    await this.env.DB.prepare(
      "UPDATE boards SET updated_at = unixepoch(), block_count = ? WHERE id = ?"
    ).bind(this.getBlockCount(), boardId).run();
  }

  private getBlockCount(): number {
    const doc = this.getYDoc();
    const blocks = doc.getArray("blocks");
    return blocks.length;
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

  setAICursorState(state: "thinking" | "idle", position?: Position) {
    this.aiCursorState = { position: position || null, state };
    this.broadcastAICursor();
  }
}
```

### Task 3: Create D1 migrations
```bash
# Create database
wrangler d1 create livecanvas-db

# Create migration
wrangler d1 migrations create livecanvas-db init

# Apply migration
wrangler d1 migrations apply livecanvas-db
```

### Task 4: Add Board API routes
```typescript
// apps/worker/src/routes/boards.ts
import { Hono } from "hono";

export const boardsRoute = new Hono<{ Bindings: Env }>();

// List boards
boardsRoute.get("/", async (c) => {
  const userId = c.req.header("X-User-Id") || "anonymous";
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = parseInt(c.req.query("offset") || "0");

  const result = await c.env.DB.prepare(`
    SELECT * FROM boards
    WHERE created_by = ? OR is_public = 1
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `).bind(userId, limit, offset).all();

  const total = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM boards
    WHERE created_by = ? OR is_public = 1
  `).bind(userId).first<{ count: number }>();

  return c.json({
    boards: result.results,
    total: total?.count || 0
  });
});

// Create board
boardsRoute.post("/", async (c) => {
  const { name } = await c.req.json<{ name?: string }>();
  const userId = c.req.header("X-User-Id") || "anonymous";
  const id = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO boards (id, name, created_by) VALUES (?, ?, ?)
  `).bind(id, name || "Untitled Board", userId).run();

  return c.json({ id, name: name || "Untitled Board" }, 201);
});

// Get board
boardsRoute.get("/:id", async (c) => {
  const id = c.req.param("id");
  const board = await c.env.DB.prepare(
    "SELECT * FROM boards WHERE id = ?"
  ).bind(id).first();

  if (!board) {
    return c.json({ error: "Board not found" }, 404);
  }

  return c.json(board);
});

// Delete board
boardsRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.req.header("X-User-Id");

  // Verify ownership
  const board = await c.env.DB.prepare(
    "SELECT created_by FROM boards WHERE id = ?"
  ).bind(id).first<{ created_by: string }>();

  if (!board) {
    return c.json({ error: "Board not found" }, 404);
  }

  if (board.created_by !== userId) {
    return c.json({ error: "Not authorized" }, 403);
  }

  await c.env.DB.prepare("DELETE FROM boards WHERE id = ?").bind(id).run();

  return c.body(null, 204);
});
```

### Task 5: Update Frontend - Board List Page
```typescript
// apps/web/src/pages/Home.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";

interface Board {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
  block_count: number;
}

export function Home() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const res = await fetch("/api/boards", {
        headers: { "X-User-Id": settings.userId || "anonymous" }
      });
      const data = await res.json();
      setBoards(data.boards);
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async () => {
    const res = await fetch("/api/boards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": settings.userId || "anonymous"
      },
      body: JSON.stringify({ name: "New Board" })
    });
    const { id } = await res.json();
    navigate(`/board/${id}`);
  };

  return (
    <div className="home-page">
      <header>
        <h1>LiveCanvas AI</h1>
        <button onClick={createBoard} className="btn btn-primary">
          + New Board
        </button>
      </header>

      <div className="boards-grid">
        {boards.map(board => (
          <div
            key={board.id}
            className="board-card"
            onClick={() => navigate(`/board/${board.id}`)}
          >
            <div className="board-thumbnail" />
            <h3>{board.name}</h3>
            <p>{board.block_count} blocks</p>
            <small>
              Updated {new Date(board.updated_at * 1000).toLocaleDateString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Task 6: KV for Sessions/Anonymous Users
```typescript
// apps/worker/src/middleware/user.ts
import { createMiddleware } from "hono/factory";

export const userMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    let userId = c.req.header("X-User-Id");

    // Generate anonymous user ID if not provided
    if (!userId) {
      userId = `anon_${crypto.randomUUID()}`;

      // Store in KV with 30-day expiration
      await c.env.KV.put(`user:${userId}`, JSON.stringify({
        created: Date.now(),
        type: "anonymous"
      }), { expirationTtl: 60 * 60 * 24 * 30 });
    }

    c.set("userId", userId);
    await next();
  }
);
```

---

## Summary: Cloudflare Services Used

| Service | Purpose | Phase |
|---------|---------|-------|
| **Pages** | Frontend hosting | Already using |
| **Workers** | API backend | Already using |
| **Durable Objects** | Real-time sync + Yjs persistence | Phase 1 |
| **D1** | Board registry, users, permissions | Phase 1 |
| **KV** | Sessions, anonymous users, caching | Phase 1 |
| **R2** | Export storage, thumbnails | Phase 3 |
| **Queues** | Background jobs (cleanup) | Phase 3 |
| **Workers AI** | Fallback LLM (optional) | Future |
| **Vectorize** | Diagram search (optional) | Future |

---

## Verification Checklist

### Phase 1
- [ ] `y-durableobjects` installed and configured
- [ ] BoardRoom extends YDurableObjects
- [ ] D1 database created with schema
- [ ] Boards persist after all users disconnect
- [ ] Board metadata syncs to D1
- [ ] Anonymous user ID generated and stored in KV

### Phase 2
- [ ] `/api/boards` returns user's boards
- [ ] Home page shows board list
- [ ] Create new board works
- [ ] Delete board works
- [ ] Board name editable

### Phase 3
- [ ] Export to PNG saves to R2
- [ ] Thumbnails generated
- [ ] Cleanup queue removes orphan boards

---

## Estimated Effort

| Phase | Tasks | Estimate |
|-------|-------|----------|
| Phase 1 | 4 tasks | 4-6 hours |
| Phase 2 | 3 tasks | 3-4 hours |
| Phase 3 | 3 tasks | 4-6 hours |

**Total MVP (Phase 1+2):** ~8-10 hours

---

*PRP generated on 2026-01-27*
