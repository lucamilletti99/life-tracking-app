"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart2, Calendar, CalendarCheck2, Repeat, Target } from "lucide-react";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { UserAccountButton } from "@/components/layout/UserAccountButton";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/today", label: "Today", icon: CalendarCheck2 },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/habits", label: "Habits", icon: Repeat },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    for (const item of nav) {
      router.prefetch(item.href);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <aside className="surface-shell relative flex h-screen w-64 flex-col border-r px-4 py-5 supports-backdrop-filter:backdrop-blur-xl">
      {/* Brand mark */}
      <Link
        href="/today"
        className="group/brand mb-10 flex items-baseline gap-px px-2 select-none"
      >
        <span className="text-[17px] font-medium tracking-[-0.02em] text-ink">trackr</span>
        <span className="h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-ember transition-chrome group-hover/brand:scale-125" />
      </Link>

      {/* Section label */}
      <p className="mb-2 px-3 text-eyebrow">Workspace</p>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              onMouseEnter={() => router.prefetch(href)}
              onFocus={() => router.prefetch(href)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group/navitem relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-chrome",
                active
                  ? "bg-surface text-ink shadow-[var(--shadow-soft)]"
                  : "text-ink-muted hover:bg-surface hover:text-ink",
              )}
            >
              {/* Left accent bar — ember on active */}
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full transition-smooth",
                  active ? "bg-ember opacity-100" : "bg-transparent opacity-0",
                )}
              />
              <Icon
                className={cn(
                  "h-[15px] w-[15px] shrink-0 transition-chrome",
                  active ? "text-ink" : "text-ink-subtle group-hover/navitem:text-ink",
                )}
                strokeWidth={1.75}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer — theme toggle + account */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-eyebrow">Theme</p>
          <ThemeToggle size="sm" />
        </div>
        <UserAccountButton variant="inline" />
      </div>
    </aside>
  );
}
