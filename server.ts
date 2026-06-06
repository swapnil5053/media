import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { createServer as createViteServer } from "vite";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Extract video metadata using ffprobe
async function getVideoMetadata(filePath: string): Promise<{
  codec: string;
  resolution: string;
  fps: number;
  bitrate: number;
  duration: number;
  hdr_type: string;
  audio_codec: string;
}> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
    );
    const data = JSON.parse(stdout);
    
    const videoStream = data.streams?.find((s: any) => s.codec_type === 'video');
    const audioStream = data.streams?.find((s: any) => s.codec_type === 'audio');
    const format = data.format || {};

    let codec = 'H.264';
    if (videoStream?.codec_name) {
      const name = videoStream.codec_name.toUpperCase();
      if (name === 'H264') codec = 'H.264';
      else if (name === 'HEVC') codec = 'HEVC';
      else if (name === 'VP9') codec = 'VP9';
      else if (name === 'AV1') codec = 'AV1';
      else codec = name;
    }

    const width = videoStream?.width;
    const height = videoStream?.height;
    const resolution = width && height ? `${width}x${height}` : '1920x1080';

    let fps = 30;
    if (videoStream?.r_frame_rate) {
      const parts = videoStream.r_frame_rate.split('/');
      if (parts.length === 2) {
        const num = parseFloat(parts[0]);
        const den = parseFloat(parts[1]);
        if (den !== 0) fps = Math.round(num / den);
      } else {
        const num = parseFloat(videoStream.r_frame_rate);
        if (!isNaN(num)) fps = Math.round(num);
      }
    }

    const bitrate = format.bit_rate ? parseInt(format.bit_rate) : (videoStream?.bit_rate ? parseInt(videoStream.bit_rate) : 5000000);
    const duration = format.duration ? parseFloat(format.duration) : (videoStream?.duration ? parseFloat(videoStream.duration) : 120);

    // HDR check
    const colorSpace = videoStream?.color_space || '';
    const colorTransfer = videoStream?.color_transfer || '';
    const hdr_type = (colorTransfer.includes('smpte2084') || colorTransfer.includes('arib-std-b67') || colorSpace.includes('bt2020')) ? 'HDR10' : 'SDR';

    const audio_codec = audioStream?.codec_name ? audioStream.codec_name.toUpperCase() : 'AAC';

    return {
      codec,
      resolution,
      fps,
      bitrate,
      duration,
      hdr_type,
      audio_codec
    };
  } catch (err) {
    console.error('Error during ffprobe:', err);
    return {
      codec: 'H.264',
      resolution: '1920x1080',
      fps: 30,
      bitrate: 8000000,
      duration: 120,
      hdr_type: 'SDR',
      audio_codec: 'AAC'
    };
  }
}

