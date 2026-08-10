import fs from "node:fs";
import path from "node:path";
import express from "express";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { recoverInterruptedWork } from "./db/index.js";
import { logger } from "./lib/logger.js";

async function main() {
  recoverInterruptedWork();

  const app = createApp();

  if (config.isProduction) {
    const clientDir = path.resolve("dist/client");
    app.use(express.static(clientDir, { index: false, maxAge: "1y" }));
    app.get("/*splat", (_req, res) => {
      res.sendFile(path.join(clientDir, "index.html"));
    });
  } else {
    const { createServer } = await import("vite");
    const vite = await createServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  }

  app.listen(config.port, () => {
    logger.info("adaptflow started", {
      port: config.port,
      mode: config.isProduction ? "production" : "development",
      dataDir: config.dataDir,
    });

    if (!fs.existsSync(config.dataDir)) {
      logger.warn("data directory missing", { dataDir: config.dataDir });
    }
  });
}

main().catch((error: unknown) => {
  logger.error("failed to start", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
