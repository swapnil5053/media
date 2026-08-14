// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompatCard } from "@/components/landing/compat-card";
import { PipelineTabs } from "@/components/landing/pipeline-tabs";
import { Landing } from "@/pages/landing";
import { renderApp, stubFetch } from "./render";

describe("landing page", () => {
  it("renders all five sections and the primary call to action", () => {
    stubFetch({ "GET /api/auth/me": { body: null } });
    renderApp(<Landing />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Send a video/i);
    expect(screen.getByRole("heading", { name: /Ready in seconds/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Locked down by default/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Built like infrastructure/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Stop asking people/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Upload your first video/i })).toHaveAttribute("href", "/signup");
  });

  it("links to the library instead of signup once signed in", async () => {
    stubFetch({ "GET /api/auth/me": { body: { id: "u1", email: "a@b.co", name: "A", plan: "free", createdAt: "", usage: { videos: 0, storageBytes: 0, bytesSaved: 0 } } } });
    renderApp(<Landing />);

    expect(await screen.findByRole("link", { name: /Open your library/i })).toHaveAttribute("href", "/library");
  });
});

describe("hero compatibility card", () => {
  it("opens on the original, showing the problem before the fix", () => {
    renderApp(<CompatCard />);

    expect(screen.getByText("33")).toBeInTheDocument();
    expect(screen.getByText(/of devices/i)).toBeInTheDocument();
    expect(screen.getByText(/2 of 6 play it natively/i)).toBeInTheDocument();
    expect(screen.getAllByText(/won't open/i)).toHaveLength(4);
  });

  it("reaches every device after switching to the converted copy", async () => {
    renderApp(<CompatCard />);
    await userEvent.click(screen.getByRole("tab", { name: "Converted" }));

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText(/6 of 6 play it natively/i)).toBeInTheDocument();
    expect(screen.queryByText(/won't open/i)).not.toBeInTheDocument();
  });

  it("names the format on each side of the conversion", async () => {
    renderApp(<CompatCard />);
    expect(screen.getByText("HEVC · MOV")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Converted" }));
    expect(screen.getByText("H.264 · MP4")).toBeInTheDocument();
  });

  it("exposes the toggle as a tablist with one selected tab", () => {
    renderApp(<CompatCard />);
    const tabs = within(screen.getByRole("tablist", { name: /compatibility/i })).getAllByRole("tab");

    expect(tabs).toHaveLength(2);
    expect(tabs.filter((tab) => tab.getAttribute("aria-selected") === "true")).toHaveLength(1);
  });
});

describe("pipeline tabs", () => {
  it("shows the first panel by default", () => {
    renderApp(<PipelineTabs />);

    expect(screen.getByRole("tab", { name: /Compatibility engine/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/scored against six real playback targets/i)).toBeInTheDocument();
  });

  it("swaps the panel when another item is chosen", async () => {
    renderApp(<PipelineTabs />);
    await userEvent.click(screen.getByRole("tab", { name: /Developer API/i }));

    expect(screen.getByRole("tab", { name: /Developer API/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/upload\.sh/i)).toBeInTheDocument();
    expect(screen.queryByText(/scored against six real playback targets/i)).not.toBeInTheDocument();
  });

  it("moves between tabs with the arrow keys", async () => {
    renderApp(<PipelineTabs />);
    const first = screen.getByRole("tab", { name: /Compatibility engine/i });

    first.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("tab", { name: /Adaptive delivery/i })).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{ArrowUp}");
    expect(screen.getByRole("tab", { name: /Compatibility engine/i })).toHaveAttribute("aria-selected", "true");
  });

  it("keeps exactly one tab in the tab order", () => {
    renderApp(<PipelineTabs />);
    const reachable = screen.getAllByRole("tab").filter((tab) => tab.getAttribute("tabindex") !== "-1");
    expect(reachable).toHaveLength(1);
  });
});
