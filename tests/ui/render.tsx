import type { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render } from "@testing-library/react";
import { vi } from "vitest";

/** Retries and refetching make assertions racy, so both are off in tests. */
function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 }, mutations: { retry: false } },
  });
}

/** `path` matters for pages that read route params, such as /w/:slug. */
export function renderApp(
  ui: ReactElement,
  { route = "/", path }: { route?: string; path?: string } = {},
) {
  const client = makeClient();

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        {path ? <Routes>{<Route path={path} element={children} />}</Routes> : children}
      </MemoryRouter>
    </QueryClientProvider>
  );

  return { client, ...render(ui, { wrapper: Wrapper }) };
}

interface StubRoute {
  status?: number;
  body?: unknown;
}

/** Minimal fetch stub keyed by "METHOD /path". */
export function stubFetch(routes: Record<string, StubRoute>) {
  const calls: Array<{ method: string; url: string; body?: unknown }> = [];

  const impl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = (init?.method ?? "GET").toUpperCase();
    const key = `${method} ${url}`;
    calls.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined });

    const route = routes[key] ?? routes[`${method} *`];
    if (!route) {
      return new Response(JSON.stringify({ error: `Unstubbed ${key}`, code: "unstubbed" }), { status: 500 });
    }

    const status = route.status ?? 200;
    if (status === 204) return new Response(null, { status });

    // `?? {}` would swallow a deliberate null, which is what /auth/me returns
    // when nobody is signed in.
    return new Response(JSON.stringify(route.body === undefined ? {} : route.body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });

  vi.stubGlobal("fetch", impl);
  return calls;
}

export const account = {
  id: "u1",
  email: "swapnil@example.com",
  name: "Swapnil",
  plan: "free" as const,
  createdAt: new Date().toISOString(),
  usage: { videos: 1, storageBytes: 1024 ** 2, bytesSaved: 512 * 1024 },
};
