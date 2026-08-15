# AdaptFlow

**Upload any video. Get one link that plays on every device.**

---

## The problem

A friend on an iPhone sent me a video from a trip. My Samsung S23+ wouldn't open it — no preview, no player, just a file sitting in the chat doing nothing.

Neither of us had done anything wrong. iPhones record HEVC inside a `.MOV`, and plenty of Android phones, browsers and TVs can't decode that combination. The fix is routine if you work with video and invisible if you don't.

**You shouldn't need to know what a codec is to watch a video someone sent you.**

AdaptFlow works out which devices would fail to play a file, converts it so none of them do, packages it for streaming, and hands back one link.

---

## What it does

A stock iPhone `.MOV` plays on **2 of 6** target devices. After AdaptFlow, **6 of 6**.

| | |
|---|---|
| **Check** | Probed with `ffprobe` and scored against six real playback targets, each with the containers, codecs and HDR support it actually handles. You get a per-device reason — "cannot decode HEVC video" — not just a number. |
| **Convert** | H.264 / AAC in a faststart MP4, capped at 1080p, `yuv420p` so 10-bit phone footage stops breaking older decoders. Files that already play everywhere are remuxed, not re-encoded. |
| **Package** | An HLS ladder at 1080p / 720p / 360p in one ffmpeg pass, plus a poster and a storyboard sprite for scrub previews. |
| **Share** | One link. Optional password, expiry and view limit, all enforced on the server. Revocable instantly. |
| **Embed** | `/embed/:slug`, chrome-free, with a copy-ready snippet. |
| **Measure** | Views, unique viewers, completion rate, watch time, device mix. |

Captions (`.srt` or `.vtt`) ride along as a real `<track>` on every player, embeds included.

---

## The parts worth looking at

**The queue lives in SQLite, not in memory.** Workers claim rows inside a transaction, so two can never take the same job. Failures retry with exponential backoff and jitter. Cancelling kills the running ffmpeg process through an `AbortSignal`. `SIGTERM` drains in-flight work before exit, and anything still marked running at boot is requeued — the process that owned it is gone.

**Duplicates are caught by content, not filename.** Four frames per video, reduced to a 9×8 greyscale grid and turned into a difference hash. Each bit compares a pixel with its neighbour, so the hash follows structure rather than brightness: a re-encoded or resized copy of the same footage still matches, and you get warned before it eats your quota.

**Share links don't leak.** Opening one grants a short-lived signed cookie scoped to that single video. That's how HLS segments stay protected without a token in every URL.

**It's a platform, not just a UI.** Hashed API keys (`Bearer af_live_…`) for scripted uploads, and HMAC-signed webhooks for `video.ready` / `video.failed` delivered through the same retrying queue. API keys deliberately cannot touch account settings.

**Screens:** `/` landing · `/library` grid · `/library/:id` player, compatibility report, captions, job history, sharing · `/insights` analytics · `/system` queue · `/settings` plan, API keys, webhooks · `/w/:slug` viewer · `/embed/:slug` iframe

---

## Stack

React 19 · TypeScript (strict, `noUncheckedIndexedAccess`) · Vite 6 · Tailwind v4 · TanStack Query · hls.js
Express 5 · SQLite (better-sqlite3, WAL, versioned migrations) · Zod · bcrypt · ffmpeg · Vitest + Supertest

```
Browser ──► Express 5 ──► SQLite ── users, media, job_queue, share_links,
              │                      playback_events, captions, api_keys, webhooks
              │
              ├──► worker pool ──► ffprobe ──► ffmpeg ──► MP4 + HLS ladder
              │         │                                 + poster + sprite + phash
              │         └──► webhook delivery (HMAC, retried)
              │
              └──► SSE ──► live progress in the UI
```

One process, one container, no external queue or object store.

---

## Running it

Needs Node 22+ and `ffmpeg` / `ffprobe` on your `PATH`.

