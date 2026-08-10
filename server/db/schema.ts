export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'free',
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  original_filename   TEXT NOT NULL,
  status              TEXT NOT NULL,
  error               TEXT,
  size_bytes          INTEGER NOT NULL,
  source_container    TEXT,
  source_video_codec  TEXT,
  source_audio_codec  TEXT,
  width               INTEGER,
  height              INTEGER,
  fps                 REAL,
  duration_seconds    REAL,
  bitrate             INTEGER,
  is_hdr              INTEGER NOT NULL DEFAULT 0,
  rotation            INTEGER NOT NULL DEFAULT 0,
  was_converted       INTEGER NOT NULL DEFAULT 0,
  delivery_size_bytes INTEGER,
  stored_bytes        INTEGER,
  has_hls             INTEGER NOT NULL DEFAULT 0,
  has_poster          INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT NOT NULL,
  ready_at            TEXT
);

CREATE INDEX IF NOT EXISTS idx_media_user ON media(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS jobs (
  id          TEXT PRIMARY KEY,
  media_id    TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  stage       TEXT NOT NULL,
  status      TEXT NOT NULL,
  progress    REAL NOT NULL DEFAULT 0,
  error       TEXT,
  created_at  TEXT NOT NULL,
  finished_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_jobs_media ON jobs(media_id);

CREATE TABLE IF NOT EXISTS share_links (
  id            TEXT PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  media_id      TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT,
  expires_at    TEXT,
  max_views     INTEGER,
  views         INTEGER NOT NULL DEFAULT 0,
  revoked       INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_share_media ON share_links(media_id);

CREATE TABLE IF NOT EXISTS playback_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  media_id    TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  share_id    TEXT,
  type        TEXT NOT NULL,
  percent     REAL NOT NULL DEFAULT 0,
  seconds     REAL NOT NULL DEFAULT 0,
  viewer_hash TEXT NOT NULL,
  device      TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_media ON playback_events(media_id, created_at);
`;
