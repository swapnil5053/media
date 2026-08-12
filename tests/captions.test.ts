import { describe, expect, it } from "vitest";
import { srtToVtt } from "../server/services/caption-service.js";

const SRT = `1
00:00:01,000 --> 00:00:04,000
He sent the video from his iPhone.

2
00:00:04,500 --> 00:00:07,250
It would not open on my phone.
`;

describe("srt to vtt", () => {
  it("adds the WEBVTT header", () => {
    expect(srtToVtt(SRT).vtt.startsWith("WEBVTT\n\n")).toBe(true);
  });

  it("converts comma decimals to dots", () => {
    const { vtt } = srtToVtt(SRT);
    expect(vtt).toContain("00:00:01.000 --> 00:00:04.000");
    expect(vtt).not.toContain(",000");
  });

  it("drops the SubRip sequence numbers", () => {
    expect(srtToVtt(SRT).vtt).not.toMatch(/^\d+$/m);
  });

  it("counts the cues it kept", () => {
    expect(srtToVtt(SRT).cueCount).toBe(2);
  });

  it("survives CRLF line endings and a byte order mark", () => {
    const windowsFile = `﻿${SRT.replace(/\n/g, "\r\n")}`;
    expect(srtToVtt(windowsFile).cueCount).toBe(2);
  });

  it("passes an existing WebVTT file through", () => {
    const vtt = "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nAlready fine.";
    expect(srtToVtt(vtt).cueCount).toBe(1);
  });

  it("rejects a file with no cues in it", () => {
    expect(() => srtToVtt("just some prose")).toThrow(/could not find any subtitles/i);
  });

  it("rejects an empty file", () => {
    expect(() => srtToVtt("   ")).toThrow(/empty/i);
  });
});
