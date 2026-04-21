import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  getDate,
  getDay,
  isAfter,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";

import { getHabitLogStatusMap, habitStatusKey } from "./habit-status";
import type { Habit, LogEntry, RecurrenceConfig, RecurrenceType } from "./types";

export type HabitHeatmapStatus = "complete" | "skipped" | "none";

export interface HabitHeatmapCell {
  date: string;
  status: HabitHeatmapStatus;
}

export type HabitTodayState = "done" | "due" | "optional" | "not_due" | "paused";

function iso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function toDate(date: string): Date {
  return parseISO(date);
}

function isScheduledOnDate(
  recurrenceType: RecurrenceType,
  recurrenceConfig: RecurrenceConfig,
  date: Date,
): boolean {
  if (recurrenceType === "daily") return true;

  if (recurrenceType === "weekdays") {
    const weekdays = recurrenceConfig.weekdays ?? [];
    return weekdays.includes(getDay(date));
  }

  if (recurrenceType === "day_of_month") {
    const dayOfMonth = recurrenceConfig.day_of_month ?? 1;
    return getDate(date) === dayOfMonth;
  }

  if (recurrenceType === "times_per_week" || recurrenceType === "times_per_month") {
    return true;
  }

  return false;
}

function completedDatesForHabit(habitId: string, logs: LogEntry[], today: string): string[] {
  const statusMap = getHabitLogStatusMap(logs);

  return [...statusMap.entries()]
    .filter(([key, status]) => {
      const [id, date] = key.split("|");
      return id === habitId && status === "complete" && date <= today;
    })
    .map(([key]) => key.split("|")[1])
    .sort();
}

export function buildHabitHeatmap(
  habitId: string,
  logs: LogEntry[],
  today: string,
  days = 84,
): HabitHeatmapCell[] {
  const statusMap = getHabitLogStatusMap(logs);
  const endDate = toDate(today);
  const startDate = subDays(endDate, days - 1);

  const cells: HabitHeatmapCell[] = [];
  let cursor = startDate;

  while (!isAfter(cursor, endDate)) {
    const date = iso(cursor);
    const key = habitStatusKey(habitId, date);
    const status = statusMap.get(key) ?? "none";

    cells.push({ date, status });
    cursor = addDays(cursor, 1);
  }

  return cells;
}

export function getRemainingQuotaInPeriod(
  habit: Habit,
  logs: LogEntry[],
  today: string,
): number | null {
  if (habit.recurrence_type !== "times_per_week" && habit.recurrence_type !== "times_per_month") {
    return null;
  }

  const required = Math.max(habit.recurrence_config.times_per_period ?? 1, 1);
  const todayDate = toDate(today);

  const periodStart =
    habit.recurrence_type === "times_per_week"
      ? startOfWeek(todayDate, { weekStartsOn: 1 })
      : startOfMonth(todayDate);

  const periodEnd =
    habit.recurrence_type === "times_per_week"
      ? endOfWeek(todayDate, { weekStartsOn: 1 })
      : endOfMonth(todayDate);

  const completedDates = completedDatesForHabit(habit.id, logs, today);
  const completedInPeriod = completedDates.filter((date) => {
    const day = toDate(date);
    return day >= periodStart && day <= periodEnd;
  }).length;

  return Math.max(required - completedInPeriod, 0);
}

export function getHabitTodayState(
  habit: Habit,
  logs: LogEntry[],
  today: string,
): HabitTodayState {
  if (habit.is_paused) return "paused";

  const completedToday = new Set(completedDatesForHabit(habit.id, logs, today)).has(today);
  if (completedToday) return "done";

  if (habit.recurrence_type === "times_per_week" || habit.recurrence_type === "times_per_month") {
    const remaining = getRemainingQuotaInPeriod(habit, logs, today);
    if (remaining === null) return "not_due";
    return remaining > 0 ? "due" : "optional";
  }

  const scheduled = isScheduledOnDate(
    habit.recurrence_type,
    habit.recurrence_config,
    toDate(today),
  );

  return scheduled ? "due" : "not_due";
}
