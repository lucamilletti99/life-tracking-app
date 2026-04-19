import type { Goal, GoalProgress, LogEntry } from "./types";

export function calculateGoalProgress(goal: Goal, logs: LogEntry[]): GoalProgress {
  const inRange = logs.filter(
    (l) =>
      l.entry_date >= goal.start_date &&
      l.entry_date <= goal.end_date &&
      l.numeric_value != null,
  );

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
    const delta = isDescending
      ? baseline - current_value
      : current_value - baseline;
    const progress = range === 0 ? 0 : delta / range;

    percentage = Math.round(Math.min(progress * 100, 100));
    is_on_track =
      baseline > goal.target_value
        ? current_value <= baseline
        : current_value >= baseline;
  } else if (goal.goal_type === "accumulation") {
    current_value = inRange.reduce((sum, l) => sum + (l.numeric_value ?? 0), 0);
    percentage = Math.round(Math.min((current_value / goal.target_value) * 100, 100));
    is_on_track = current_value <= goal.target_value;
  } else {
    current_value = inRange.reduce((sum, l) => sum + (l.numeric_value ?? 0), 0);
    percentage = Math.round(Math.min((current_value / goal.target_value) * 100, 100));
    is_on_track = current_value <= goal.target_value;
  }

  return { goal, current_value, percentage, is_on_track };
}
