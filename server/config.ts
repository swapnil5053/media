import path from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

const isProduction = process.env.NODE_ENV === "production";
const dataDir = path.resolve(process.env.DATA_DIR ?? "./data");

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set in production.");
}

export const config = {
  isProduction,
  port: Number(process.env.PORT ?? 8000),
  appUrl: process.env.APP_URL ?? `http://localhost:${process.env.PORT ?? 8000}`,
  sessionSecret: process.env.SESSION_SECRET ?? "development-only-secret",
  dataDir,
  mediaDir: path.join(dataDir, "media"),
  databaseFile: path.join(dataDir, "adaptflow.db"),
  /** Transcoding is CPU-bound, so the default leaves a core for the web server. */
  workerConcurrency: Number(process.env.WORKER_CONCURRENCY ?? 2),
  sessionTtlDays: 30,
  /** How long a viewer keeps access to segment URLs after opening a share link. */
  watchTokenTtlSeconds: 60 * 60 * 4,
} as const;
