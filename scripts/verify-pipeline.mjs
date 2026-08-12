/**
 * End-to-end check of the promise the product makes: an iPhone-style HEVC .MOV
 * goes in, and something every device can play comes out through a share link.
 *
 * Run with the server already built: node scripts/verify-pipeline.mjs
 */
import { execFile, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const PORT = 8199;
const BASE = `http://127.0.0.1:${PORT}`;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "adaptflow-verify-"));
const clipPath = path.join(dataDir, "iphone-clip.mov");

let failures = 0;

function check(label, condition, detail = "") {
  const mark = condition ? "PASS" : "FAIL";
  if (!condition) failures += 1;
  console.log(`  ${mark}  ${label}${detail ? ` — ${detail}` : ""}`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function makeIphoneStyleClip() {
  await run("ffmpeg", [
    "-hide_banner", "-y",
    "-f", "lavfi", "-i", "testsrc=duration=5:size=1280x720:rate=30",
    "-f", "lavfi", "-i", "sine=frequency=440:duration=5",
    "-c:v", "libx265", "-tag:v", "hvc1", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-shortest",
    clipPath,
  ]);
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${BASE}/api/health`);
      if (response.ok) return;
    } catch {
      // not listening yet
    }
    await sleep(500);
  }
  throw new Error("Server never became healthy");
}

function cookiesFrom(response) {
  return (response.headers.getSetCookie?.() ?? []).map((cookie) => cookie.split(";")[0]).join("; ");
}

async function main() {
  console.log("Building an HEVC .MOV that Android cannot play...");
  await makeIphoneStyleClip();

  const server = spawn("node", ["dist/server.mjs"], {
    env: { ...process.env, NODE_ENV: "production", PORT: String(PORT), DATA_DIR: dataDir, SESSION_SECRET: "verify" },
    stdio: "inherit",
  });

  try {
    await waitForServer();

    console.log("\nAccount and upload");
    const signup = await fetch(`${BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `verify-${Date.now()}@example.com`, password: "correct-horse", name: "Verify" }),
    });
    check("account created", signup.status === 201);
    const session = cookiesFrom(signup);

    const form = new FormData();
    form.append("file", new Blob([fs.readFileSync(clipPath)]), "beach trip.mov");
    const upload = await fetch(`${BASE}/api/media`, { method: "POST", headers: { Cookie: session }, body: form });
    check("upload accepted", upload.status === 202);
    const { id: mediaId } = await upload.json();

    let media = null;
    for (let attempt = 0; attempt < 90; attempt += 1) {
      media = await (await fetch(`${BASE}/api/media/${mediaId}`, { headers: { Cookie: session } })).json();
      if (media.status === "ready" || media.status === "failed") break;
      await sleep(1_000);
    }

    console.log("\nConversion");
    check("processing finished", media.status === "ready", media.error ?? media.status);
    check("source detected as HEVC in a MOV", media.source?.videoCodec === "hevc" && media.source?.container === "mov");
    check("file was converted", media.wasConverted === true);
    check("original would fail somewhere", media.compatibility?.sourceScore < 100, `${media.compatibility?.sourceScore}/100`);
    check("delivery reaches every target", media.compatibility?.deliveryScore === 100);
    check(
      "android was one of the blocked targets",
      media.compatibility?.targets.some((target) => target.id === "android-chrome" && !target.supported),
    );
    check("adaptive ladder produced", media.hasHls === true);
    check("storyboard produced", media.hasStoryboard === true);

    console.log("\nDuplicate detection");
    const secondForm = new FormData();
    secondForm.append("file", new Blob([fs.readFileSync(clipPath)]), "beach trip copy.mov");
    const second = await fetch(`${BASE}/api/media`, { method: "POST", headers: { Cookie: session }, body: secondForm });
    const { id: duplicateId } = await second.json();

    let duplicate = null;
    for (let attempt = 0; attempt < 90; attempt += 1) {
      duplicate = await (await fetch(`${BASE}/api/media/${duplicateId}`, { headers: { Cookie: session } })).json();
      if (duplicate.status === "ready" || duplicate.status === "failed") break;
      await sleep(1_000);
    }
    check("re-upload flagged as a duplicate", duplicate.duplicateOf?.id === mediaId);

    console.log("\nCaptions");
    const captionForm = new FormData();
    captionForm.append(
      "file",
      new Blob(["1\n00:00:01,000 --> 00:00:03,000\nHello from SubRip.\n"]),
      "subs.srt",
    );
    captionForm.append("label", "English");
    captionForm.append("language", "en");
    const caption = await fetch(`${BASE}/api/media/${mediaId}/captions`, {
      method: "POST",
      headers: { Cookie: session },
      body: captionForm,
    });
    check("srt accepted and converted", caption.status === 201);

    console.log("\nSharing and access control");
    const share = await fetch(`${BASE}/api/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: session },
      body: JSON.stringify({ mediaId, password: "family" }),
    });
    const { slug } = await share.json();

    const noPassword = await fetch(`${BASE}/api/shares/${slug}/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    check("password is enforced", noPassword.status === 401);

    const opened = await fetch(`${BASE}/api/shares/${slug}/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "family" }),
    });
    check("correct password opens the link", opened.status === 200);
    const viewer = cookiesFrom(opened);
    const payload = await opened.json();
    check("viewer is told what it was converted from", payload.convertedFrom === "HEVC");
    check("caption track is offered to the viewer", payload.captions.length === 1);

    const mp4 = await fetch(`${BASE}${payload.mp4Url}`, { headers: { Cookie: viewer } });
    check("viewer can stream the mp4", mp4.ok, `${mp4.status} ${mp4.headers.get("content-type")}`);

    const stranger = await fetch(`${BASE}${payload.mp4Url}`);
    check("stranger without a grant is refused", stranger.status === 403);

    const traversal = await fetch(`${BASE}/api/stream/${mediaId}/hls/..%2F..%2F..%2Fetc%2Fpasswd`, {
      headers: { Cookie: viewer },
    });
    check("path traversal is blocked", traversal.status === 403 || traversal.status === 404);

    console.log("\nPlatform API");
    const key = await fetch(`${BASE}/api/developer/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: session },
      body: JSON.stringify({ name: "verify" }),
    });
    const { token } = await key.json();
    check("api key issued", typeof token === "string" && token.startsWith("af_live_"));

    const viaKey = await fetch(`${BASE}/api/media`, { headers: { Authorization: `Bearer ${token}` } });
    check("api key authenticates the upload endpoint", viaKey.ok);

    const settingsViaKey = await fetch(`${BASE}/api/developer/keys`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    check("api key cannot manage account settings", settingsViaKey.status === 401);

    const metrics = await (await fetch(`${BASE}/api/system/metrics`)).text();
    check("prometheus metrics are exposed", metrics.includes("adaptflow_jobs_completed_total"));
    check("queue depth is reported", metrics.includes("adaptflow_queue_depth"));
  } finally {
    server.kill("SIGTERM");
    await sleep(500);
    fs.rmSync(dataDir, { recursive: true, force: true });
  }

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
