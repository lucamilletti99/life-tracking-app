"use client";

import { Plus } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  onQuickAdd?: () => void;
  quickAddLabel?: string;
  right?: ReactNode;
  className?: string;
}

/**
 * Editorial topbar — large display title with optional eyebrow + subtitle,
 * generous vertical rhythm, no heavy bottom border.
 */
export function TopBar({
  title,
  eyebrow,
  subtitle,
  onQuickAdd,
  quickAddLabel = "New",
  right,
  className,
}: TopBarProps) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        "relative flex shrink-0 items-end justify-between gap-6 px-8 pb-6 pt-8",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-hairline" />

      <div className="min-w-0 flex-1">
        {eyebrow && <p className="mb-1.5 text-eyebrow">{eyebrow}</p>}
        <h1 className="text-display-sm truncate text-[30px] text-ink">{title}</h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-ink-muted">{subtitle}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {right}
        {onQuickAdd && (
          <Button size="sm" onClick={onQuickAdd} className="gap-1.5 shadow-[var(--shadow-soft)]">
            <Plus className="h-4 w-4" />
            {quickAddLabel}
          </Button>
        )}
      </div>
    </header>
  );
}