```bash
npm install
cp .env.example .env.local   # set SESSION_SECRET
npm run dev                  # http://localhost:8000
```

No C++ toolchain required — `better-sqlite3` ships prebuilt binaries, and `package.json` already lists the two packages whose install scripts npm 11 blocks by default.

If npm skips them anyway (it sometimes writes an empty `allowScripts` and still reports success, so the app breaks at runtime rather than at install):

```bash
cd node_modules/better-sqlite3 && npx node-gyp rebuild && cd ../..
node node_modules/esbuild/install.js
```

**Docker**, with ffmpeg baked in:

```bash
echo "SESSION_SECRET=$(openssl rand -hex 32)" > .env
docker compose up --build
```

| Variable | |
|---|---|
| `PORT` | HTTP port, default `8000` |
| `APP_URL` | Public base URL used when building share links |
| `SESSION_SECRET` | Signs session and playback cookies. Required in production |
| `DATA_DIR` | Where SQLite and media files are written |
| `WORKER_CONCURRENCY` | Parallel transcode workers, default `2` |

---

## Tests

```bash
npm test                          # 68 tests
npm run lint                      # tsc --noEmit, strict
node scripts/verify-pipeline.mjs  # 25-check end-to-end run against real ffmpeg
```

Vitest runs two projects: `server` in Node against real SQLite, `ui` in jsdom with Testing Library. The server suite pins the logic worth pinning — the compatibility matrix, the difference hash, the SubRip parser, retry backoff bounds, webhook signature verification including replay rejection. The component suite drives the real screens through their loading, empty, populated and failed states.

`verify-pipeline.mjs` is the honest one, and it runs in CI. It generates a real HEVC `.MOV`, then asserts end to end that it converts, that Android is correctly named as a blocked target, that a ladder and storyboard are produced, that re-uploading the same footage is caught, that a wrong password is refused and a right one works, that a stranger can't stream the file, that path traversal through segment names is blocked, and that an API key can upload but not manage settings.

---

## API

| Method | Route | |
|---|---|---|
| `POST` | `/api/auth/signup` · `/signin` · `/signout` | Sessions in signed httpOnly cookies |
| `GET` `PATCH` | `/api/auth/me` | Account, plan and usage |
| `GET` `POST` | `/api/media` | List, upload (session **or** `Bearer af_live_…`) |
| `GET` `PATCH` `DELETE` | `/api/media/:id` | Detail, rename, delete |
| `POST` | `/api/media/:id/cancel` | Cancel in-flight processing |
| `GET` | `/api/media/:id/jobs` | Stage-by-stage history |
| `POST` `DELETE` | `/api/media/:id/captions` | Add or remove a caption track |
| `GET` | `/api/events` | SSE stream of pipeline progress |
| `POST` `DELETE` | `/api/shares` · `/api/shares/:slug` | Create, revoke |
| `POST` | `/api/shares/:slug/open` | Public: resolve a link, check password |
| `GET` | `/api/stream/:id/*` | Access-checked MP4, HLS, poster, sprite, captions |
| `POST` `GET` | `/api/analytics/events` · `/overview` | Telemetry and aggregates |
| `GET` `POST` `DELETE` | `/api/developer/keys` · `/webhooks` | Platform credentials |
| `GET` | `/api/system/metrics` · `/status` | Prometheus text, queue state |

Verifying a webhook:

```js
const [t, v1] = header.split(",").map((part) => part.split("=")[1]);
const expected = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
// compare with timingSafeEqual, and reject if t is more than 5 minutes old
```

---

## Known limits

- HDR sources are converted to SDR with a straight pixel-format conversion rather than proper tone mapping, so HDR footage loses some highlight detail.
- Workers run inside the web process. That's deliberate for a single-box deployment — the queue is already in the database, so moving them out is a config change, not a rewrite.
- Plans and quotas are enforced, but payment isn't wired up. Switching plans in Settings is immediate.

## License

MIT
