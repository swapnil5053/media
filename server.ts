import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8000;

  app.use(cors());
  app.use(express.json());

  // In-memory data store for the mock backend
  const mediaDb = new Map<string, any>();
  const shareLinksDb = new Map<string, any>();

  // Pre-seed mock data for demonstration and testing
  const demoId = "12c57519-7f2e-406f-a303-1b4fce160c85";
  mediaDb.set(demoId, {
    id: demoId,
    filename: "demo_video.mp4",
    status: 'ready',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    size_bytes: 48201934,
    codec: 'H.264',
    resolution: '1920x1080',
    fps: 30,
    bitrate: 8000000,
    duration: 180,
    hdr_type: 'SDR',
    audio_codec: 'AAC',
  });

  const processingId = "24c57519-7f2e-406f-a303-1b4fce160c86";
  mediaDb.set(processingId, {
    id: processingId,
    filename: "raw_recording.mov",
    status: 'transcoding',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    size_bytes: 1284092103,
    codec: 'ProRes',
    resolution: '3840x2160',
    fps: 60,
    bitrate: 150000000,
    duration: 60,
    hdr_type: 'HDR10',
    audio_codec: 'PCM',
  });

  // Use a temporary folder for uploads
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });

  const upload = multer({ storage });

  // -----------------------------------------------------
  // MOCK FASTAPI ROUTES
  // -----------------------------------------------------

  app.post('/api/v1/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ detail: "No file provided" });
    }
    
    const id = uuidv4();
    mediaDb.set(id, {
      id,
      filename: req.file.originalname,
      localPath: req.file.filename,
      status: 'analyzing', // simulate state machine later
      created_at: new Date().toISOString(),
      size_bytes: req.file.size,
      codec: 'HEVC',
      resolution: '4K',
      fps: 60,
      bitrate: 45000000,
      duration: 120,
      hdr_type: 'HDR10',
      audio_codec: 'AAC',
    });

    // Simulate progress: move from analyzing -> transcoding -> ready
    setTimeout(() => {
      const item = mediaDb.get(id);
      if (item) {
        item.status = 'transcoding';
        setTimeout(() => {
            if (mediaDb.has(id)) {
                mediaDb.get(id).status = 'ready';
            }
        }, 3000);
      }
    }, 2000);

    res.json({ id });
  });

  app.get('/api/v1/upload/:id/status', (req, res) => {
    const item = mediaDb.get(req.params.id);
    if (!item) return res.status(404).json({ detail: "Not found" });
    res.json({ status: item.status, progress: item.status === 'transcoding' ? 64 : 100 });
  });

  app.get('/api/v1/media', (req, res) => {
    const items = Array.from(mediaDb.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json({ items, total: items.length });
  });

  app.get('/api/v1/media/:id', (req, res) => {
    const item = mediaDb.get(req.params.id);
    if (!item) return res.status(404).json({ detail: "Not found" });
    res.json(item);
  });

  app.delete('/api/v1/media/:id', (req, res) => {
    mediaDb.delete(req.params.id);
    res.status(204).send();
  });

  app.get('/api/v1/media/:id/stream', (req, res) => {
    const item = mediaDb.get(req.params.id);
    if (item && item.localPath) {
      res.json({ stream_url: `/uploads/${item.localPath}` });
    } else {
      res.json({ stream_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" }); // Sample valid HLS stream
    }
  });

  app.post('/api/v1/media/:id/share', (req, res) => {
    const mediaId = req.params.id;
    if (!mediaDb.has(mediaId)) return res.status(404).json({ detail: "Media not found" });

    const slug = Math.random().toString(36).substring(2, 8);
    const url = `${req.protocol}://${req.get('host')}/view/${slug}`;
    
    shareLinksDb.set(slug, {
        slug,
        media_id: mediaId,
        url,
        config: req.body,
        created_at: new Date().toISOString(),
        views: 0,
        deactivated: false
    });

    res.json({ url, slug });
  });

  app.get('/s/:slug', (req, res) => {
    const share = shareLinksDb.get(req.params.slug);
    if (!share || share.deactivated) return res.status(404).json({ detail: "Link not found." });

    const pwdHeader = req.headers['x-share-password'];
    if (share.config.require_password && share.config.password !== pwdHeader) {
        return res.status(401).json({ detail: "Password required" });
    }

    if (share.config.view_limit && share.views >= share.config.view_limit) {
        return res.status(429).json({ detail: "Limit reached" });
    }

    share.views++;

    res.json({ 
        stream_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        media_id: share.media_id 
    });
  });

  app.get('/api/v1/media/:id/share-links', (req, res) => {
    const mediaId = req.params.id;
    const links = Array.from(shareLinksDb.values())
      .filter(link => link.media_id === mediaId)
      .map(link => {
        let status = 'active';
        if (link.config.view_limit && link.views >= link.config.view_limit) {
          status = 'expired';
        }
        if (link.deactivated) {
          status = 'deactivated';
        }
        return {
          ...link,
          status,
          expires_at: link.config.expires_in_hours 
            ? new Date(new Date(link.created_at).getTime() + link.config.expires_in_hours * 60 * 60 * 1000).toISOString()
            : null
        };
      });
    res.json(links);
  });

  app.delete('/api/v1/share/:slug', (req, res) => {
    const share = shareLinksDb.get(req.params.slug);
    if (!share) return res.status(404).json({ detail: "Link not found" });
    share.deactivated = true;
    res.status(204).send();
  });

  app.get('/api/v1/media/:id/analytics', (req, res) => {
    res.json({
        total_views: 12400,
        unique_viewers: 8200,
        average_completion: 0.78,
        avg_completion_rate: 0.78
    });
  });

  app.post('/api/v1/media/:id/playback-event', (req, res) => {
    // Record playback metrics
    res.status(204).send();
  });

  app.post('/api/v1/media/:id/optimize', (req, res) => {
    const item = mediaDb.get(req.params.id);
    if (!item) return res.status(404).json({ detail: "Not found" });
    item.size_bytes = Math.round(item.size_bytes * 0.25);
    item.codec = 'HEVC';
    res.json(item);
  });

  app.use('/uploads', express.static(uploadDir));

  // -----------------------------------------------------
  // VITE MIDDLEWARE
  // -----------------------------------------------------

  const isProduction = process.env.NODE_ENV === "production" || (process.argv[1] && (process.argv[1].endsWith('.mjs') || process.argv[1].includes('dist')));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html for all non-API paths (SPA routing)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
