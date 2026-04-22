import { addDays, format, parseISO, subDays } from "date-fns";

import { calculateGoalProgress } from "./goal-calculations";
import type { Goal, Habit, HabitGoalLink, LogEntry, Todo, TodoGoalLink } from "./types";

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
  goalProgress: ReturnType<typeof calculateGoalProgress>[];
  dailyLogSeries: DailyLogPoint[];
}

function toDate(value: Date | string | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return parseISO(`${value}T00:00:00`);
}

function toIsoDate(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

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
  const endDate = toDate(asOf);
  const startDate = subDays(endDate, days - 1);
  const startIso = toIsoDate(startDate);
  const endIso = toIsoDate(endDate);

  const goalSourceMap = new Map<string, string[]>();
  for (const link of habitGoalLinks) {
    const ids = goalSourceMap.get(link.goal_id) ?? [];
    ids.push(link.habit_id);
    goalSourceMap.set(link.goal_id, ids);
  }
  for (const link of todoGoalLinks) {
    const ids = goalSourceMap.get(link.goal_id) ?? [];
    ids.push(link.todo_id);
    goalSourceMap.set(link.goal_id, ids);
  }

  const goalProgress = goals.map((goal) =>
    calculateGoalProgress(goal, logs, goalSourceMap.get(goal.id), asOf),
  );
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
  for (let i = 0; i < days; i++) {
    const day = toIsoDate(addDays(startDate, i));
    dailyLogSeries.push(
      totalsByDate.get(day) ?? {
        date: day,
        total: 0,
        entries: 0,
      },
    );
  }

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
  };
}
