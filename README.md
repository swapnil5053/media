# AdaptFlow

<div align="center">
  <p><strong>High-Performance Video Ingestion & Secure Edge Delivery Console</strong></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg?style=flat&logo=vite)](https://vite.dev)
  [![React](https://img.shields.io/badge/React-19.x-61DAFB.svg?style=flat&logo=react)](https://react.dev)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
</div>

---

**AdaptFlow** is an infrastructure console designed for managing, transcoding, and distributing secure video assets across edge networks. It provides video engineers with real-time encoding telemetry, compression diagnostics, time-sensitive playback link builders, and system-wide bandwidth analytics.

---

## Key Features

- 🚀 **Ingestion Hub**: Upload, queue, and track multi-format video assets through the transcoding pipeline (analyzing, transcoding, ready).
- ⚙️ **Compression Telemetry**: Live SSIM visual fidelity mapping, bit-rate constraints advice, and dynamic HEVC/H.265 optimization diagnostics.
- 🔒 **Secure Links Builder**: Generate password-protected, view-limited, and time-restricted secure streaming URLs (`/view/:slug`).
- 📊 **Edge Analytics Registry**: Real-time traffic analytics, unique viewer indicators, avg. watch completion rates, and device segment breakdowns.
- 🔔 **Alerts Dispatcher Center**: Native event-driven notifications covering uploads, transcoding operations, and security modifications.

---

## Architecture & Technology Stack

The platform is designed to be self-contained and run on local or containerized environments:

- **Frontend**: React (TypeScript) initialized with Vite, styled with Tailwind CSS (v4) and modern custom layout components.
- **Charts**: Data visualizations provided by `@tremor/react` for system-wide telemetry.
- **Backend**: Node.js Express server acting as both the REST API endpoint provider and the Vite SPA assets server.
- **Build System**: Bundled and compiled down to ES Modules using `esbuild` for maximum execution speed.

---

## Getting Started

### Prerequisites

- **Node.js** (v20+ recommended)
- **NPM** (v10+ recommended)

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/swapnil5053/media.git
cd media
npm install
```

### Local Development

1. **Build the production bundle**:
   
   This compiles the React assets into `dist/` and bundles the Express application into a fast ES Module `dist/server.mjs`.
   
   ```bash
   npm run build
   ```

2. **Start the server**:
   
   This runs the Express application, which boots up on port `8000` and serves the frontend dashboard.
   
   ```bash
   npm run start
   ```

3. **Open the browser**:
   
   Navigate to `http://localhost:8000` to access the console.

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

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
