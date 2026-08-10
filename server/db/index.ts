import fs from "node:fs";
import Database from "better-sqlite3";
import { config } from "../config.js";
import { SCHEMA } from "./schema.js";

fs.mkdirSync(config.dataDir, { recursive: true });
fs.mkdirSync(config.mediaDir, { recursive: true });

export const db = new Database(config.databaseFile);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(SCHEMA);

/**
 * Anything left mid-flight when the process died can never finish, so it is
 * surfaced as a failure instead of spinning forever in the UI.
 */
export function recoverInterruptedWork(): void {
  const reset = db.prepare(
    `UPDATE media SET status = 'failed', error = ? WHERE status IN ('probing', 'transcoding')`,
  );
  const changes = reset.run("Processing was interrupted by a server restart").changes;
  if (changes > 0) {
    db.prepare(`UPDATE jobs SET status = 'failed' WHERE status = 'running'`).run();
  }
}
