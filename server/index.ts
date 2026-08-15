import path from "node:path";
import express from "express";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { registerJobHandlers } from "./jobs/index.js";
import { startWorkers, stopWorkers } from "./jobs/runner.js";
import { logger } from "./lib/logger.js";

async function main() {
  registerJobHandlers();
  startWorkers(config.workerConcurrency);

  const app = createApp();

  if (config.isProduction) {
    const clientDir = path.resolve("dist/client");
    app.use(express.static(clientDir, { index: false, maxAge: "1y" }));

    // "/*splat" alone never matches the bare root in Express 5, so "/" is listed too.
    app.get(["/", "/*splat"], (_req, res) => {
      res.sendFile(path.join(clientDir, "index.html"));
    });
  } else {
    const { createServer } = await import("vite");
    const vite = await createServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  }

  const server = app.listen(config.port, () => {
    logger.info("adaptflow started", {
      port: config.port,
      mode: config.isProduction ? "production" : "development",
      workers: config.workerConcurrency,
      dataDir: config.dataDir,
    });
  });

  // Finish in-flight transcodes before exiting, and requeue whatever cannot finish.
  const shutdown = (signal: string) => {
    logger.info("shutting down", { signal });
    server.close();

    void stopWorkers().then(() => process.exit(0));
    setTimeout(() => process.exit(1), 20_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error: unknown) => {
  logger.error("failed to start", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
