import { SKIPPED_LOG_NOTE } from "./habit-status";
import type { Goal, GoalProgress, LogEntry } from "./types";

function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay));
}

export function calculateGoalProgress(
  goal: Goal,
  logs: LogEntry[],
  linkedSourceIds?: string[],
  asOf?: Date | string,
): GoalProgress {
  const inDateRange = logs.filter(
    (l) =>
      l.entry_date >= goal.start_date &&
      l.entry_date <= goal.end_date &&
      l.numeric_value != null &&
      l.note !== SKIPPED_LOG_NOTE,
  );

  const inRange =
    linkedSourceIds != null
      ? inDateRange.filter(
          (l) =>
            (l.source_id != null && linkedSourceIds.includes(l.source_id)) ||
            l.goal_ids.includes(goal.id),
        )
      : inDateRange;

  let current_value: number;
  let percentage: number;
  let is_on_track: boolean;

  if (goal.goal_type === "target") {
    const sorted = [...inRange].sort((a, b) =>
      b.entry_datetime.localeCompare(a.entry_datetime),
    );
    current_value = sorted[0]?.numeric_value ?? goal.baseline_value ?? 0;

    const baseline = goal.baseline_value ?? 0;
    const isDescending = baseline > goal.target_value;
    const range = Math.abs(goal.target_value - baseline);
    const delta = isDescending ? baseline - current_value : current_value - baseline;
    const progress = range === 0 ? 0 : delta / range;

    percentage = Math.round(Math.min(progress * 100, 100));
    is_on_track =
      baseline > goal.target_value ? current_value <= baseline : current_value >= baseline;
  } else if (goal.goal_type === "accumulation") {
    current_value = inRange.reduce((sum, l) => sum + (l.numeric_value ?? 0), 0);
    percentage = Math.round(Math.min((current_value / goal.target_value) * 100, 100));
    const today = asOf
      ? (asOf instanceof Date ? asOf : new Date(`${asOf}T00:00:00`)).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    const totalDays = daysBetween(goal.start_date, goal.end_date);
    const elapsedDays = daysBetween(goal.start_date, today);
    const expectedPace =
      totalDays === 0 ? goal.target_value : (elapsedDays / totalDays) * goal.target_value;
    is_on_track = current_value >= expectedPace;
  } else {
    // limit
    current_value = inRange.reduce((sum, l) => sum + (l.numeric_value ?? 0), 0);
    percentage = Math.max(0, Math.round((1 - current_value / goal.target_value) * 100));
    is_on_track = current_value < goal.target_value;
  }

  return { goal, current_value, percentage, is_on_track };
}
