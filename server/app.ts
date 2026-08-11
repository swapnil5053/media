import express from "express";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import { attachUser } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { requestContext } from "./middleware/request-context.js";
import { securityHeaders } from "./middleware/security.js";
import { analyticsRouter } from "./routes/analytics.js";
import { authRouter } from "./routes/auth.js";
import { developerRouter } from "./routes/developer.js";
import { eventsRouter } from "./routes/events.js";
import { mediaRouter } from "./routes/media.js";
import { shareRouter } from "./routes/share.js";
import { streamRouter } from "./routes/stream.js";
import { systemRouter } from "./routes/system.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(requestContext);
  app.use(securityHeaders);
  app.use(express.json({ limit: "256kb" }));
  app.use(cookieParser(config.sessionSecret));
  app.use(attachUser);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/media", mediaRouter);
  app.use("/api/shares", shareRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/stream", streamRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/developer", developerRouter);
  app.use("/api/system", systemRouter);

  app.use("/api", notFoundHandler);
  app.use(errorHandler);

  return app;
}
