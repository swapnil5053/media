import fs from "node:fs";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../server/app.js";
import { config } from "../server/config.js";

const app = createApp();
const account = { email: `swapnil+${Date.now()}@example.com`, password: "correct-horse", name: "Swapnil" };

let cookie = "";

beforeAll(async () => {
  const response = await request(app).post("/api/auth/signup").send(account);
  expect(response.status).toBe(201);
  cookie = response.headers["set-cookie"]![0]!;
});

afterAll(() => {
  fs.rmSync(config.dataDir, { recursive: true, force: true });
});

describe("auth", () => {
  it("rejects a short password", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send({ email: "short@example.com", password: "123", name: "Short" });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("8 characters");
  });

  it("refuses a duplicate email", async () => {
    const response = await request(app).post("/api/auth/signup").send(account);
    expect(response.status).toBe(409);
  });

  it("gives the same answer for a wrong password and an unknown account", async () => {
    const wrongPassword = await request(app)
      .post("/api/auth/signin")
      .send({ email: account.email, password: "not-it-at-all" });
    const unknownUser = await request(app)
      .post("/api/auth/signin")
      .send({ email: "nobody@example.com", password: "not-it-at-all" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.body.error).toBe(unknownUser.body.error);
  });

  it("returns the signed-in account", async () => {
    const response = await request(app).get("/api/auth/me").set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(account.email);
    expect(response.body.plan).toBe("free");
    expect(response.body).not.toHaveProperty("password_hash");
  });
});

describe("media access", () => {
  it("requires a session to list media", async () => {
    const response = await request(app).get("/api/media");
    expect(response.status).toBe(401);
  });

  it("starts with an empty library", async () => {
    const response = await request(app).get("/api/media").set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("does not leak another account's video", async () => {
    const response = await request(app).get("/api/media/some-other-id").set("Cookie", cookie);
    expect(response.status).toBe(404);
  });

  it("refuses to stream a video without a session or a share grant", async () => {
    const response = await request(app).get("/api/stream/any-id/video.mp4");
    expect(response.status).toBe(404);
  });
});

describe("sharing", () => {
  it("reports a missing link as not found", async () => {
    const response = await request(app).post("/api/shares/does-not-exist/open").send({});
    expect(response.status).toBe(404);
  });

  it("validates share settings before creating a link", async () => {
    const response = await request(app)
      .post("/api/shares")
      .set("Cookie", cookie)
      .send({ mediaId: "abc", password: "no" });

    expect(response.status).toBe(400);
  });
});

describe("health", () => {
  it("answers on /api/health", async () => {
    const response = await request(app).get("/api/health");
    expect(response.body).toEqual({ status: "ok" });
  });
});
