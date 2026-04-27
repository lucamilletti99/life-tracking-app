import { endOfMonth, endOfWeek, min } from "date-fns";

import { buildGoalTrajectory, calculateGoalProgress } from "@/lib/goal-calculations";
import { getHabitLogStatusMap } from "@/lib/habit-status";
import { getOccurrencesInRange } from "@/lib/recurrence";
import { computeStreak } from "@/lib/streak";
import type { Goal, Habit, HabitGoalLink, LogEntry } from "@/lib/types";

import {
  buildBucketSequence,
  bucketStartIso,
  clampAnalyticsRange,
  rangeIncludes,
} from "./timeframe";
import type {
  AnalyticsGranularity,
  AnalyticsProgressModel,
  AnalyticsRange,
  HabitCompletionTrendPoint,
  HabitNumericSeries,
  HabitProgressModel,
} from "./types";

interface BuildAnalyticsProgressInput {
  goals: Goal[];
  habits: Habit[];
  logs: LogEntry[];
  habitGoalLinks: HabitGoalLink[];
  range: AnalyticsRange;
  granularity: AnalyticsGranularity;
}

function toGoalSourceMap(links: HabitGoalLink[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const link of links) {
    const ids = map.get(link.goal_id) ?? [];
    ids.push(link.habit_id);
    map.set(link.goal_id, ids);
  }
  return map;
}

function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function isNumericTrackingType(trackingType: Habit["tracking_type"]): boolean {
  return trackingType !== "boolean";
}

function habitCompletionTrend(
  habit: Habit,
  logs: LogEntry[],
  range: AnalyticsRange,
  granularity: AnalyticsGranularity,
): {
  points: HabitCompletionTrendPoint[];
  completionRate: number;
  completedExpected: number;
} {
  const statusMap = getHabitLogStatusMap(logs, [habit]);
  const expected = getOccurrencesInRange(habit, range.startDate, range.endDate);
  const completedExpected = expected.filter((date) => statusMap.get(`${habit.id}|${date}`) === "complete").length;
  const completionRate = expected.length === 0 ? 0 : clampPercentage((completedExpected / expected.length) * 100);

  const buckets = buildBucketSequence(range, granularity);
  const points = buckets.map(({ bucketStart, bucketEnd }) => {
    const effectiveEnd = min([new Date(`${bucketEnd}T00:00:00`), new Date(`${range.endDate}T00:00:00`)]);
    const effectiveEndIso = effectiveEnd.toISOString().slice(0, 10);
    const expectedInBucket = getOccurrencesInRange(
      habit,
      bucketStart,
      effectiveEndIso,
    ).filter((date) => rangeIncludes(date, range));

    const completed = expectedInBucket.filter((date) => statusMap.get(`${habit.id}|${date}`) === "complete").length;

    return {
      bucketStart,
      bucketEnd: effectiveEndIso,
      completed,
      expected: expectedInBucket.length,
      rate: expectedInBucket.length === 0 ? 0 : clampPercentage((completed / expectedInBucket.length) * 100),
    };
  });

  return {
    points,
    completionRate,
    completedExpected,
  };
}

function habitNumericSeries(
  habit: Habit,
  logs: LogEntry[],
  range: AnalyticsRange,
  granularity: AnalyticsGranularity,
): HabitNumericSeries | null {
  if (!isNumericTrackingType(habit.tracking_type)) return null;

  const logsForHabit = logs.filter(
    (log) =>
      log.source_type === "habit" &&
      log.source_id === habit.id &&
      rangeIncludes(log.entry_date, range) &&
      log.numeric_value != null,
  );

  const buckets = buildBucketSequence(range, granularity);
  const valuesByBucket = new Map<string, number[]>();

  for (const log of logsForHabit) {
    const bucket = bucketStartIso(log.entry_date, granularity);
    const values = valuesByBucket.get(bucket) ?? [];
    values.push(log.numeric_value ?? 0);
    valuesByBucket.set(bucket, values);
  }

  const points = buckets.map(({ bucketStart, bucketEnd }) => {
    const values = valuesByBucket.get(bucketStart) ?? [];
    const value = values.length > 0
      ? values.reduce((sum, item) => sum + item, 0) / values.length
      : null;

    return {
      bucketStart,
      bucketEnd,
      value: value == null ? null : Number(value.toFixed(2)),
    };
  });

  return {
    unit: habit.unit ?? logsForHabit.find((log) => log.unit)?.unit ?? "value",
    points,
  };
}

function sortHabitsBestFirst(habits: HabitProgressModel[]): HabitProgressModel[] {
  return [...habits].sort((a, b) => {
    if (b.completionRate !== a.completionRate) {
      return b.completionRate - a.completionRate;
    }

    if (b.streakCurrent !== a.streakCurrent) {
      return b.streakCurrent - a.streakCurrent;
    }

    return a.habit.title.localeCompare(b.habit.title);
  });
}

function sortGoalsBestFirst(goals: AnalyticsProgressModel["goals"]): AnalyticsProgressModel["goals"] {
  const paceRank: Record<string, number> = {
    ahead: 3,
    on_track: 2,
    behind: 1,
  };

  return [...goals].sort((a, b) => {
    const byPace = (paceRank[b.paceLabel] ?? 0) - (paceRank[a.paceLabel] ?? 0);
    if (byPace !== 0) return byPace;

    if (b.completionPercent !== a.completionPercent) {
      return b.completionPercent - a.completionPercent;
    }

    return a.goal.title.localeCompare(b.goal.title);
  });
}

export function buildAnalyticsProgressModel(input: BuildAnalyticsProgressInput): AnalyticsProgressModel {
  const range = clampAnalyticsRange(input.range);
  const goalSourceMap = toGoalSourceMap(input.habitGoalLinks);

  const habitRows = input.habits.map((habit) => {
    const completion = habitCompletionTrend(habit, input.logs, range, input.granularity);
    const numericSeries = habitNumericSeries(habit, input.logs, range, input.granularity);
    const streak = computeStreak(
      habit.id,
      habit.recurrence_type,
      habit.recurrence_config,
      input.logs,
      range.endDate,
    );

    const hasNumericProgress = numericSeries?.points.some((point) => point.value != null) ?? false;
    const hasProgress = completion.completedExpected > 0 || hasNumericProgress;

    return {
      habit,
      completionRate: completion.completionRate,
      streakCurrent: streak.current,
      streakBest: streak.best,
      hasProgress,
      completionTrend: completion.points,
      numericSeries,
    };
  });

  const goalRows = input.goals.map((goal) => {
    const trajectory = buildGoalTrajectory(goal, input.logs, range.endDate);
    const progress = calculateGoalProgress(
      goal,
      input.logs,
      goalSourceMap.get(goal.id),
      range.endDate,
    );

    return {
      goal,
      completionPercent: progress.percentage,
      paceLabel: trajectory.paceLabel,
      trajectory,
    };
  });

  return {
    range,
    granularity: input.granularity,
    habits: sortHabitsBestFirst(habitRows),
    goals: sortGoalsBestFirst(goalRows),
  };
}
