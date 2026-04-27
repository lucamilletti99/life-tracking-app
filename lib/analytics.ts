import { clampAnalyticsRange } from "@/lib/analytics/timeframe";
import { buildAnalyticsProgressModel } from "@/lib/analytics/progress";
import { buildAnalyticsSummaryModel } from "@/lib/analytics/summary";
import { computeHabitCompletionRate } from "@/lib/habit-insights";

import type {
  Goal,
  Habit,
  HabitGoalLink,
  LogEntry,
  Todo,
  TodoGoalLink,
} from "./types";

export type { AnalyticsGranularity, AnalyticsControlsState } from "./analytics/types";
export * from "./analytics/index";

interface BuildAnalyticsSnapshotInput {
  goals: Goal[];
  habits: Habit[];
  todos: Todo[];
  logs: LogEntry[];
  habitGoalLinks?: HabitGoalLink[];
  todoGoalLinks?: TodoGoalLink[];
  days?: number;
  asOf?: Date | string;
}

interface DailyLogPoint {
  date: string;
  total: number;
  entries: number;
}

export interface HabitStat {
  habitId: string;
  title: string;
  currentStreak: number;
  bestStreak: number;
  completionRate7d: number;
  completionRate30d: number;
  completionRate90d: number;
}

interface AnalyticsTotals {
  totalGoals: number;
  totalHabits: number;
  totalTodos: number;
  onTrackGoals: number;
  todoCompletionRate: number;
  logsInWindow: number;
}

export interface AnalyticsSnapshot {
  totals: AnalyticsTotals;
  goalProgress: ReturnType<typeof buildAnalyticsSummaryModel>["goalProgress"];
  dailyLogSeries: DailyLogPoint[];
}

function toIsoDate(value: Date | string | undefined): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

// Backwards compatibility adapter for older analytics components/tests.
export function buildAnalyticsSnapshot({
  goals,
  habits,
  todos,
  logs,
  habitGoalLinks = [],
  todoGoalLinks = [],
  days = 14,
  asOf,
}: BuildAnalyticsSnapshotInput): AnalyticsSnapshot {
  const endDate = toIsoDate(asOf);
  const unclampedStart = new Date(`${endDate}T00:00:00`);
  unclampedStart.setDate(unclampedStart.getDate() - (Math.max(days, 1) - 1));

  const range = clampAnalyticsRange({
    startDate: unclampedStart.toISOString().slice(0, 10),
    endDate,
    minDays: 1,
    maxDays: 730,
  });

  const summary = buildAnalyticsSummaryModel({
    goals,
    habits,
    todos,
    logs,
    habitGoalLinks,
    todoGoalLinks,
    weeklyReviews: [],
    range,
    granularity: "daily",
    comparisonEnabled: false,
  });

  const dailyLogSeries: DailyLogPoint[] = summary.trendSeries.map((point) => ({
    date: point.bucketStart,
    total: point.numericTotal,
    entries: point.logEntries,
  }));

  return {
    totals: {
      totalGoals: summary.kpis.totalGoals,
      totalHabits: summary.kpis.totalHabits,
      totalTodos: summary.kpis.totalTodos,
      onTrackGoals: summary.kpis.onTrackGoals,
      todoCompletionRate: summary.kpis.todoCompletionRate,
      logsInWindow: summary.kpis.logsInRange,
    },
    goalProgress: summary.goalProgress,
    dailyLogSeries,
  };
}

export function toLegacyHabitStats(
  model: ReturnType<typeof buildAnalyticsProgressModel>,
  options: {
    logs: LogEntry[];
    today: string;
  },
): HabitStat[] {
  return model.habits.map((row) => ({
    habitId: row.habit.id,
    title: row.habit.title,
    currentStreak: row.streakCurrent,
    bestStreak: row.streakBest,
    completionRate7d: computeHabitCompletionRate(row.habit, options.logs, options.today, 7),
    completionRate30d: computeHabitCompletionRate(row.habit, options.logs, options.today, 30),
    completionRate90d: computeHabitCompletionRate(row.habit, options.logs, options.today, 90),
  }));
}
