import { describe, expect, it } from "vitest";
import type { MediaSource } from "../shared/types.js";
import { buildReport, isUniversallyPlayable } from "../server/media/compatibility.js";

const base: MediaSource = {
  container: "mp4",
  videoCodec: "h264",
  audioCodec: "aac",
  width: 1920,
  height: 1080,
  fps: 30,
  durationSeconds: 12,
  bitrate: 5_000_000,
  isHdr: false,
  rotation: 0,
};

const iphoneRecording: MediaSource = { ...base, container: "mov", videoCodec: "hevc" };

describe("compatibility", () => {
  it("treats an H.264 MP4 as playable everywhere", () => {
    expect(isUniversallyPlayable(base)).toBe(true);
    expect(buildReport(base).sourceScore).toBe(100);
  });

  it("flags an iPhone HEVC recording as not universally playable", () => {
    expect(isUniversallyPlayable(iphoneRecording)).toBe(false);
  });

  it("names Android as a device the original would fail on", () => {
    const report = buildReport(iphoneRecording);
    const android = report.targets.find((target) => target.id === "android-chrome");

    expect(android?.supported).toBe(false);
    expect(android?.reason).toContain("HEVC");
    expect(report.summary).toContain("Android");
  });

  it("still plays on an iPhone, which is why the sender never noticed", () => {
    const report = buildReport(iphoneRecording);
    expect(report.targets.find((target) => target.id === "iphone-safari")?.supported).toBe(true);
  });

  it("reaches every device after conversion", () => {
    expect(buildReport(iphoneRecording).deliveryScore).toBe(100);
  });

  it("rejects HDR for devices that cannot tone map it", () => {
    const report = buildReport({ ...base, isHdr: true });
    expect(report.targets.find((target) => target.id === "smart-tv")?.supported).toBe(false);
  });

  it("ignores audio compatibility when a clip has no audio track", () => {
    expect(isUniversallyPlayable({ ...base, audioCodec: null })).toBe(true);
  });
});
