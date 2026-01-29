-- LiveCanvas D1 Database Schema
-- Migration: 0001_init

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

-- Activity log (for analytics)
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
