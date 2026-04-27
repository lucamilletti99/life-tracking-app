import { addDays, differenceInCalendarDays, format, isAfter, parseISO } from "date-fns";

import { SKIPPED_LOG_NOTE } from "./habit-status";
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

export interface GoalTrajectoryMessage {
  title: string;
  detail: string;
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay));
}

function iso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function inGoalRange(goal: Goal, logs: LogEntry[]): LogEntry[] {
  return logs.filter(
    (l) =>
      l.entry_date >= goal.start_date &&
      l.entry_date <= goal.end_date &&
      l.numeric_value != null &&
      l.note !== SKIPPED_LOG_NOTE,
  );
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

export function calculateGoalProgress(
  goal: Goal,
  logs: LogEntry[],
  linkedSourceIds?: string[],
  asOf?: Date | string,
): GoalProgress {
  const asOfDate = asOf
    ? (asOf instanceof Date ? asOf : new Date(`${asOf}T00:00:00`)).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const inDateRange = inGoalRange(goal, logs);

  const inRange =
    linkedSourceIds != null
      ? inDateRange.filter(
          (l) =>
            (l.source_id != null && linkedSourceIds.includes(l.source_id)) ||
            (l.goal_ids ?? []).includes(goal.id),
        )
      : inDateRange;

  let current_value: number;
  let percentage: number;
  let is_on_track: boolean;
  let is_completed: boolean;

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
    is_completed =
      inRange.length > 0 &&
      (baseline > goal.target_value
        ? current_value <= goal.target_value
        : current_value >= goal.target_value);
  } else if (goal.goal_type === "accumulation") {
    current_value = inRange.reduce((sum, log) => sum + (log.numeric_value ?? 0), 0);
    percentage = Math.round(Math.min((current_value / goal.target_value) * 100, 100));
    const totalDays = daysBetween(goal.start_date, goal.end_date);
    const elapsedDays = daysBetween(goal.start_date, asOfDate);
    const expectedPace =
      totalDays === 0 ? goal.target_value : (elapsedDays / totalDays) * goal.target_value;
    is_on_track = current_value >= expectedPace;
    is_completed = inRange.length > 0 && current_value >= goal.target_value;
  } else {
    current_value = inRange.reduce((sum, l) => sum + (l.numeric_value ?? 0), 0);
    percentage = Math.max(0, Math.round((1 - current_value / goal.target_value) * 100));
    is_on_track = current_value <= goal.target_value;
    is_completed = goal.end_date <= asOfDate && current_value <= goal.target_value;
  }

  return { goal, current_value, percentage, is_on_track, is_completed };
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
        : currentDelta <= expectedDelta * 0.9
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

function toProgressDelta(goal: Goal, delta: number): number {
  if (goal.goal_type === "accumulation") return delta;
  if (goal.goal_type === "limit") return -delta;

  const baseline = goal.baseline_value ?? 0;
  return baseline <= goal.target_value ? delta : -delta;
}

function isTrendImproving(goal: Goal, trajectory: GoalTrajectory): boolean {
  if (trajectory.series.length < 4) return false;

  let activeEndIndex = trajectory.series.length - 1;
  while (
    activeEndIndex > 0 &&
    trajectory.series[activeEndIndex].actual === trajectory.series[activeEndIndex - 1].actual
  ) {
    activeEndIndex -= 1;
  }

  const recentStart = Math.max(0, activeEndIndex - 2);
  const priorStart = Math.max(0, recentStart - 3);

  const recentDelta =
    trajectory.series[activeEndIndex].actual - trajectory.series[recentStart].actual;
  const priorDelta =
    trajectory.series[recentStart].actual - trajectory.series[priorStart].actual;

  const recentProgress = toProgressDelta(goal, recentDelta);
  const priorProgress = toProgressDelta(goal, priorDelta);

  return recentProgress > 0 && recentProgress >= priorProgress;
}

export function buildGoalTrajectoryMessage(
  goal: Goal,
  trajectory: GoalTrajectory,
): GoalTrajectoryMessage {
  if (trajectory.paceLabel === "ahead") {
    return {
      title: "Compounding in progress",
      detail:
        "You are ahead of pace. Keep the system stable and protect this momentum.",
    };
  }

  if (trajectory.paceLabel === "on_track") {
    return {
      title: "Steady momentum",
      detail: trajectory.projectedCompletionDate
        ? `At current pace, target date: ${trajectory.projectedCompletionDate}.`
        : "At current pace, you are tracking to finish on time.",
    };
  }

  if (isTrendImproving(goal, trajectory)) {
    return {
      title: "Compounding in progress",
      detail:
        "You are behind pace, but your recent trend is improving. Keep stacking consistent reps.",
    };
  }

  if (goal.goal_type === "limit" && trajectory.projectedEndValue > goal.target_value) {
    return {
      title: "Course-correct now",
      detail: `At current pace, projected total is ${trajectory.projectedEndValue.toLocaleString(
        undefined,
        { maximumFractionDigits: 1 },
      )} ${goal.unit}, above your limit.`,
    };
  }

  return {
    title: "Rebuild momentum",
    detail: trajectory.projectedCompletionDate
      ? `At current pace, target date: ${trajectory.projectedCompletionDate}.`
      : "At current pace, this goal is behind schedule. Reset with a smaller minimum action today.",
  };
}
