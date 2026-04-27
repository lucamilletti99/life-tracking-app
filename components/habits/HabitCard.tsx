import { useState } from "react";
import { ChevronDown, Flame, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Habit } from "@/lib/types";
import {
  getAlignedHeatmapWindow,
  type HabitHeatmapCell,
  type HabitTodayState,
} from "@/lib/habit-insights";

function buildRecurrenceLabel(habit: Habit): string {
  const n = habit.recurrence_config?.times_per_period ?? 1;
  switch (habit.recurrence_type) {
    case "daily":           return "Every day";
    case "weekdays":        return "Selected days";
    case "times_per_week":  return `${n}× / week`;
    case "times_per_month": return `${n}× / month`;
    case "day_of_month":    return "Day of month";
    default:                return habit.recurrence_type;
  }
}

/** How many times per week should this habit fire (used for "Y/Z this week"). */
function computeWeeklyTarget(habit: Habit): number {
  switch (habit.recurrence_type) {
    case "daily":           return 7;
    case "weekdays":        return (habit.recurrence_config.weekdays ?? []).length || 5;
    case "times_per_week":  return habit.recurrence_config.times_per_period ?? 1;
    case "day_of_month":    return 1;
    case "times_per_month": return habit.recurrence_config.times_per_period ?? 1;
    default:                return 1;
  }
}

const statusLabel: Record<HabitTodayState, string> = {
  done:     "Done",
  skipped:  "Skipped",
  failed:   "Failed",
  due:      "Due",
  optional: "Optional",
  not_due:  "Not due",
  paused:   "Paused",
};

// ─── Activity dot grid ───────────────────────────────────────────────────────

const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"] as const;

function getDayInitial(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return DAY_INITIALS[new Date(y, m - 1, d).getDay()];
}

function cellTooltip(cell: HabitHeatmapCell): string {
  if (cell.status === "complete") {
    if (cell.value != null) {
      const v = cell.value.toLocaleString(undefined, { maximumFractionDigits: 2 });
      return `${cell.date} · ${v}${cell.unit ? ` ${cell.unit}` : ""}`;
    }
    return `${cell.date} · done`;
  }
  if (cell.status === "skipped") return `${cell.date} · skipped`;
  if (cell.status === "failed") return `${cell.date} · failed`;
  return cell.date;
}

