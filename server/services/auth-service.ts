import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import type { Account, PlanId } from "@shared/types.js";
import { config } from "../config.js";
import { db } from "../db/index.js";
import { conflict, unauthorized } from "../lib/errors.js";
import { getUsage } from "./media-service.js";

export interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  plan: PlanId;
  created_at: string;
}

export const SESSION_COOKIE = "af_session";

export function toAccount(user: UserRow): Account {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    createdAt: user.created_at,
    usage: getUsage(user.id),
  };
}

export async function register(input: { email: string; password: string; name: string }): Promise<UserRow> {
  const email = input.email.trim().toLowerCase();
  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
  if (existing) throw conflict("An account with that email already exists.", "email_taken");

  const user: UserRow = {
    id: nanoid(12),
    email,
    name: input.name.trim() || email.split("@")[0]!,
    password_hash: await bcrypt.hash(input.password, 12),
    plan: "free",
    created_at: new Date().toISOString(),
  };

  db.prepare(
    `INSERT INTO users (id, email, name, password_hash, plan, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(user.id, user.email, user.name, user.password_hash, user.plan, user.created_at);

  return user;
}

export async function verifyCredentials(email: string, password: string): Promise<UserRow> {
  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.trim().toLowerCase()) as
    | UserRow
    | undefined;

  // The hash comparison runs even when the account is missing so that a wrong
  // email and a wrong password take the same amount of time to answer.
  const hash = user?.password_hash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
  const matches = await bcrypt.compare(password, hash);
  if (!user || !matches) throw unauthorized("That email and password do not match.");

  return user;
}

export function createSession(userId: string): string {
  const id = nanoid(32);
  const expiresAt = new Date(Date.now() + config.sessionTtlDays * 86_400_000).toISOString();
  db.prepare(`INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)`).run(
    id,
    userId,
    expiresAt,
    new Date().toISOString(),
  );
  return id;
}

export function findUserBySession(sessionId: string): UserRow | null {
  const row = db
    .prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > ?`,
    )
    .get(sessionId, new Date().toISOString()) as UserRow | undefined;
  return row ?? null;
}

export function destroySession(sessionId: string): void {
  db.prepare(`DELETE FROM sessions WHERE id = ?`).run(sessionId);
}

export function updateProfile(userId: string, input: { name?: string; plan?: PlanId }): void {
  if (input.name !== undefined) db.prepare(`UPDATE users SET name = ? WHERE id = ?`).run(input.name, userId);
  if (input.plan !== undefined) db.prepare(`UPDATE users SET plan = ? WHERE id = ?`).run(input.plan, userId);
}
