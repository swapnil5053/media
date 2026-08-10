import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { BarChart3, LibraryBig, LogOut, Moon, Settings2, Sun } from "lucide-react";
import type { Account } from "@shared/types";
import { cn } from "@/lib/cn";
import { useSignOut } from "@/hooks/use-account";
import { usePipelineEvents } from "@/hooks/use-media";
import { Button } from "./ui/button";
import { Logo } from "./logo";
import { useTheme } from "./theme";

const NAV = [
  { to: "/library", label: "Library", icon: LibraryBig },
  { to: "/insights", label: "Insights", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({ account, children }: { account: Account; children: ReactNode }) {
  const navigate = useNavigate();
  const signOut = useSignOut();
  const { theme, toggle } = useTheme();

  usePipelineEvents(true);

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Logo to="/library" />

          <nav className="flex items-center gap-1" aria-label="Main">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors duration-150 sm:px-3",
                    isActive ? "bg-sunken text-ink" : "text-muted hover:text-ink",
                  )
                }
              >
                <item.icon size={16} aria-hidden />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggle}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
            </Button>
            <span className="hidden text-sm text-muted md:inline">{account.email}</span>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Sign out"
              onClick={() => signOut.mutate(undefined, { onSuccess: () => navigate("/") })}
            >
              <LogOut size={16} aria-hidden />
            </Button>
          </div>
        </div>
      </header>

      <main className="page-enter mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
