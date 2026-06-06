# AdaptFlow

<div align="center">
  <h3>High-Performance Video Ingestion & Secure Edge Delivery Console</h3>
  <p>A self-contained developer console for multi-format video ingestion, real-time encoding telemetry, compression diagnostics, and time-sensitive secure playback links.</p>

  [![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vite.dev)
  [![React](https://img.shields.io/badge/React-19.x-61DAFB.svg?style=flat&logo=react&logoColor=white)](https://react.dev)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
</div>

---

## Overview

**AdaptFlow** is a professional video infrastructure console designed to manage, transcode, and securely distribute video assets across edge networks. Designed specifically for video engineering teams, it provides real-time encoding telemetry, compression diagnostics, time-sensitive streaming link builders, and system-wide bandwidth analytics in a modern, single-pane-of-glass dashboard.

---

## Core Features

### 🚀 Video Ingestion Pipeline
Ingest multi-format files (MP4, MOV, MKV, AVI) through a state-driven processing pipeline. Telemetry covers:
- **Analyzing**: Metadata extraction (resolution, codec, frame rate, duration).
- **Transcoding**: Active compression & container conversions (e.g., standard to HEVC/H.265).
- **Ready**: Instant playback ready via standard HLS streaming.

### ⚙️ Compression Telemetry & Optimization
Track encoding efficiency with diagnostics including:
- Dynamic HEVC/H.265 transcoding option reducing storage requirements by up to 75%.
- Real-time bit-rate constraints advice and video attributes mapping.

### 🔒 Secure Streaming Link Builder
Build secure, access-controlled edge playback URLs with advanced validation controls:
- **View Limits**: Automatic link deactivation after a threshold number of loads.
- **Passwords**: Access protection requiring client-side password verification.
- **Expiration Hours**: Automatic link expiration based on configured durations.

### 📊 Edge Analytics & Playback Telemetry
Comprehensive viewer activity monitoring powered by high-performance data visualizations:
- Total views and unique viewer tracking.
- Average watch completion rate statistics.
- Device segmentation breakdowns.

### 🔔 Event-Driven Notification Drawer
Real-time alerts that pop out to notify developers of background uploads, completed transcoding operations, and security modifications.

---

## Architecture & Technology Stack

The platform is designed to be self-contained and run on local or containerized environments:

- **Frontend**: Single Page Application built on **React 19**, **TypeScript 5**, and styled with **Tailwind CSS v4** and customized custom theme layouts.
- **Charts**: High-fidelity data visualizations provided by `@tremor/react` for telemetry.
- **Video Player**: Integrated **video.js** HTML5 player with a custom skin tailored for the dark mode console interface.
- **Backend**: **Node.js Express** server providing mock REST API endpoints, streaming endpoints, and serving static assets in production mode.
- **Build System**: Bundled and compiled down to ES Modules using `esbuild` for maximum execution speed.

---

## REST API Specification

AdaptFlow includes a robust mock backend API exposing endpoints for media management, sharing, and analytics:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/upload` | Upload a raw video file (multipart/form-data) |
| `GET` | `/api/v1/upload/:id/status` | Retrieve active ingestion/transcoding status and progress |
| `GET` | `/api/v1/media` | List all ingested media items with metadata |
| `GET` | `/api/v1/media/:id` | Get metadata details for a specific media item |
| `DELETE` | `/api/v1/media/:id` | Delete a media item and all associated share links |
| `GET` | `/api/v1/media/:id/stream` | Retrieve HLS stream URL for video playback |
| `POST` | `/api/v1/media/:id/optimize` | Run H.265/HEVC optimization (reduces file size by 75%) |
| `POST` | `/api/v1/media/:id/share` | Generate a new access-controlled secure share link |
| `GET` | `/api/v1/media/:id/share-links` | List all secure share links created for the asset |
| `GET` | `/s/:slug` | Resolve secure share link playback details (supports password verification) |
| `DELETE` | `/api/v1/share/:slug` | Deactivate/revoke a secure share link |
| `GET` | `/api/v1/media/:id/analytics` | Get total views, unique viewers, and completion rate analytics |
| `POST` | `/api/v1/media/:id/playback-event` | Record playback telemetry and completion events |

---

## Getting Started

### Prerequisites
- **Node.js** (v20+ recommended)
- **NPM** (v10+ recommended)

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/swapnil5053/media.git
cd media
npm install
```

### Local Development

1. **Build the assets**:
   Compile the React frontend into static assets and bundle the Express server code:
   ```bash
   npm run build
   ```

2. **Start the server**:
   Start the Express server on port `8000`:
   ```bash
   npm run start
   ```

3. **Launch the console**:
   Open your browser and navigate to `http://localhost:8000`.

---

## Environment Variables

Configure your local environment parameters by copying `.env.example` to `.env.local`:

```env
# Server Environment Configuration
PORT=8000
APP_URL="http://localhost:8000"

# Client Environment Configuration
VITE_API_BASE="http://localhost:8000/api/v1"
```

---

## Project Structure

```
├── dist/                # Compiled frontend & backend assets
├── src/
│   ├── api/             # API client & endpoint integrations
│   ├── components/      # React UI Primitives, layout, and pipeline components
│   ├── hooks/           # Custom React hooks (e.g. useUpload)
│   ├── lib/             # Helper utilities and styles
│   ├── pages/           # Application views (Dashboard, Settings, Analytics)
│   ├── index.css        # Main stylesheet (custom theme properties)
│   └── main.tsx         # Application entry point
├── server.ts            # Express server (API router & static asset serving)
├── package.json         # Scripts and dependencies
└── tsconfig.json        # TypeScript configuration
```