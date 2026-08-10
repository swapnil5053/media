import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";

export function sign(value: string): string {
  const mac = createHmac("sha256", config.sessionSecret).update(value).digest("base64url");
  return `${value}.${mac}`;
}

export function unsign(signed: string): string | null {
  const index = signed.lastIndexOf(".");
  if (index < 1) return null;

  const value = signed.slice(0, index);
  const expected = createHmac("sha256", config.sessionSecret).update(value).digest("base64url");
  const received = signed.slice(index + 1);
  if (expected.length !== received.length) return null;

  return timingSafeEqual(Buffer.from(expected), Buffer.from(received)) ? value : null;
}

/**
 * Viewers are counted without storing anything that identifies them: the IP and
 * user agent are salted with the app secret and immediately discarded.
 */
export function viewerFingerprint(ip: string, userAgent: string): string {
  return createHash("sha256").update(`${config.sessionSecret}:${ip}:${userAgent}`).digest("hex").slice(0, 32);
}
