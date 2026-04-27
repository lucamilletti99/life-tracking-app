"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Calendar, CalendarCheck2, Repeat, Target } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/today",     label: "Today",     icon: CalendarCheck2 },
  { href: "/calendar",  label: "Calendar",  icon: Calendar       },
  { href: "/habits",    label: "Habits",    icon: Repeat         },
  { href: "/goals",     label: "Goals",     icon: Target         },
  { href: "/analytics", label: "Stats",     icon: BarChart2      },
];

/**
 * Floating bottom tab bar — only rendered on mobile (hidden via md:hidden in the
 * parent layout). Respects iOS safe-area-inset-bottom so it clears the home bar.
 */
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        // Position: floating above the safe area, centred horizontally
        "fixed bottom-0 left-0 right-0 z-50 flex justify-center",
        // Safe-area bottom padding so the bar clears the home indicator
        "pb-[max(env(safe-area-inset-bottom),12px)]",
        // Horizontal edge padding
        "px-4",
      )}
    >
      <div
        className={cn(
          // Pill container
          "flex w-full max-w-sm items-center justify-around",
          "rounded-2xl border border-hairline",
          "bg-surface/80 supports-backdrop-filter:bg-surface/70 supports-backdrop-filter:backdrop-blur-xl",
          "shadow-[var(--shadow-lifted)]",
          "px-2 py-2",
        )}
      >
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5",
                // Min 44×44 px tap target (Apple HIG)
                "min-h-[44px] min-w-[44px] rounded-xl",
                "transition-chrome",
                active
                  ? "text-ink"
                  : "text-ink-subtle active:text-ink-muted",
              )}
            >
              {/* Active indicator dot above icon */}
              <span
                aria-hidden
                className={cn(
                  "mb-0.5 h-1 w-1 rounded-full transition-smooth",
                  active ? "bg-ember scale-100 opacity-100" : "scale-0 opacity-0",
                )}
              />
              <Icon
                size={20}
                strokeWidth={active ? 2 : 1.75}
                className={cn(
                  "transition-chrome",
                  active ? "text-ink" : "text-ink-subtle",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium leading-none tracking-wide transition-chrome",
                  active ? "text-ink" : "text-ink-subtle",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
