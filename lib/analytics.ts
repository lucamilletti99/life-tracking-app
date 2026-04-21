import {
  addDays,
  format,
  getDay,
  parseISO,
  startOfWeek,
  subDays,
} from "date-fns";

import { calculateGoalProgress } from "./goal-calculations";
import { buildHabitHeatmap, computeHabitCompletionRate } from "./habit-insights";
import { computeStreak } from "./streak";
import type { Goal, Habit, LogEntry, Todo } from "./types";

interface BuildAnalyticsSnapshotInput {
  goals: Goal[];
  habits: Habit[];
  todos: Todo[];
  logs: LogEntry[];
  days?: number;
  asOf?: Date | string;
}

interface DailyLogPoint {
  date: string;
  total: number;
  entries: number;
}

interface AnalyticsTotals {
  totalGoals: number;
  totalHabits: number;
  totalTodos: number;
  onTrackGoals: number;
  todoCompletionRate: number;
  logsInWindow: number;
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

export interface AnalyticsSnapshot {
  totals: AnalyticsTotals;
  goalProgress: ReturnType<typeof calculateGoalProgress>[];
  dailyLogSeries: DailyLogPoint[];
  habitStats: HabitStat[];
  streakLeaderboard: HabitStat[];
  weeklyComparison: {
    thisWeekCompleted: number;
    lastWeekCompleted: number;
    deltaPercent: number;
  };
  dayStrength: {
    bestDay: string | null;
    worstDay: string | null;
  };
  habitHeatmaps: Array<{
    habitId: string;
    title: string;
    cells: ReturnType<typeof buildHabitHeatmap>;
  }>;
}

const weekdayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function toDate(value: Date | string | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return parseISO(`${value}T00:00:00`);
}

function toIsoDate(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

function todoDate(todo: Todo): string {
  return todo.start_datetime.slice(0, 10);
}

function countCompletedTodosInRange(todos: Todo[], startIso: string, endIso: string): number {
  return todos.filter((todo) => {
    const day = todoDate(todo);
    return day >= startIso && day <= endIso && todo.status === "complete";
  }).length;
}

export function buildAnalyticsSnapshot({
  goals,
  habits,
  todos,
  logs,
  days = 14,
  asOf,
}: BuildAnalyticsSnapshotInput): AnalyticsSnapshot {
  const endDate = toDate(asOf);
  const endIso = toIsoDate(endDate);
  const startDate = subDays(endDate, days - 1);
  const startIso = toIsoDate(startDate);

  const goalProgress = goals.map((goal) => calculateGoalProgress(goal, logs));
  const onTrackGoals = goalProgress.filter((goal) => goal.is_on_track).length;

  const completedTodos = todos.filter((todo) => todo.status === "complete").length;
  const todoCompletionRate =
    todos.length === 0 ? 0 : Math.round((completedTodos / todos.length) * 100);

  const logsInWindow = logs.filter(
    (log) => log.entry_date >= startIso && log.entry_date <= endIso,
  );

  const totalsByDate = new Map<string, DailyLogPoint>();
  for (const log of logsInWindow) {
    const existing = totalsByDate.get(log.entry_date) ?? {
      date: log.entry_date,
      total: 0,
      entries: 0,
    };

    existing.total += log.numeric_value ?? 0;
    existing.entries += 1;
    totalsByDate.set(log.entry_date, existing);
  }

  const dailyLogSeries: DailyLogPoint[] = [];
  for (let i = 0; i < days; i += 1) {
    const day = toIsoDate(addDays(startDate, i));
    dailyLogSeries.push(
      totalsByDate.get(day) ?? {
        date: day,
        total: 0,
        entries: 0,
      },
    );
  }

  const habitStats = habits.map((habit) => {
    const streak = computeStreak(
      habit.id,
      habit.recurrence_type,
      habit.recurrence_config,
      logs,
      endIso,
    );

    return {
      habitId: habit.id,
      title: habit.title,
      currentStreak: streak.current,
      bestStreak: streak.best,
      completionRate7d: computeHabitCompletionRate(habit, logs, endIso, 7),
      completionRate30d: computeHabitCompletionRate(habit, logs, endIso, 30),
      completionRate90d: computeHabitCompletionRate(habit, logs, endIso, 90),
    };
  });

  const streakLeaderboard = [...habitStats].sort((a, b) => {
    if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
    return b.completionRate30d - a.completionRate30d;
  });

  const thisWeekStart = startOfWeek(endDate, { weekStartsOn: 1 });
  const thisWeekStartIso = toIsoDate(thisWeekStart);
  const thisWeekCompleted = countCompletedTodosInRange(todos, thisWeekStartIso, endIso);

  const lastWeekEnd = subDays(thisWeekStart, 1);
  const lastWeekStart = startOfWeek(lastWeekEnd, { weekStartsOn: 1 });
  const lastWeekStartIso = toIsoDate(lastWeekStart);
  const lastWeekEndIso = toIsoDate(lastWeekEnd);
  const lastWeekCompleted = countCompletedTodosInRange(todos, lastWeekStartIso, lastWeekEndIso);

  const deltaPercent =
    lastWeekCompleted === 0
      ? thisWeekCompleted === 0
        ? 0
        : 100
      : Math.round(((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100);

  const weekdayCounts = new Array<number>(7).fill(0);
  logs.forEach((log) => {
    if (log.source_type !== "habit") return;
    if (log.note === "__habit_skipped__") return;

    const weekday = getDay(parseISO(`${log.entry_date}T00:00:00`));
    weekdayCounts[weekday] += 1;
  });

  const hasAnyWeekdayData = weekdayCounts.some((count) => count > 0);

  const bestIndex = hasAnyWeekdayData
    ? weekdayCounts.reduce((best, count, index, arr) => (count > arr[best] ? index : best), 0)
    : -1;

  const worstIndex = hasAnyWeekdayData
    ? weekdayCounts.reduce((worst, count, index, arr) => (count < arr[worst] ? index : worst), 0)
    : -1;

  const habitHeatmaps = habits.map((habit) => ({
    habitId: habit.id,
    title: habit.title,
    cells: buildHabitHeatmap(habit.id, logs, endIso),
  }));

  return {
    totals: {
      totalGoals: goals.length,
      totalHabits: habits.length,
      totalTodos: todos.length,
      onTrackGoals,
      todoCompletionRate,
      logsInWindow: logsInWindow.length,
    },
    goalProgress,
    dailyLogSeries,
    habitStats,
    streakLeaderboard,
    weeklyComparison: {
      thisWeekCompleted,
      lastWeekCompleted,
      deltaPercent,
    },
    dayStrength: {
      bestDay: bestIndex === -1 ? null : weekdayNames[bestIndex],
      worstDay: worstIndex === -1 ? null : weekdayNames[worstIndex],
    },
    habitHeatmaps,
  };
}
