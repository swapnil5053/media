# AdaptFlow

<div>
  <h3>Video Processing & Secure Distribution Platform</h3>
  <p>A full-stack application for exploring media workflows, secure content sharing, and analytics through a unified dashboard.</p>
</div>

## Overview

AdaptFlow is a full-stack media management platform that models the lifecycle of a video asset—from upload and processing to optimization, secure distribution, and playback analytics.

The project explores how modern media platforms manage content workflows, access-controlled delivery, and operational visibility through a unified dashboard.

---

## Features

### Media Library

- Upload and manage video assets
- Browse media through a centralized dashboard
- View metadata such as resolution, codec, bitrate, frame rate, and duration
- Track processing status across the asset lifecycle

### Processing & Optimization

- Simulate media processing workflows
- Trigger video optimization jobs
- Compare original and optimized file sizes
- View compression statistics and codec information

### Secure Sharing

- Generate shareable playback links
- Configure password protection
- Set expiration windows
- Limit the number of allowed views
- Revoke links when no longer needed

### Analytics

- Track total views and unique viewers
- Monitor average completion rates
- Explore device distribution metrics
- View asset-level and platform-wide analytics

### Notifications

- Event-driven notification center
- Upload status updates
- Optimization alerts
- Share-link activity events

---

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Framer Motion
- React Router

### Backend

- Node.js
- Express

### Visualization

- @tremor/react

### Build Tools

- Vite
- esbuild

---

## Architecture

```text
React Frontend
       │
       ▼
 Express REST API
       │
       ▼
 In-Memory Data Store
```

The application uses seeded demo data and mock processing workflows to simulate a media management platform without requiring external cloud infrastructure.

---

## API Overview

### Media

| Method | Endpoint                     | Description               |
| ------ | ---------------------------- | ------------------------- |
| GET    | `/api/v1/media`              | Retrieve all media assets |
| GET    | `/api/v1/media/:id`          | Retrieve a single asset   |
| POST   | `/api/v1/upload`             | Upload a media file       |
| DELETE | `/api/v1/media/:id`          | Delete a media asset      |
| POST   | `/api/v1/media/:id/optimize` | Run optimization workflow |

### Sharing

| Method | Endpoint                        | Description              |
| ------ | ------------------------------- | ------------------------ |
| POST   | `/api/v1/media/:id/share`       | Create a share link      |
| GET    | `/api/v1/media/:id/share-links` | List share links         |
| DELETE | `/api/v1/share/:slug`           | Revoke a share link      |
| GET    | `/s/:slug`                      | Resolve playback details |

### Analytics

| Method | Endpoint                           | Description              |
| ------ | ---------------------------------- | ------------------------ |
| GET    | `/api/v1/media/:id/analytics`      | Retrieve analytics       |
| POST   | `/api/v1/media/:id/playback-event` | Record playback activity |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
git clone https://github.com/swapnil5053/AdaptFlow.git
cd AdaptFlow
npm install
```

### Run Locally

Build the application:

```bash
npm run build
```

Start the server:

```bash
npm run start
```

Open:

```text
http://localhost:8000
```

---

## Environment Variables

Create a `.env.local` file:

```env
PORT=8000
APP_URL=http://localhost:8000

VITE_API_BASE=http://localhost:8000/api/v1
```

---

## Project Structure

```text
src/
├── api/
├── components/
├── hooks/
├── layouts/
├── pages/
├── lib/
├── main.tsx
└── index.css

server.ts
vite.config.ts
```

---

## Learning Objectives

This project was built to explore:

- Full-stack application architecture
- Media processing workflows
- Secure content distribution patterns
- Analytics dashboard design
- REST API development
- React and TypeScript application development

---

## Future Improvements

Potential extensions include:

- Persistent database storage
- Background job processing
- Object storage integration
- Real transcoding pipelines
- Role-based access control
- Cloud deployment workflows

---
