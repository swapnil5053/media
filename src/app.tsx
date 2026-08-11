import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AppShell } from "./components/app-shell";
import { ThemeProvider } from "./components/theme";
import { useAccount } from "./hooks/use-account";
import { Skeleton } from "./components/ui/feedback";
import { Landing } from "./pages/landing";
import { SignIn } from "./pages/sign-in";
import { SignUp } from "./pages/sign-up";
import { Library } from "./pages/library";
import { MediaDetail } from "./pages/media-detail";
import { Settings } from "./pages/settings";
import { Watch } from "./pages/watch";
import { Embed } from "./pages/embed";
import { System } from "./pages/system";
import { NotFound } from "./pages/not-found";

// The charting library is only needed on this one route, so it loads with it.
const Insights = lazy(() => import("./pages/insights").then((module) => ({ default: module.Insights })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 10_000 },
  },
});

function RequireAccount({ children }: { children: React.ReactNode }) {
  const { data: account, isPending } = useAccount();

  if (isPending) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-64 w-full" />
      </div>
    );
  }

  if (!account) return <Navigate to="/signin" replace />;

  return <AppShell account={account}>{children}</AppShell>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/w/:slug" element={<Watch />} />
            <Route path="/embed/:slug" element={<Embed />} />

            <Route
              path="/library"
              element={
                <RequireAccount>
                  <Library />
                </RequireAccount>
              }
            />
            <Route
              path="/library/:id"
              element={
                <RequireAccount>
                  <MediaDetail />
                </RequireAccount>
              }
            />
            <Route
              path="/insights"
              element={
                <RequireAccount>
                  <Suspense fallback={<Skeleton className="h-72 w-full" />}>
                    <Insights />
                  </Suspense>
                </RequireAccount>
              }
            />
            <Route
              path="/system"
              element={
                <RequireAccount>
                  <System />
                </RequireAccount>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAccount>
                  <Settings />
                </RequireAccount>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-right" closeButton richColors />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
