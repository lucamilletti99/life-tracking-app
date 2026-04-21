import {
  addDays,
  differenceInCalendarDays,
  format,
  isAfter,
  parseISO,
} from "date-fns";

import type { Goal, GoalProgress, LogEntry } from "./types";

export interface GoalTrajectoryPoint {
  date: string;
  actual: number;
  expected: number;
}

export interface GoalTrajectory {
  current: number;
  expectedByNow: number;
  projectedEndValue: number;
  projectedCompletionDate: string | null;
  paceLabel: "ahead" | "on_track" | "behind";
  series: GoalTrajectoryPoint[];
}

function inGoalRange(goal: Goal, logs: LogEntry[]): LogEntry[] {
  return logs.filter(
    (log) =>
      log.entry_date >= goal.start_date &&
      log.entry_date <= goal.end_date &&
      log.numeric_value != null,
  );
}

function iso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function elapsedRatio(goal: Goal, asOfDate: string): { elapsedDays: number; totalDays: number; ratio: number } {
  const start = parseISO(goal.start_date);
  const end = parseISO(goal.end_date);
  const asOf = parseISO(`${asOfDate}T00:00:00`);

  const totalDays = Math.max(differenceInCalendarDays(end, start) + 1, 1);
  const elapsedDays = Math.min(
    Math.max(differenceInCalendarDays(asOf, start) + 1, 1),
    totalDays,
  );

  return {
    elapsedDays,
    totalDays,
    ratio: elapsedDays / totalDays,
  };
}

export function calculateGoalProgress(goal: Goal, logs: LogEntry[]): GoalProgress {
  const inRange = inGoalRange(goal, logs);

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
    current_value = inRange.reduce((sum, log) => sum + (log.numeric_value ?? 0), 0);
    percentage = Math.round(Math.min((current_value / goal.target_value) * 100, 100));
    is_on_track = current_value <= goal.target_value;
  } else {
    current_value = inRange.reduce((sum, log) => sum + (log.numeric_value ?? 0), 0);
    percentage = Math.round(Math.min((current_value / goal.target_value) * 100, 100));
    is_on_track = current_value <= goal.target_value;
  }

  return { goal, current_value, percentage, is_on_track };
}

export function buildGoalTrajectory(
  goal: Goal,
  logs: LogEntry[],
  asOfDate: string,
): GoalTrajectory {
  const inRange = inGoalRange(goal, logs).sort((a, b) => a.entry_date.localeCompare(b.entry_date));
  const { elapsedDays, totalDays, ratio } = elapsedRatio(goal, asOfDate);

  const start = parseISO(goal.start_date);
  const end = parseISO(goal.end_date);

  const series: GoalTrajectoryPoint[] = [];

  if (goal.goal_type === "accumulation" || goal.goal_type === "limit") {
    let running = 0;
    let cursor = start;

    while (!isAfter(cursor, end)) {
      const day = iso(cursor);
      running += inRange
        .filter((log) => log.entry_date === day)
        .reduce((sum, log) => sum + (log.numeric_value ?? 0), 0);

      const expected = goal.target_value * ((differenceInCalendarDays(cursor, start) + 1) / totalDays);
      series.push({ date: day, actual: running, expected: Number(expected.toFixed(2)) });
      cursor = addDays(cursor, 1);
    }

    const current = inRange.reduce((sum, log) => sum + (log.numeric_value ?? 0), 0);
    const expectedByNow = goal.target_value * ratio;
    const projectedEndValue = (current / elapsedDays) * totalDays;

    const paceLabel =
      goal.goal_type === "accumulation"
        ? current >= expectedByNow * 1.05
          ? "ahead"
          : current >= expectedByNow * 0.9
            ? "on_track"
            : "behind"
        : current <= expectedByNow * 0.95
          ? "ahead"
          : current <= expectedByNow * 1.1
            ? "on_track"
            : "behind";

    let projectedCompletionDate: string | null = null;
    if (goal.goal_type === "accumulation") {
      const perDay = current / elapsedDays;
      if (perDay > 0) {
        const daysNeeded = Math.ceil(goal.target_value / perDay);
        projectedCompletionDate = iso(addDays(start, Math.max(daysNeeded - 1, 0)));
      }
    } else {
      projectedCompletionDate = projectedEndValue <= goal.target_value ? goal.end_date : null;
    }

    return {
      current,
      expectedByNow,
      projectedEndValue,
      projectedCompletionDate,
      paceLabel,
      series,
    };
  }

  const baseline = goal.baseline_value ?? 0;
  let currentValue = baseline;
  let cursor = start;

  while (!isAfter(cursor, end)) {
    const day = iso(cursor);
    const logsForDay = inRange.filter((log) => log.entry_date <= day);
    const latest = logsForDay[logsForDay.length - 1];
    if (latest?.numeric_value != null) {
      currentValue = latest.numeric_value;
    }

    const expected = baseline + (goal.target_value - baseline) * ((differenceInCalendarDays(cursor, start) + 1) / totalDays);
    series.push({ date: day, actual: currentValue, expected: Number(expected.toFixed(2)) });
    cursor = addDays(cursor, 1);
  }

  const latestLog = [...inRange].sort((a, b) => b.entry_datetime.localeCompare(a.entry_datetime))[0];
  const current = latestLog?.numeric_value ?? baseline;
  const expectedByNow = baseline + (goal.target_value - baseline) * ratio;
  const projectedEndValue = baseline + ((current - baseline) / elapsedDays) * totalDays;

  const targetDelta = goal.target_value - baseline;
  const currentDelta = current - baseline;
  const expectedDelta = expectedByNow - baseline;

  const paceLabel =
    targetDelta >= 0
      ? currentDelta >= expectedDelta * 1.05
        ? "ahead"
        : currentDelta >= expectedDelta * 0.9
          ? "on_track"
          : "behind"
      : currentDelta <= expectedDelta * 1.05
        ? "ahead"
        : currentDelta <= expectedDelta * 1.1
          ? "on_track"
          : "behind";

  const perDay = (current - baseline) / elapsedDays;
  let projectedCompletionDate: string | null = null;
  if (perDay !== 0) {
    const daysNeeded = Math.ceil((goal.target_value - baseline) / perDay);
    projectedCompletionDate = iso(addDays(start, Math.max(daysNeeded - 1, 0)));
  }

  return {
    current,
    expectedByNow,
    projectedEndValue,
    projectedCompletionDate,
    paceLabel,
    series,
  };
}
