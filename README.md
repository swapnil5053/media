# AdaptFlow

**Upload any video, get one link that plays on every device.**

## Why I built this

A friend on an iPhone sent me a video from a trip. My Samsung S23+ would not open it — no preview, no player, just a file sitting in the chat doing nothing. Neither of us had done anything wrong. iPhones record in HEVC inside a `.MOV` container, and plenty of Android phones, browsers and TVs cannot decode that combination.

The fix is completely routine if you work with video, and completely invisible if you do not. That gap is the product: **you should not need to know what a codec is to watch a video someone sent you.**

AdaptFlow takes whatever file came off your phone or camera, works out which devices would fail to play it, converts it to the one format that plays everywhere, and gives you a single link to share.

---

## What it actually does

**Compatibility report per video.** Every upload is probed with `ffprobe` and checked against a matrix of real playback targets — Android Chrome, iPhone Safari, desktop Chrome and Edge, Firefox, macOS Safari, smart TVs. The video page shows you exactly which of them your original would have failed on and why ("Cannot decode HEVC video"), next to the delivered copy that reaches all of them.

**Conversion only when it is needed.** If a file already plays everywhere, it is remuxed and left alone. If it does not, it is re-encoded to H.264 High / AAC in a faststart MP4, capped at 1080p, with `yuv420p` pixel format so 10-bit phone footage stops breaking older decoders.

**Adaptive streaming.** Each video is packaged into an HLS ladder (1080p/720p/360p, skipping anything above the source height) with a master playlist. The player uses native HLS on Safari, `hls.js` elsewhere, and falls back to progressive MP4 if either fails.

**Real progress.** ffmpeg is run with `-progress pipe:1` and its output is parsed into a single 0→100% bar spanning probe, convert, poster and packaging stages. Job state lives in SQLite, so a server restart marks interrupted work as failed instead of leaving it spinning forever.

**Share links with teeth.** Optional bcrypt-hashed password, expiry, and view limits — all enforced server-side. Opening a link grants a short-lived signed cookie scoped to that one video, which is how HLS segments stay protected without putting a token in every URL. Revoking a link takes effect immediately.

**Analytics measured, not estimated.** Views, unique viewers, completion rate, watch time and device mix are computed from playback events the player emits. Viewers are counted by a salted hash of IP and user agent, which is never stored in reversible form.

---

## Screens

| | |
|---|---|
| `/` | Landing page — the story, how it works, pricing, FAQ |
| `/library` | Your videos, upload zone, storage and savings |
| `/library/:id` | Player, compatibility report, file details, playback stats, share links |
| `/insights` | Views per day, device breakdown, completion |
| `/settings` | Profile, plan, usage against quota |
| `/w/:slug` | The public page your recipient opens |

---

## Stack

React 19 · TypeScript (strict) · Vite 6 · Tailwind CSS v4 · TanStack Query · Recharts · hls.js
Express 5 · SQLite (better-sqlite3, WAL) · Zod · bcrypt · ffmpeg / ffprobe · Vitest + Supertest

```
Browser ──► Express 5 ──► SQLite (accounts, media, jobs, share links, playback events)
                │
                └──► job queue ──► ffprobe ──► ffmpeg ──► MP4 + HLS ladder + poster on disk
                                                              │
                Server-sent events ◄──────────────────────────┘
```

Everything runs in one process and one container. There is no cloud dependency and no external queue.

---

## Running it

**Requirements:** Node 20+ and `ffmpeg`/`ffprobe` on your `PATH`.

```bash
git clone https://github.com/swapnil5053/AdaptFlow.git
cd AdaptFlow
npm install
cp .env.example .env.local     # set SESSION_SECRET
npm run dev                    # http://localhost:8000
```

**Production build:**

```bash
npm run build
npm start
```

**Docker** (ffmpeg is baked into the image):

```bash
echo "SESSION_SECRET=$(openssl rand -hex 32)" > .env
docker compose up --build
```

Uploads and the database live in `DATA_DIR` (`/data` in the container, mounted as a named volume), so the container itself stays disposable.

### Environment

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port, default `8000` |
| `APP_URL` | Public base URL used when building share links |
| `SESSION_SECRET` | Signs session and playback cookies. Required in production |
| `DATA_DIR` | Where SQLite and media files are written |

---

## Tests

```bash
npm test        # vitest: compatibility matrix + API contract
npm run lint    # tsc --noEmit, strict
```

The suite covers the compatibility engine (an iPhone HEVC/MOV is correctly flagged as unplayable on Android and playable after conversion) and the API's access rules — that wrong passwords and unknown accounts return identical answers, that streaming without a session or share grant is refused, and that path traversal through HLS segment names is blocked.

The end-to-end path was verified with a real HEVC `.MOV`: uploaded, converted, shared with a password, opened by a viewer with no account, and played back from the generated ladder.

---

## API

| Method | Route | |
|---|---|---|
| `POST` | `/api/auth/signup` · `/signin` · `/signout` | Sessions in signed httpOnly cookies |
| `GET` `PATCH` | `/api/auth/me` | Account, plan and usage |
| `GET` `POST` | `/api/media` | List, upload |
| `GET` `PATCH` `DELETE` | `/api/media/:id` | Detail, rename, delete |
| `GET` | `/api/events` | SSE stream of pipeline progress |
| `POST` | `/api/shares` | Create a link |
| `POST` | `/api/shares/:slug/open` | Public: resolve a link, check password |
| `DELETE` | `/api/shares/:slug` | Revoke |
| `GET` | `/api/stream/:id/video.mp4` · `/hls/*` | Access-checked playback |
| `POST` | `/api/analytics/events` | Playback telemetry |
| `GET` | `/api/analytics/overview` · `/media/:id` | Aggregates |

---

## Known limits

- HDR sources are converted to SDR with a straight pixel-format conversion rather than proper tone mapping, so HDR footage loses some highlight detail.
- Transcoding runs in the same process as the web server, one job at a time. That is fine for a single-box deployment; a separate worker would be the next step.
- Plans and quotas are enforced, but payment is not wired up — switching plans in Settings is immediate.

## License

MIT
