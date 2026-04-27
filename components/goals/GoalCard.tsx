import { format, parseISO } from "date-fns";
import { Pencil } from "lucide-react";

import type { GoalHabitExecutionSummary } from "@/lib/goal-habit-execution";
import type { GoalProgress } from "@/lib/types";

import { GoalProgressBar } from "./GoalProgressBar";

interface GoalCardProps {
  progress: GoalProgress;
  onClick: () => void;
  onHover?: () => void;
  executionSummary?: GoalHabitExecutionSummary;
  onEdit?: (e: React.MouseEvent | React.KeyboardEvent) => void;
}

const typeLabel: Record<string, string> = {
  target: "Target",
  accumulation: "Accumulate",
  limit: "Limit",
};

// Circumference for r=15.915 ≈ 100, so dasharray maps 0–100 directly.
function ProgressRing({
  percentage,
  isOnTrack,
  goalType,
}: {
  percentage: number;
  isOnTrack: boolean;
  goalType: string;
}) {
  const r = 15.915;
  const clamped = Math.min(100, Math.max(0, percentage));
  const color =
    goalType === "limit"
      ? clamped > 80
        ? "var(--destructive)"
        : clamped > 60
          ? "var(--ember)"
          : "var(--ink-subtle)"
      : isOnTrack
        ? "var(--ember)"
        : "var(--destructive)";

  return (
    <svg width="44" height="44" viewBox="0 0 40 40" className="shrink-0 -rotate-90">
      <circle cx="20" cy="20" r={r} fill="none" stroke="var(--hairline)" strokeWidth="3" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${clamped} 100`}
        strokeDashoffset="0"
      />
    </svg>
  );
}

export function GoalCard({ progress, onClick, onHover, executionSummary, onEdit }: GoalCardProps) {
  const { goal, current_value, percentage, is_on_track, is_completed } = progress;
  const roundedPct = Math.round(percentage);

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onFocus={onHover}
      className="group/card w-full rounded-xl border border-hairline bg-surface p-5 text-left transition-chrome hover:border-ember/35 hover:bg-ember-soft/55"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-eyebrow">{typeLabel[goal.goal_type]}</p>
          <p className="mt-1 truncate text-[15px] font-medium text-ink">{goal.title}</p>
          <p className="text-metric mt-0.5 text-[11px] text-ink-subtle">
            {format(parseISO(goal.start_date), "MMM d")} —{" "}
            {format(parseISO(goal.end_date), "MMM d, yyyy")}
          </p>
        </div>

        {/* Progress ring + edit */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="relative flex items-center justify-center">
            <ProgressRing percentage={percentage} isOnTrack={is_on_track} goalType={goal.goal_type} />
            <span
              className={`absolute text-[10px] font-semibold tabular-nums ${is_on_track ? "text-ember" : "text-destructive"}`}
            >
              {roundedPct}%
            </span>
          </div>
          {onEdit && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(e);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  onEdit(e);
                }
              }}
              className="rounded-md p-1 text-ink-subtle transition-chrome hover:bg-muted hover:text-ink"
            >
              <Pencil size={14} />
            </span>
          )}
        </div>
      </div>

      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-metric text-[22px] font-medium text-ink">
          {current_value.toLocaleString()}
          <span className="ml-1 text-[12px] text-ink-subtle">{goal.unit}</span>
        </span>
        <span className="text-metric text-[11px] text-ink-subtle">
          of {goal.target_value.toLocaleString()}
        </span>
      </div>

      <GoalProgressBar
        percentage={percentage}
        isOnTrack={is_on_track}
        goalType={goal.goal_type}
      />

      <p
        className={`mt-2 text-[11px] ${
          is_completed ? "text-ember" : is_on_track ? "text-ember" : "text-destructive"
        }`}
      >
        {is_completed ? "Completed" : is_on_track ? "On track" : "Off track"}
      </p>

      {executionSummary && (
        <div className="mt-3 space-y-2 border-t border-hairline pt-3">
          {executionSummary.linkedHabits === 0 ? (
            <div className="text-[10.5px] text-ink-subtle">0 linked habits</div>
          ) : (
            <div className="flex items-center gap-2 text-[10.5px] text-ink-subtle">
              <span>{executionSummary.linkedHabits} linked habits</span>
              <span>·</span>
              <span>
                {executionSummary.completedToday}/{executionSummary.dueToday} done today
              </span>
              <span>·</span>
              <span>{executionSummary.completionRate7d}% last 7d</span>
            </div>
          )}
          <p
            className={`text-[11.5px] ${
              executionSummary.tone === "strong"
                ? "text-ember"
                : executionSummary.tone === "weak"
                  ? "text-destructive"
                  : "text-ink-muted"
            }`}
          >
            {executionSummary.summary}
          </p>
        </div>
      )}
    </button>
  );
}
