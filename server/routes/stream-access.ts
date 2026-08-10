import type { Request, Response } from "express";
import { config } from "../config.js";

const WATCH_COOKIE = "af_watch";
const MAX_GRANTS = 10;

interface Grant {
  mediaId: string;
  shareId: string;
}

function readGrants(req: Request): Grant[] {
  const raw = req.signedCookies?.[WATCH_COOKIE] as string | undefined;
  if (!raw) return [];

  return raw
    .split("|")
    .map((entry) => entry.split(":"))
    .filter((parts): parts is [string, string] => parts.length === 2)
    .map(([mediaId, shareId]) => ({ mediaId, shareId }));
}

/**
 * Opening a share link grants time-limited access to that video's files. HLS
 * segments are fetched by the player itself, so the grant lives in a cookie
 * rather than a query parameter it would have to append to every request.
 */
export function grantWatchAccess(req: Request, res: Response, grant: Grant): void {
  const grants = [grant, ...readGrants(req).filter((existing) => existing.mediaId !== grant.mediaId)].slice(
    0,
    MAX_GRANTS,
  );

  res.cookie(WATCH_COOKIE, grants.map((entry) => `${entry.mediaId}:${entry.shareId}`).join("|"), {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    signed: true,
    maxAge: config.watchTokenTtlSeconds * 1000,
    path: "/",
  });
}

export function watchGrantFor(req: Request, mediaId: string): Grant | null {
  return readGrants(req).find((grant) => grant.mediaId === mediaId) ?? null;
}
