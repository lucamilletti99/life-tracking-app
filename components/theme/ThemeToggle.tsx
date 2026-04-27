"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  // Avoid hydration mismatch by exposing theme-dependent icon state only
  // after the client has taken over from the server-rendered snapshot.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const dark = mounted && resolvedTheme === "dark";
  const baseIcon = "absolute h-[15px] w-[15px] transition-smooth";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light mode" : "Dark mode"}
      suppressHydrationWarning
      className={cn(
        "group relative inline-flex items-center justify-center rounded-full border transition-chrome focus-visible:border-hairline-strong",
        "border-hairline bg-surface-elevated text-ink-muted shadow-[var(--shadow-soft)] hover:text-ink hover:border-hairline-strong",
        size === "md" ? "h-9 w-9" : "h-8 w-8",
        className,
      )}
    >
      {/* Pre-mount: render nothing themed to keep SSR markup deterministic. */}
      {mounted && (
        <>
          <Sun
            suppressHydrationWarning
            className={cn(
              baseIcon,
              dark ? "-rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100",
            )}
          />
          <Moon
            suppressHydrationWarning
            className={cn(
              baseIcon,
              dark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-50 opacity-0",
            )}
          />
        </>
      )}
    </button>
  );
}
