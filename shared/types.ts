export type MediaStatus = "queued" | "probing" | "transcoding" | "ready" | "failed";

export type PlanId = "free" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number;
  maxVideos: number;
  maxStorageBytes: number;
  maxUploadBytes: number;
  features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    maxVideos: 5,
    maxStorageBytes: 2 * 1024 ** 3,
    maxUploadBytes: 512 * 1024 ** 2,
    features: [
      "5 videos",
      "2 GB of storage",
      "Universal MP4 + HLS delivery",
      "Password-protected links",
      "Playback analytics",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 12,
    maxVideos: 250,
    maxStorageBytes: 100 * 1024 ** 3,
    maxUploadBytes: 5 * 1024 ** 3,
    features: [
      "250 videos",
      "100 GB of storage",
      "Adaptive bitrate streaming",
      "Link expiry and view limits",
      "Per-viewer completion analytics",
      "Priority transcoding queue",
    ],
  },
};

/** A single playback target we check a source file against. */
export interface CompatibilityTarget {
  id: string;
  label: string;
  supported: boolean;
  reason: string;
}

export interface CompatibilityReport {
  sourceLabel: string;
  deliveryLabel: string;
  sourceScore: number;
  deliveryScore: number;
  targets: CompatibilityTarget[];
  summary: string;
}

export interface MediaSource {
  container: string;
  videoCodec: string;
  audioCodec: string | null;
  width: number;
  height: number;
  fps: number;
  durationSeconds: number;
  bitrate: number;
  isHdr: boolean;
  rotation: number;
}

export interface CaptionTrack {
  id: string;
  label: string;
  language: string;
  url: string;
}

export interface Media {
  id: string;
  title: string;
  originalFilename: string;
  status: MediaStatus;
  error: string | null;
  sizeBytes: number;
  deliverySizeBytes: number | null;
  hasHls: boolean;
  hasStoryboard: boolean;
  posterUrl: string | null;
  spriteUrl: string | null;
  source: MediaSource | null;
  wasConverted: boolean;
  compatibility: CompatibilityReport | null;
  duplicateOf: { id: string; title: string } | null;
  captions: CaptionTrack[];
  progress: number;
  createdAt: string;
  readyAt: string | null;
}

export interface ShareLink {
  id: string;
  slug: string;
  url: string;
  mediaId: string;
  hasPassword: boolean;
  expiresAt: string | null;
  maxViews: number | null;
  views: number;
  status: "active" | "revoked" | "expired" | "exhausted";
  createdAt: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  uniqueViewers: number;
  averageCompletion: number;
  totalWatchSeconds: number;
  devices: Array<{ name: string; views: number }>;
  daily: Array<{ date: string; views: number }>;
}

export interface AccountUsage {
  videos: number;
  storageBytes: number;
  bytesSaved: number;
}

export interface Account {
  id: string;
  email: string;
  name: string;
  plan: PlanId;
  createdAt: string;
  usage: AccountUsage;
}

export interface WatchPayload {
  mediaId: string;
  title: string;
  posterUrl: string | null;
  mp4Url: string;
  hlsUrl: string | null;
  storyboardUrl: string | null;
  captions: CaptionTrack[];
  durationSeconds: number;
  convertedFrom: string | null;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  /** Only present in the response that creates the key. */
  token?: string;
}

export interface Webhook {
  id: string;
  url: string;
  secret: string;
  active: boolean;
  createdAt: string;
  deliveries: Array<{
    id: string;
    event: string;
    statusCode: number | null;
    ok: boolean;
    attempts: number;
    error: string | null;
    createdAt: string;
  }>;
}

export interface JobSummary {
  id: string;
  type: string;
  mediaId: string | null;
  status: string;
  stage: string;
  progress: number;
  attempts: number;
  maxAttempts: number;
  error: string | null;
  durationMs: number | null;
  createdAt: string;
}

export interface SystemStatus {
  queue: {
    queued: number;
    running: number;
    failed: number;
    completedToday: number;
    averageDurationMs: number;
    oldestQueuedSeconds: number;
  };
  workers: number;
  uptimeSeconds: number;
  counters: Record<string, number>;
  jobs: JobSummary[];
}
