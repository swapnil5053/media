// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Media, ShareLink } from "@shared/types";
import { SignIn } from "@/pages/sign-in";
import { Library } from "@/pages/library";
import { SharePanel } from "@/components/share-panel";
import { Watch } from "@/pages/watch";
import { account, renderApp, stubFetch } from "./render";

const readyVideo: Media = {
  id: "m1",
  title: "beach trip",
  originalFilename: "IMG_4821.MOV",
  status: "ready",
  error: null,
  sizeBytes: 412 * 1024 ** 2,
  deliverySizeBytes: 96 * 1024 ** 2,
  hasHls: true,
  hasStoryboard: true,
  posterUrl: "/api/media/m1/poster",
  spriteUrl: "/api/media/m1/sprite",
  source: {
    container: "mov",
    videoCodec: "hevc",
    audioCodec: "aac",
    width: 1920,
    height: 1080,
    fps: 30,
    durationSeconds: 84,
    bitrate: 4_000_000,
    isHdr: false,
    rotation: 0,
  },
  wasConverted: true,
  compatibility: null,
  duplicateOf: null,
  captions: [],
  progress: 1,
  createdAt: new Date().toISOString(),
  readyAt: new Date().toISOString(),
};

const converting: Media = { ...readyVideo, id: "m2", title: "trail run", status: "transcoding", progress: 0.64 };

describe("sign in", () => {
  it("sends the credentials the user typed", async () => {
    const calls = stubFetch({
      "GET /api/auth/me": { body: null },
      "POST /api/auth/signin": { body: account },
    });
    renderApp(<SignIn />, { route: "/signin" });

    await userEvent.type(screen.getByLabelText(/email/i), "swapnil@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "correct-horse");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      const submit = calls.find((call) => call.url.endsWith("/auth/signin"));
      expect(submit?.body).toEqual({ email: "swapnil@example.com", password: "correct-horse" });
    });
  });

  it("shows the server's message when the credentials are wrong", async () => {
    stubFetch({
      "GET /api/auth/me": { body: null },
      "POST /api/auth/signin": { status: 401, body: { error: "That email and password do not match.", code: "unauthorized" } },
    });
    renderApp(<SignIn />, { route: "/signin" });

    await userEvent.type(screen.getByLabelText(/email/i), "swapnil@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(await screen.findByText(/That email and password do not match\./i)).toBeInTheDocument();
  });

  it("requires both fields before it will submit", async () => {
    const calls = stubFetch({ "GET /api/auth/me": { body: null }, "POST /api/auth/signin": { body: account } });
    renderApp(<SignIn />, { route: "/signin" });

    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(calls.some((call) => call.url.endsWith("/auth/signin"))).toBe(false);
  });
});

describe("library", () => {
  it("shows an empty state before anything is uploaded", async () => {
    stubFetch({
      "GET /api/auth/me": { body: account },
      "GET /api/media": { body: [] },
      "GET /api/analytics/overview": { body: { totalViews: 0, uniqueViewers: 0, averageCompletion: 0, totalWatchSeconds: 0, devices: [], daily: [], activeLinks: 0 } },
    });
    renderApp(<Library />);

    expect(await screen.findByText(/No videos yet/i)).toBeInTheDocument();
  });

  it("lists videos with their real size and converted marker", async () => {
    stubFetch({
      "GET /api/auth/me": { body: account },
      "GET /api/media": { body: [readyVideo] },
      "GET /api/analytics/overview": { body: { totalViews: 0, uniqueViewers: 0, averageCompletion: 0, totalWatchSeconds: 0, devices: [], daily: [], activeLinks: 0 } },
    });
    renderApp(<Library />);

    expect(await screen.findByText("beach trip")).toBeInTheDocument();
    expect(screen.getByText("Converted")).toBeInTheDocument();
    expect(screen.getByText("96 MB")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /beach trip/i })).toHaveAttribute("href", "/library/m1");
  });

  it("shows progress for a video still being converted", async () => {
    stubFetch({
      "GET /api/auth/me": { body: account },
      "GET /api/media": { body: [converting] },
      "GET /api/analytics/overview": { body: { totalViews: 0, uniqueViewers: 0, averageCompletion: 0, totalWatchSeconds: 0, devices: [], daily: [], activeLinks: 0 } },
    });
    renderApp(<Library />);

    expect(await screen.findByText(/Converting · 64%/i)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "64");
  });

  it("filters the grid as the user searches", async () => {
    stubFetch({
      "GET /api/auth/me": { body: account },
      "GET /api/media": { body: [readyVideo, { ...readyVideo, id: "m3", title: "wedding ceremony" }] },
      "GET /api/analytics/overview": { body: { totalViews: 0, uniqueViewers: 0, averageCompletion: 0, totalWatchSeconds: 0, devices: [], daily: [], activeLinks: 0 } },
    });
    renderApp(<Library />);

    await screen.findByText("beach trip");
    await userEvent.type(screen.getByLabelText(/search videos/i), "wedding");

    expect(screen.getByText("wedding ceremony")).toBeInTheDocument();
    expect(screen.queryByText("beach trip")).not.toBeInTheDocument();
  });

  it("surfaces a failure instead of an empty grid", async () => {
    stubFetch({
      "GET /api/auth/me": { body: account },
      "GET /api/media": { status: 500, body: { error: "boom", code: "internal" } },
      "GET /api/analytics/overview": { status: 500, body: {} },
    });
    renderApp(<Library />);

    expect(await screen.findByText(/could not load your library/i)).toBeInTheDocument();
  });
});