function DotGrid({
  cells,
  onLogDate,
  compact = false,
}: {
  cells: HabitHeatmapCell[];
  onLogDate?: (date: string) => void;
  compact?: boolean;
}) {
  const tileSize = compact ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-[10.5px]";
  const gap = compact ? "gap-[5px]" : "gap-1.5";

  const tileTone: Record<HabitHeatmapCell["status"], string> = {
    complete: "bg-ember text-white",
    failed: "bg-destructive/80 text-white",
    skipped: "border border-hairline bg-surface-elevated text-ink",
    none: "border border-hairline bg-background text-ink-subtle",
  };

  return (
    <div className={cn("flex flex-col", compact ? "gap-1" : "gap-[3px]")}>
      {Array.from({ length: Math.ceil(cells.length / 7) }, (_, wi) => (
        <div key={wi} className={cn("flex", gap)}>
          {cells.slice(wi * 7, wi * 7 + 7).map((cell) => (
            <button
              key={cell.date}
              type="button"
              title={cellTooltip(cell)}
              aria-label={cellTooltip(cell)}
              onClick={() => onLogDate?.(cell.date)}
              className={cn(
                "flex items-center justify-center rounded-[5px] font-medium tabular-nums transition-opacity focus:outline-none",
                tileSize,
                tileTone[cell.status],
                onLogDate ? "cursor-pointer" : "cursor-default",
                onLogDate && "hover:opacity-80",
              )}
            >
              {getDayInitial(cell.date)}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── HabitCard ───────────────────────────────────────────────────────────────

interface HabitCardProps {
  habit: Habit;
  status: HabitTodayState;
  currentStreak: number;
  missedYesterday?: boolean;
  completionRate30d: number;
  linkedGoalTitles: string[];
  stackCueFromTitles?: string[];
  heatmap?: HabitHeatmapCell[];
  celebrate?: boolean;
  busy?: boolean;
  onEdit?: (e: React.MouseEvent) => void;
  onQuickComplete?: () => void;
  onQuickLog?: () => void;
  onTogglePause?: () => void;
  onLogDate?: (date: string) => void;
}

export function HabitCard({
  habit,
  status,
  currentStreak,
  missedYesterday = false,
  completionRate30d,
  linkedGoalTitles,
  stackCueFromTitles = [],
  heatmap,
  celebrate = false,
  busy = false,
  onEdit,
  onQuickComplete,
  onQuickLog,
  onTogglePause,
  onLogDate,
}: HabitCardProps) {
  const [detailsOpen, setDetailsOpen]   = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(false);

  const hasStackCue         = stackCueFromTitles.length > 0;
  const hasNeverMissTwice   =
    missedYesterday && status !== "done" && status !== "paused" && status !== "failed";
  const hasAlert            = hasStackCue || hasNeverMissTwice;
  const hasDeepDetails      = Boolean(
    habit.cue_time ||
    habit.cue_context ||
    habit.cue_location ||
    habit.recurrence_config.duration_minutes,
  );

  const containerClass = celebrate
    ? "border-ember bg-ember-soft"
    : status === "failed"
      ? "border-destructive/45 bg-destructive/5"
    : hasNeverMissTwice
      ? "border-amber-200/70 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/20"
      : hasStackCue
        ? "border-ember/60"
        : "border-hairline";

  // Monday-anchored activity windows
  const heatmapToday = heatmap?.[heatmap.length - 1]?.date;
  const last7  = heatmapToday && heatmap ? getAlignedHeatmapWindow(heatmap, heatmapToday, 1) : [];
  const last28 = heatmapToday && heatmap ? getAlignedHeatmapWindow(heatmap, heatmapToday, 4) : [];

  // "Y/Z this week" — completions vs recurrence target for the current week
  const weeklyTarget = computeWeeklyTarget(habit);
  const thisWeekCompletions = last7.filter((c) => c.status === "complete").length;

  return (
    <div
      data-status={status}
      data-alert={hasAlert ? "true" : undefined}
      className={cn(
        "group/card flex w-full flex-col rounded-2xl border bg-surface p-4 transition-chrome",
        containerClass,
        "hover:border-hairline-strong hover:shadow-[var(--shadow-soft)]",
      )}
    >
      {/* ── Title row ── */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-eyebrow">{statusLabel[status]}</p>
          <p className="mt-0.5 truncate text-[14.5px] font-medium text-ink">{habit.title}</p>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(e); }}
            className="shrink-0 rounded-md p-1 text-ink-subtle transition-chrome hover:bg-accent hover:text-ink"
          >
            <Pencil size={13} />
          </button>
        )}
      </div>

      {/* ── Metadata line: goal · recurrence (condensed) ── */}
      <p className="mt-0.5 truncate text-[11.5px] text-ink-subtle">
        {linkedGoalTitles.length > 0
          ? <span className="text-ink-muted">{linkedGoalTitles[0]}</span>
          : buildRecurrenceLabel(habit)
        }
        {linkedGoalTitles.length > 0 && (
          <> · {buildRecurrenceLabel(habit)}</>
        )}
        {habit.unit ? <> · {habit.unit}</> : null}
      </p>

      {/* ── Metrics row: this week + streak ── */}
      <div className="mt-2 flex items-center gap-2">
        {/* This week progress */}
        <span className={cn(
          "text-[12.5px] font-semibold tabular-nums",
          thisWeekCompletions > 0 ? "text-ink" : "text-ink-subtle",
        )}>
          {thisWeekCompletions}
          <span className="font-normal text-ink-subtle">/{weeklyTarget}</span>
        </span>
        <span className="text-[11px] text-ink-subtle">this week</span>
        <span className="text-[10px] text-ink-subtle">·</span>
        <span className={cn(
          "flex items-center gap-0.5 text-[11.5px]",
          currentStreak > 0 ? "text-ember" : "text-ink-subtle",
        )}>
          <Flame className="h-3 w-3" strokeWidth={2.25} />
          <span className="font-semibold">{currentStreak}</span>
        </span>
        <span className="text-[10px] text-ink-subtle">·</span>
        <span className="text-[11px] text-ink-subtle">{completionRate30d}%</span>
      </div>

      {/* ── Alerts ── */}
      {hasAlert && (
        <div className="mt-2 space-y-0.5">
          {hasStackCue && (
            <p className="truncate text-[11.5px] text-ember">
              Stack after: {stackCueFromTitles[0]}
              {stackCueFromTitles.length > 1 ? ` +${stackCueFromTitles.length - 1}` : ""}
            </p>
          )}
          {hasNeverMissTwice && (
            <p className="text-[11.5px] text-ember">
              Missed yesterday — today protects the streak.
            </p>
          )}
        </div>
      )}

      {/* ── Action row ── */}
      <div className="mt-3.5 flex items-center gap-1.5">
        {habit.tracking_type === "boolean" ? (
          <Button
            size="sm"
            className="h-7 flex-1 text-xs"
            onClick={onQuickComplete}
            disabled={busy || status === "done" || status === "paused"}
          >
            {busy ? "Saving…" : status === "done" ? "Done" : "Complete"}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7 flex-1 text-xs"
            onClick={onQuickLog}
            disabled={busy || status === "paused"}
          >
            {habit.unit ? `Log ${habit.unit}` : "Log today"}
          </Button>
        )}
        <button
          type="button"
          onClick={onTogglePause}
          className="shrink-0 rounded-md px-2.5 py-1 text-[11.5px] text-ink-muted transition-chrome hover:bg-accent hover:text-ink"
        >
          {habit.is_paused ? "Resume" : "Pause"}
        </button>
        {hasDeepDetails && (
          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            className="ml-auto rounded-md p-1 text-ink-subtle transition-chrome hover:text-ink"
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                detailsOpen && "rotate-180",
              )}
            />
          </button>
        )}
      </div>

      {/* ── Expandable deep details (identity, cue) ── */}
      {detailsOpen && hasDeepDetails && (
        <div className="mt-2.5 space-y-1.5 border-t border-hairline pt-2.5">
          {(habit.cue_time || habit.cue_location) && (
            <p className="truncate text-[11px] text-ink-subtle">
              Time &amp; place:
              {habit.cue_time ? ` ${habit.cue_time.slice(0, 5)}` : " Any time"}
              {habit.cue_location ? ` · ${habit.cue_location}` : ""}
            </p>
          )}
          <p className="text-[11px] text-ink-subtle">
            Duration: {habit.recurrence_config.duration_minutes ?? 30} min
          </p>
          {habit.cue_context && (
            <p className="line-clamp-2 text-[11px] text-ink-subtle">
              Context: {habit.cue_context}
            </p>
          )}
        </div>
      )}

      {/* ── Activity strip — always visible when heatmap available ── */}
      {last7.length > 0 && (
        <div className="mt-3 border-t border-hairline pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-ink-subtle">
              {activityExpanded ? "4 weeks" : "This week"}
            </span>
            {last28.length > 7 && (
              <button
                type="button"
                onClick={() => setActivityExpanded((v) => !v)}
                className="flex items-center gap-0.5 text-[10.5px] text-ink-subtle transition-chrome hover:text-ink"
              >
                {activityExpanded ? "Show less" : "4 weeks"}
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    activityExpanded && "rotate-180",
                  )}
                />
              </button>
            )}
          </div>
          <DotGrid
            cells={activityExpanded ? last28 : last7}
            onLogDate={onLogDate}
            compact={!activityExpanded}
          />
        </div>
      )}
    </div>
  );
}
