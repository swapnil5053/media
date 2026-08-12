# AdaptFlow

**Upload any video, get one link that plays on every device.**

A self-hostable video platform: it works out which devices would fail to play your file, converts it so none of them do, packages it for adaptive streaming, and hands you a link — or an API key, if you would rather do it from a script.

## Why I built this

A friend on an iPhone sent me a video from a trip. My Samsung S23+ would not open it — no preview, no player, just a file sitting in the chat doing nothing. Neither of us had done anything wrong. iPhones record in HEVC inside a `.MOV` container, and plenty of Android phones, browsers and TVs cannot decode that combination.

The fix is completely routine if you work with video, and completely invisible if you do not. That gap is the product: **you should not need to know what a codec is to watch a video someone sent you.**

---

## What makes it more than a CRUD app

**A compatibility engine, not a file converter.** Every upload is probed with `ffprobe` and evaluated against a matrix of real playback targets — Android Chrome, iPhone Safari, desktop Chrome/Edge, Firefox, macOS Safari, smart TVs — each with the container, video codec, audio codec and HDR support it can actually handle. The result is a score and a per-device explanation ("Cannot decode HEVC video"). A stock HEVC/MOV from an iPhone reaches **2 of 6** targets; after conversion it reaches **all 6**.

**A durable job queue with a worker pool.** Jobs live in SQLite, not in memory. Workers claim rows inside a transaction so two of them can never take the same job, failures retry with exponential backoff and jitter, paid plans get a lower priority number so they are claimed first, cancellation propagates through an `AbortSignal` that kills the running ffmpeg process, and `SIGTERM` drains in-flight work before exit. Anything still marked running at boot is requeued, because the process that owned it no longer exists.

**Perceptual hashing for duplicate detection.** Four frames are sampled across each video as raw greyscale, reduced to a 9×8 grid, and turned into a difference hash — each bit compares a pixel with its neighbour, so the hash depends on structure rather than brightness. Re-uploads are matched by Hamming distance, which means a re-encoded, resized or recompressed copy of the same footage still gets caught and the user is warned before it eats their quota.

**Real media packaging.** An adaptive HLS ladder (1080p/720p/360p, skipping renditions above the source height) built in a single ffmpeg pass with `split` and `var_stream_map`, plus a 5×5 storyboard sprite and a WebVTT index — which the library uses to animate a preview on hover without downloading any video.

**A platform, not just a UI.** Hashed API keys for programmatic upload (`Bearer af_live_…`), and outbound webhooks for `video.ready` / `video.failed` signed with a timestamped HMAC-SHA256 the receiver recomputes, delivered through the same retrying queue. API keys deliberately cannot touch account settings.

**Observability that is actually wired up.** Prometheus metrics at `/api/system/metrics` (queue depth, job durations as a histogram, HTTP request counts), per-request IDs echoed in `X-Request-Id`, structured JSON logs, and an Activity page in the app showing what is being prepared right now.

---

## Everything it does

| | |
|---|---|
| **Conversion** | H.264 High / AAC in a faststart MP4, capped at 1080p, `yuv420p` so 10-bit phone footage stops breaking older decoders. Files that already play everywhere are remuxed instead of re-encoded. |
| **Streaming** | HLS ladder with a master playlist; native HLS on Safari, `hls.js` elsewhere, progressive MP4 as the fallback. |
| **Captions** | Upload `.srt` or `.vtt`. SubRip is parsed and converted to WebVTT, then rendered as a real `<track>` on every player including the embed. |
| **Sharing** | bcrypt-hashed passwords, expiry, view limits, instant revocation — all enforced server-side. Opening a link grants a short-lived signed cookie scoped to that one video, which is how HLS segments stay protected without a token in every URL. |
| **Embedding** | `/embed/:slug` is a chrome-free iframe target with a copy-ready snippet in the share panel. |
| **Analytics** | Views, unique viewers, completion rate, watch time and device mix, computed from playback events. Viewers are counted by a salted hash of IP and user agent that is never stored reversibly. |
| **Quotas** | Per-plan video count, storage and upload size, enforced before a byte is written. |

## Screens

`/` landing · `/library` uploads and grid · `/library/:id` player, compatibility report, captions, job history, sharing · `/insights` analytics · `/system` activity · `/settings` profile, plan, API keys, webhooks · `/w/:slug` public viewer · `/embed/:slug` iframe

---

## Stack

React 19 · TypeScript (strict, `noUncheckedIndexedAccess`) · Vite 6 · Tailwind CSS v4 · TanStack Query · Recharts · hls.js
Express 5 · SQLite (better-sqlite3, WAL, versioned migrations) · Zod · bcrypt · ffmpeg / ffprobe · Vitest + Supertest

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

**Requirements:** Node 20+ and `ffmpeg`/`ffprobe` on your `PATH`.

```bash
npm install
cp .env.example .env.local     # set SESSION_SECRET
npm run dev                    # http://localhost:8000
```

**Docker** (ffmpeg is baked in):

```bash
echo "SESSION_SECRET=$(openssl rand -hex 32)" > .env
docker compose up --build
```

### Environment

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port, default `8000` |
| `APP_URL` | Public base URL used when building share links |
| `SESSION_SECRET` | Signs session and playback cookies. Required in production |
| `DATA_DIR` | Where SQLite and media files are written |
| `WORKER_CONCURRENCY` | Parallel transcode workers, default `2` |

---

## Tests

```bash
npm test                          # 43 unit and API tests
npm run lint                      # tsc --noEmit, strict
node scripts/verify-pipeline.mjs  # 25-check end-to-end run against real ffmpeg
```

The unit suite covers the pure logic worth pinning down: the compatibility matrix, the difference hash (a uniform brightness shift must not change it; a reversed gradient must flip all 64 bits), the SubRip parser, retry backoff bounds and jitter, and webhook signature verification including replay rejection.

`scripts/verify-pipeline.mjs` is the honest one, and it runs in CI. It generates a real HEVC `.MOV` with ffmpeg, then asserts end to end that it converts, that Android is correctly named as a blocked target, that a ladder and storyboard are produced, that re-uploading the same footage is caught as a duplicate, that SubRip captions convert, that a wrong password is refused and a right one works, that a stranger cannot stream the file, that path traversal through HLS segment names is blocked, that an API key can upload but not manage settings, and that metrics are exposed.

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
| `POST` `GET` | `/api/analytics/events` · `/overview` · `/media/:id` | Telemetry and aggregates |
| `GET` `POST` `DELETE` | `/api/developer/keys` · `/webhooks` | Platform credentials |
| `GET` | `/api/system/metrics` · `/status` | Prometheus text, queue state |

### Verifying a webhook

```js
const [t, v1] = header.split(",").map((part) => part.split("=")[1]);
const expected = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
// compare with timingSafeEqual, and reject if t is more than 5 minutes old
```

---

## Known limits

- HDR sources are converted to SDR with a straight pixel-format conversion rather than proper tone mapping, so HDR footage loses some highlight detail.
- Workers run inside the web process. That is deliberate for a single-box deployment; the queue is already in the database, so moving them to a separate container is a config change rather than a rewrite.
- Plans and quotas are enforced, but payment is not wired up — switching plans in Settings is immediate.

## License

MIT
