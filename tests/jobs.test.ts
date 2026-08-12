import { describe, expect, it } from "vitest";
import { backoffDelay } from "../server/jobs/queue.js";
import { signPayload, verifySignature } from "../server/services/webhook-service.js";

describe("retry backoff", () => {
  it("grows with each attempt", () => {
    const first = backoffDelay(1);
    const fourth = backoffDelay(4);
    expect(fourth).toBeGreaterThan(first);
  });

  it("stays inside the jitter window", () => {
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      const base = Math.min(2_000 * 2 ** (attempt - 1), 300_000);
      const delay = backoffDelay(attempt);

      expect(delay).toBeGreaterThanOrEqual(base * 0.75);
      expect(delay).toBeLessThanOrEqual(base * 1.25);
    }
  });

  it("never exceeds the five minute ceiling", () => {
    expect(backoffDelay(50)).toBeLessThanOrEqual(300_000 * 1.25);
  });

  it("does not return the same delay every time", () => {
    const delays = new Set(Array.from({ length: 20 }, () => backoffDelay(3)));
    expect(delays.size).toBeGreaterThan(1);
  });
});

describe("webhook signatures", () => {
  const secret = "whsec_test";
  const body = JSON.stringify({ event: "video.ready", data: { mediaId: "abc" } });

  it("verifies a signature it just produced", () => {
    const timestamp = Math.floor(Date.now() / 1000);
    expect(verifySignature(secret, signPayload(secret, timestamp, body), body)).toBe(true);
  });

  it("rejects a tampered payload", () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const header = signPayload(secret, timestamp, body);
    expect(verifySignature(secret, header, `${body} `)).toBe(false);
  });

  it("rejects a signature made with a different secret", () => {
    const timestamp = Math.floor(Date.now() / 1000);
    expect(verifySignature(secret, signPayload("whsec_other", timestamp, body), body)).toBe(false);
  });

  it("rejects a replayed signature that is too old", () => {
    const stale = Math.floor(Date.now() / 1000) - 3_600;
    expect(verifySignature(secret, signPayload(secret, stale, body), body)).toBe(false);
  });
});
