import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { config } from "../config.js";
import { requireUser } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import {
  SESSION_COOKIE,
  createSession,
  destroySession,
  register,
  toAccount,
  updateProfile,
  verifyCredentials,
} from "../services/auth-service.js";

const credentials = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
  name: z.string().max(80).optional(),
});

const signIn = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

const profile = z.object({
  name: z.string().min(1).max(80).optional(),
  plan: z.enum(["free", "pro"]).optional(),
});

const attemptLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again in a few minutes.", code: "rate_limited" },
});

export const authRouter = Router();

function setSessionCookie(res: import("express").Response, sessionId: string) {
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    signed: true,
    maxAge: config.sessionTtlDays * 86_400_000,
    path: "/",
  });
}

authRouter.post("/signup", attemptLimiter, validateBody(credentials), async (req, res) => {
  const { email, password, name } = req.body as z.infer<typeof credentials>;
  const user = await register({ email, password, name: name ?? "" });
  setSessionCookie(res, createSession(user.id));
  res.status(201).json(toAccount(user));
});

authRouter.post("/signin", attemptLimiter, validateBody(signIn), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof signIn>;
  const user = await verifyCredentials(email, password);
  setSessionCookie(res, createSession(user.id));
  res.json(toAccount(user));
});

authRouter.post("/signout", (req, res) => {
  const sessionId = req.signedCookies?.[SESSION_COOKIE] as string | undefined;
  if (sessionId) destroySession(sessionId);
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.status(204).end();
});

authRouter.get("/me", (req, res) => {
  res.json(req.user ? toAccount(req.user) : null);
});

authRouter.patch("/me", requireUser, validateBody(profile), (req, res) => {
  const body = req.body as z.infer<typeof profile>;
  updateProfile(req.user!.id, body);
  res.json(toAccount({ ...req.user!, ...(body.name ? { name: body.name } : {}), ...(body.plan ? { plan: body.plan } : {}) }));
});