// Generate thumbnail image from video using ffmpeg
async function generateVideoThumbnail(filePath: string, outputThumbnailPath: string): Promise<void> {
  try {
    try {
      await execAsync(
        `ffmpeg -y -ss 00:00:00.500 -i "${filePath}" -update 1 -vframes 1 -q:v 2 "${outputThumbnailPath}"`
      );
    } catch (e) {
      console.warn('Failed capturing thumbnail at 0.5s, retrying at 0.0s:', e);
      await execAsync(
        `ffmpeg -y -i "${filePath}" -update 1 -vframes 1 -q:v 2 "${outputThumbnailPath}"`
      );
    }
  } catch (err) {
    console.error('Error during ffmpeg thumbnail generation:', err);
    throw err;
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8000;

  app.use(cors());
  app.use(express.json());

  // In-memory data store for the mock backend
  const mediaDb = new Map<string, any>();
  const shareLinksDb = new Map<string, any>();

  // Track dynamic media analytics
  const mediaAnalyticsDb = new Map<string, {
    total_views: number;
    unique_viewers: number;
    completion_rates: number[];
  }>();

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
    thumbnail_url: '/uploads/demo_poster.png',
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
    thumbnail_url: '/uploads/demo_poster.png',
  });

  // Pre-seed demoId analytics
  mediaAnalyticsDb.set(demoId, {
    total_views: 12400,
    unique_viewers: 8200,
    completion_rates: Array(100).fill(0.78),
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

  // Scan uploads folder for historical uploads and populate metadata/thumbnails
  async function scanUploadsFolder() {
    try {
      if (!fs.existsSync(uploadDir)) return;
      const files = fs.readdirSync(uploadDir);
      for (const file of files) {
        if (file.startsWith('file-') && (file.endsWith('.mp4') || file.endsWith('.mov') || file.endsWith('.mkv') || file.endsWith('.avi'))) {
          let found = false;
          for (const item of mediaDb.values()) {
            if (item.localPath === file) {
              found = true;
              break;
            }
          }
          
          if (!found) {
            const id = uuidv4();
            const filePath = path.join(uploadDir, file);
            const stats = fs.statSync(filePath);
            const thumbnailFilename = `thumbnail-${id}.jpg`;
            const thumbnailPath = path.join(uploadDir, thumbnailFilename);
            
            console.log(`Discovered historical upload: ${file}, registering id ${id}...`);
            
            mediaDb.set(id, {
              id,
              filename: file,
              localPath: file,
              status: 'ready',
              created_at: stats.mtime.toISOString(),
              size_bytes: stats.size,
              codec: 'H.264',
              resolution: '1920x1080',
              fps: 30,
              bitrate: 5000000,
              duration: 120,
              hdr_type: 'SDR',
              audio_codec: 'AAC',
            });
            
            (async () => {
              try {
                const metadata = await getVideoMetadata(filePath);
                const item = mediaDb.get(id);
                if (item) {
                  Object.assign(item, metadata);
                }
                
                if (!fs.existsSync(thumbnailPath)) {
                  await generateVideoThumbnail(filePath, thumbnailPath);
                }
                
                const finalItem = mediaDb.get(id);
                if (finalItem) {
                  finalItem.thumbnail_url = `/uploads/${thumbnailFilename}`;
                }
              } catch (e) {
                console.error(`Failed extracting specs for historical file ${file}:`, e);
              }
            })();
          }
        }
      }
    } catch (err) {
      console.error('Error scanning uploads folder:', err);
    }
  }

  // Run the uploads scan
  scanUploadsFolder();

  // -----------------------------------------------------
  // MOCK FASTAPI ROUTES
  // -----------------------------------------------------

  app.post('/api/v1/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ detail: "No file provided" });
    }
    
    const id = uuidv4();
    const filePath = path.join(uploadDir, req.file.filename);
    const thumbnailFilename = `thumbnail-${id}.jpg`;
    const thumbnailPath = path.join(uploadDir, thumbnailFilename);

    mediaDb.set(id, {
      id,
      filename: req.file.originalname,
      localPath: req.file.filename,
      status: 'analyzing',
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

    // Background processing matching pipeline visual stages:
    (async () => {
      try {
        // Step 1: Wait 2 seconds in 'analyzing' state (keeps UI pipeline visualization consistent)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get metadata using ffprobe
        const metadata = await getVideoMetadata(filePath);
        const item = mediaDb.get(id);
        if (item) {
          Object.assign(item, metadata);
          item.status = 'transcoding';
        }

        // Step 2: Wait 3 seconds in 'transcoding' state
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Generate thumbnail using ffmpeg
        try {
          await generateVideoThumbnail(filePath, thumbnailPath);
          const finalItem = mediaDb.get(id);
          if (finalItem) {
            finalItem.thumbnail_url = `/uploads/${thumbnailFilename}`;
          }
        } catch (thumbErr) {
          console.error(`Failed to generate thumbnail for ${id}, using default fallback:`, thumbErr);
        }

        const finalItem = mediaDb.get(id);
        if (finalItem) {
          finalItem.status = 'ready';
        }
      } catch (err) {
        console.error(`Background processing failed for ${id}:`, err);
        const finalItem = mediaDb.get(id);
        if (finalItem) {
          finalItem.status = 'ready';
        }
      }
    })();

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

    const mediaItem = mediaDb.get(share.media_id);
    const stream_url = mediaItem && mediaItem.localPath
      ? `/uploads/${mediaItem.localPath}`
      : "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

    // Dynamic analytics view increment
    if (mediaItem) {
      let stats = mediaAnalyticsDb.get(mediaItem.id);
      if (!stats) {
        stats = {
          total_views: 0,
          unique_viewers: 0,
          completion_rates: []
        };
        mediaAnalyticsDb.set(mediaItem.id, stats);
      }
      stats.total_views++;
      stats.unique_viewers = Math.max(1, Math.round(stats.total_views * 0.82));
    }

    res.json({ 
        stream_url,
        media_id: share.media_id,
        thumbnail_url: mediaItem ? mediaItem.thumbnail_url : undefined
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
    const mediaId = req.params.id;
    let stats = mediaAnalyticsDb.get(mediaId);
    if (!stats) {
      stats = {
        total_views: 0,
        unique_viewers: 0,
        completion_rates: []
      };
      mediaAnalyticsDb.set(mediaId, stats);
    }

    const sum = stats.completion_rates.reduce((a, b) => a + b, 0);
    const avg = stats.completion_rates.length > 0 ? (sum / stats.completion_rates.length) : 0.0;

    res.json({
        total_views: stats.total_views,
        unique_viewers: stats.unique_viewers,
        average_completion: avg,
        avg_completion_rate: avg
    });
  });

  app.post('/api/v1/media/:id/playback-event', (req, res) => {
    const mediaId = req.params.id;
    const { completion } = req.body;

    let stats = mediaAnalyticsDb.get(mediaId);
    if (!stats) {
      stats = {
        total_views: 0,
        unique_viewers: 0,
        completion_rates: []
      };
      mediaAnalyticsDb.set(mediaId, stats);
    }

    if (completion !== undefined) {
      stats.completion_rates.push(Number(completion));
      if (stats.completion_rates.length > 500) {
        stats.completion_rates.shift();
      }
    }

    stats.total_views++;
    stats.unique_viewers = Math.max(1, Math.round(stats.total_views * 0.82));

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