describe("share link creation", () => {
  const link: ShareLink = {
    id: "s1",
    slug: "abc123",
    url: "https://adaptflow.app/w/abc123",
    mediaId: "m1",
    hasPassword: true,
    expiresAt: null,
    maxViews: null,
    views: 0,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  it("sends only the options the user actually set", async () => {
    const calls = stubFetch({
      "GET /api/shares/media/m1": { body: [] },
      "POST /api/shares": { body: link },
    });
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });

    renderApp(<SharePanel mediaId="m1" />);
    await userEvent.click(await screen.findByRole("button", { name: /create share link/i }));

    await waitFor(() => {
      const create = calls.find((call) => call.method === "POST" && call.url.endsWith("/shares"));
      expect(create?.body).toEqual({ mediaId: "m1" });
    });
  });

  it("includes the password and expiry when they are chosen", async () => {
    const calls = stubFetch({ "GET /api/shares/media/m1": { body: [] }, "POST /api/shares": { body: link } });
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });

    renderApp(<SharePanel mediaId="m1" />);
    await userEvent.click(await screen.findByLabelText(/require a password/i));
    await userEvent.type(screen.getByPlaceholderText(/at least 4 characters/i), "family");
    await userEvent.selectOptions(screen.getByLabelText(/link expires/i), "24");
    await userEvent.click(screen.getByRole("button", { name: /create share link/i }));

    await waitFor(() => {
      const create = calls.find((call) => call.method === "POST" && call.url.endsWith("/shares"));
      expect(create?.body).toEqual({ mediaId: "m1", password: "family", expiresInHours: 24 });
    });
  });

  it("will not create a password-protected link with a short password", async () => {
    stubFetch({ "GET /api/shares/media/m1": { body: [] }, "POST /api/shares": { body: link } });
    renderApp(<SharePanel mediaId="m1" />);

    await userEvent.click(await screen.findByLabelText(/require a password/i));
    await userEvent.type(screen.getByPlaceholderText(/at least 4 characters/i), "ab");

    expect(screen.getByRole("button", { name: /create share link/i })).toBeDisabled();
  });

  it("lists an existing link with its view count and revoke control", async () => {
    stubFetch({ "GET /api/shares/media/m1": { body: [{ ...link, views: 3, maxViews: 10 }] } });
    renderApp(<SharePanel mediaId="m1" />);

    expect(await screen.findByText(link.url)).toBeInTheDocument();
    expect(screen.getByText(/3 views of 10 · password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /turn off link/i })).toBeInTheDocument();
  });
});

describe("watching a shared link", () => {
  it("asks for the password when the link is protected", async () => {
    stubFetch({
      "POST /api/shares/abc123/open": { status: 401, body: { error: "This video is password protected.", code: "unauthorized" } },
    });
    renderApp(<Watch />, { route: "/w/abc123", path: "/w/:slug" });

    expect(await screen.findByText(/This video is protected/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("explains a dead link rather than showing a broken player", async () => {
    stubFetch({
      "POST /api/shares/abc123/open": { status: 404, body: { error: "This link has been turned off by its owner.", code: "not_found" } },
    });
    renderApp(<Watch />, { route: "/w/abc123", path: "/w/:slug" });

    expect(await screen.findByText(/This link is not available/i)).toBeInTheDocument();
    expect(screen.getByText(/turned off by its owner/i)).toBeInTheDocument();
  });

  it("plays the video and says what it was converted from", async () => {
    stubFetch({
      "POST /api/shares/abc123/open": {
        body: {
          mediaId: "m1",
          title: "beach trip",
          posterUrl: null,
          mp4Url: "/api/stream/m1/video.mp4",
          hlsUrl: null,
          storyboardUrl: null,
          captions: [],
          durationSeconds: 84,
          convertedFrom: "HEVC",
        },
      },
    });
    renderApp(<Watch />, { route: "/w/abc123", path: "/w/:slug" });

    expect(await screen.findByRole("heading", { name: "beach trip" })).toBeInTheDocument();
    expect(screen.getByText(/Converted from HEVC/i)).toBeInTheDocument();
  });
});
