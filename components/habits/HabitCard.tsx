import { Flame, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Habit } from "@/lib/types";
import type { HabitTodayState } from "@/lib/habit-insights";

const recurrenceLabel: Record<string, string> = {
  daily: "Every day",
  weekdays: "Selected days",
  times_per_week: "X/week",
  times_per_month: "X/month",
  day_of_month: "Day of month",
};

const statusLabel: Record<HabitTodayState, string> = {
  done: "Done",
  due: "Pending",
  optional: "Optional",
  not_due: "Not due",
  paused: "Paused",
};

const statusVariant: Record<HabitTodayState, "default" | "secondary" | "outline"> = {
  done: "default",
  due: "outline",
  optional: "secondary",
  not_due: "secondary",
  paused: "secondary",
};

interface HabitCardProps {
  habit: Habit;
  status: HabitTodayState;
  currentStreak: number;
  completionRate30d: number;
  linkedGoalTitles: string[];
  stackCueFromTitles?: string[];
  busy?: boolean;
  onEdit?: (e: React.MouseEvent) => void;
  onQuickComplete?: () => void;
  onQuickLog?: () => void;
  onTogglePause?: () => void;
}

export function HabitCard({
  habit,
  status,
  currentStreak,
  completionRate30d,
  linkedGoalTitles,
  stackCueFromTitles = [],
  busy = false,
  onEdit,
  onQuickComplete,
  onQuickLog,
  onTogglePause,
}: HabitCardProps) {
  const hasStackCue = stackCueFromTitles.length > 0;

  return (
    <div
      className={`w-full rounded-xl border bg-white p-4 shadow-sm ${
        hasStackCue ? "border-amber-300 ring-1 ring-amber-100" : "border-neutral-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">{habit.title}</p>
          <p className="mt-0.5 truncate text-xs text-neutral-400">
            {recurrenceLabel[habit.recurrence_type]} - {habit.tracking_type}
            {habit.unit ? ` (${habit.unit})` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(e);
              }}
              className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            >
              <Pencil size={14} />
            </button>
          )}
          <Badge variant="secondary" className="text-xs capitalize">{habit.tracking_type}</Badge>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={statusVariant[status]} className="text-[11px]">
          {statusLabel[status]}
        </Badge>
        <Badge variant="secondary" className="text-[11px]">
          <Flame className="mr-1 h-3 w-3" /> {currentStreak}
        </Badge>
        <Badge variant="outline" className="text-[11px]">
          {completionRate30d}% · 30d
        </Badge>
        {hasStackCue && (
          <Badge variant="outline" className="border-amber-300 text-[11px] text-amber-700">
            Stack up next
          </Badge>
        )}
      </div>

      {hasStackCue && (
        <p className="mt-2 truncate text-xs text-amber-700">
          After: {stackCueFromTitles[0]}
          {stackCueFromTitles.length > 1 ? ` +${stackCueFromTitles.length - 1}` : ""}
        </p>
      )}

      {linkedGoalTitles.length > 0 && (
        <p className="mt-2 truncate text-xs text-neutral-500">
          Goal: {linkedGoalTitles[0]}
          {linkedGoalTitles.length > 1 ? ` +${linkedGoalTitles.length - 1} more` : ""}
        </p>
      )}

      {habit.identity_statement && (
        <p className="mt-1 truncate text-xs text-neutral-600">
          {habit.identity_statement}
        </p>
      )}

      {(habit.cue_time || habit.cue_context || habit.cue_location) && (
        <p className="mt-1 truncate text-[11px] text-neutral-500">
          Cue: {habit.cue_time ? `${habit.cue_time} · ` : ""}
          {habit.cue_context ? `${habit.cue_context} · ` : ""}
          {habit.cue_location ?? ""}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        {habit.tracking_type === "boolean" ? (
          <Button
            size="sm"
            className="h-7"
            onClick={onQuickComplete}
            disabled={busy || status === "done" || status === "paused"}
          >
            {busy ? "Saving..." : "Complete"}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={onQuickLog}
            disabled={busy || status === "paused"}
          >
            Log
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-7"
          onClick={onTogglePause}
        >
          {habit.is_paused ? "Resume" : "Pause"}
        </Button>
      </div>
    </div>
  );
}
