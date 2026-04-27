"use client";

import { cn } from "@/lib/utils";
import type { HabitProgressModel, HabitCompletionTrendPoint } from "@/lib/analytics/types";

// ─── Mini dot strip ───────────────────────────────────────────────────────────

function TrendDot({ point }: { point: HabitCompletionTrendPoint }) {
  const pct = point.expected === 0 ? 0 : point.completed / point.expected;

  const color =
    point.expected === 0
      ? "bg-hairline"
      : pct >= 0.8
        ? "bg-ember"
        : pct >= 0.4
          ? "bg-ember/50"
          : "bg-ink-subtle/25";

  const label = `${point.bucketStart}: ${point.completed}/${point.expected}`;

  return (
    <span
      title={label}
      className={cn("inline-block h-2 w-2 rounded-[2px] shrink-0", color)}
    />
  );
}

function TrendStrip({ points }: { points: HabitCompletionTrendPoint[] }) {
  // Show at most 28 most-recent points so the strip stays compact
  const visible = points.slice(-28);
  const rows: HabitCompletionTrendPoint[][] = [];

  for (let i = 0; i < visible.length; i += 7) {
    rows.push(visible.slice(i, i + 7));
  }

  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-[3px]">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-[3px]">
          {row.map((pt) => (
            <TrendDot key={pt.bucketStart} point={pt} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── HabitInsightCard ─────────────────────────────────────────────────────────

interface HabitInsightCardProps {
  row: HabitProgressModel;
}

export function HabitInsightCard({ row }: HabitInsightCardProps) {
  const { habit, completionRate, completionTrend, streakCurrent } = row;

  const totalCompleted = completionTrend.reduce((s, p) => s + p.completed, 0);
  const totalExpected  = completionTrend.reduce((s, p) => s + p.expected, 0);

  const rateColor =
    completionRate >= 70
      ? "text-ember"
      : completionRate >= 40
        ? "text-ink-muted"
        : "text-ink-subtle";

  return (
    <article className="surface-card flex flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-[13px] font-medium text-ink leading-snug">{habit.title}</p>
        <span className={cn("shrink-0 text-[12px] font-semibold tabular-nums", rateColor)}>
          {completionRate}%
        </span>
      </div>

      {/* Big count */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-[26px] font-bold tabular-nums text-ink leading-none">
          {totalCompleted}
        </span>
        <span className="text-[14px] text-ink-subtle">/ {totalExpected}</span>
        {streakCurrent > 0 && (
          <span className="ml-auto text-[11px] text-ember font-medium">
            🔥 {streakCurrent}
          </span>
        )}
      </div>

      {/* Dot grid */}
      <TrendStrip points={completionTrend} />
    </article>
  );
}
