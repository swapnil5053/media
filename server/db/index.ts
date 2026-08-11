import fs from "node:fs";
import Database from "better-sqlite3";
import { config } from "../config.js";
import { migrate } from "./migrations.js";

fs.mkdirSync(config.dataDir, { recursive: true });
fs.mkdirSync(config.mediaDir, { recursive: true });

export const db = new Database(config.databaseFile);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

migrate(db);
