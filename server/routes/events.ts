import { Router } from "express";
import { mediaEvents } from "../events/bus.js";
import { requireUser } from "../middleware/auth.js";

export const eventsRouter = Router();

/** Server-sent events replace the old five-second polling loop. */
eventsRouter.get("/", requireUser, (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  res.write(": connected\n\n");

  const unsubscribe = mediaEvents.subscribe(req.user!.id, (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  const heartbeat = setInterval(() => res.write(": ping\n\n"), 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});
