import type { Database } from "better-sqlite3";
import { logger } from "../lib/logger.js";

interface Migration {
  version: number;
  name: string;
  up: string;
}

/**
 * Migrations are applied in order and tracked with SQLite's user_version, so an
 * existing database upgrades in place instead of needing to be thrown away.
 */
const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: "initial schema",
    up: `
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
    `,
  },
  {
    version: 2,
    name: "durable job queue",
    up: `
      DROP TABLE IF EXISTS jobs;

      CREATE TABLE IF NOT EXISTS job_queue (
        id           TEXT PRIMARY KEY,
        type         TEXT NOT NULL,
        payload      TEXT NOT NULL,
        media_id     TEXT,
        user_id      TEXT,
        priority     INTEGER NOT NULL DEFAULT 100,
        status       TEXT NOT NULL DEFAULT 'queued',
        stage        TEXT NOT NULL DEFAULT 'queued',
        progress     REAL NOT NULL DEFAULT 0,
        attempts     INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3,
        run_at       TEXT NOT NULL,
        error        TEXT,
        worker       TEXT,
        created_at   TEXT NOT NULL,
        started_at   TEXT,
        finished_at  TEXT,
        duration_ms  INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_queue_claim ON job_queue(status, priority, run_at);
      CREATE INDEX IF NOT EXISTS idx_queue_media ON job_queue(media_id, created_at DESC);
    `,
  },
  {
    version: 3,
    name: "fingerprints, storyboards and captions",
    up: `
      CREATE TABLE IF NOT EXISTS captions (
        id         TEXT PRIMARY KEY,
        media_id   TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
        label      TEXT NOT NULL,
        language   TEXT NOT NULL,
        cue_count  INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_captions_media ON captions(media_id);
    `,
  },
  {
    version: 4,
    name: "api keys and webhooks",
    up: `
      CREATE TABLE IF NOT EXISTS api_keys (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name         TEXT NOT NULL,
        prefix       TEXT NOT NULL,
        token_hash   TEXT NOT NULL,
        last_used_at TEXT,
        created_at   TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_keys_user ON api_keys(user_id);

      CREATE TABLE IF NOT EXISTS webhooks (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        url        TEXT NOT NULL,
        secret     TEXT NOT NULL,
        active     INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id          TEXT PRIMARY KEY,
        webhook_id  TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
        event       TEXT NOT NULL,
        status_code INTEGER,
        ok          INTEGER NOT NULL DEFAULT 0,
        attempts    INTEGER NOT NULL DEFAULT 0,
        error       TEXT,
        created_at  TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_deliveries_hook ON webhook_deliveries(webhook_id, created_at DESC);
    `,
  },
];

/** ALTER TABLE has no IF NOT EXISTS, so columns are checked before being added. */
const ADDED_COLUMNS: Array<{ table: string; column: string; ddl: string }> = [
  { table: "media", column: "phash", ddl: "phash TEXT" },
  { table: "media", column: "has_sprite", ddl: "has_sprite INTEGER NOT NULL DEFAULT 0" },
  { table: "media", column: "duplicate_of", ddl: "duplicate_of TEXT" },
];

export function migrate(db: Database): void {
  const current = db.pragma("user_version", { simple: true }) as number;

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;

    db.exec("BEGIN");
    try {
      db.exec(migration.up);
      db.pragma(`user_version = ${migration.version}`);
      db.exec("COMMIT");
      logger.info("migration applied", { version: migration.version, name: migration.name });
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  for (const { table, column, ddl } of ADDED_COLUMNS) {
    const columns = db.pragma(`table_info(${table})`) as Array<{ name: string }>;
    if (columns.some((existing) => existing.name === column)) continue;

    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
    logger.info("column added", { table, column });
  }
}
