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

import { isHabitEffectivelyPaused } from "./habit-pause";
import { getOccurrencesInRange } from "./recurrence";
import { getHabitLogStatusMap, habitStatusKey } from "./habit-status";
import type { Habit, LogEntry, RecurrenceConfig, RecurrenceType } from "./types";

export type HabitHeatmapStatus = "complete" | "failed" | "skipped" | "none";

export interface HabitHeatmapCell {
  date: string;
  status: HabitHeatmapStatus;
  value?: number;
  unit?: string;
}

export type HabitTodayState =
  | "done"
  | "skipped"
  | "failed"
  | "due"
  | "optional"
  | "not_due"
  | "paused";

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

function completedDatesForHabit(
  habit: Pick<Habit, "id" | "tracking_type" | "default_target_value" | "target_direction">,
  logs: LogEntry[],
  today: string,
): string[] {
  const statusMap = getHabitLogStatusMap(logs, [habit]);

  return [...statusMap.entries()]
    .filter(([key, status]) => {
      const [id, date] = key.split("|");
      return id === habit.id && status === "complete" && date <= today;
    })
    .map(([key]) => key.split("|")[1])
    .sort();
}

export function buildHabitHeatmap(
  habitId: string,
  logs: LogEntry[],
  today: string,
  days = 84,
  habit: Pick<Habit, "id" | "tracking_type" | "default_target_value" | "target_direction">,
): HabitHeatmapCell[] {
  const statusMap = getHabitLogStatusMap(logs, [habit]);
  const valueMap = new Map<string, { value: number; unit?: string }>();
  const sortedLogs = [...logs].sort((a, b) => b.entry_datetime.localeCompare(a.entry_datetime));

  for (const log of sortedLogs) {
    if (log.source_type !== "habit" || log.source_id !== habitId) continue;
    if (log.numeric_value == null) continue;

    const key = habitStatusKey(habitId, log.entry_date);
    if (statusMap.get(key) !== "complete") continue;
    if (valueMap.has(key)) continue;

    valueMap.set(key, {
      value: log.numeric_value,
      unit: log.unit,
    });
  }

  const endDate = toDate(today);
  const startDate = subDays(endDate, days - 1);

  const cells: HabitHeatmapCell[] = [];
  let cursor = startDate;

  while (!isAfter(cursor, endDate)) {
    const date = iso(cursor);
    const key = habitStatusKey(habitId, date);
    const status = statusMap.get(key) ?? "none";
    const valuePayload = valueMap.get(key);

    cells.push({
      date,
      status,
      value: valuePayload?.value,
      unit: valuePayload?.unit,
    });
    cursor = addDays(cursor, 1);
  }

  return cells;
}

export function getAlignedHeatmapWindow(
  cells: HabitHeatmapCell[],
  today: string,
  weeks = 1,
): HabitHeatmapCell[] {
  const safeWeeks = Math.max(1, Math.floor(weeks));
  const todayDate = toDate(today);
  const weekStart = startOfWeek(todayDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(todayDate, { weekStartsOn: 1 });
  const windowStart = subDays(weekStart, (safeWeeks - 1) * 7);

  const byDate = new Map(cells.map((cell) => [cell.date, cell]));
  const aligned: HabitHeatmapCell[] = [];

  let cursor = windowStart;
  while (!isAfter(cursor, weekEnd)) {
    const date = iso(cursor);
    aligned.push(byDate.get(date) ?? { date, status: "none" });
    cursor = addDays(cursor, 1);
  }

  return aligned;
}

export function computeHabitCompletionRate(
  habit: Habit,
  logs: LogEntry[],
  today: string,
  days = 30,
): number {
  const completed = new Set(completedDatesForHabit(habit, logs, today));
  const startDate = iso(subDays(toDate(today), Math.max(days - 1, 0)));
  const expected = getOccurrencesInRange(habit, startDate, today);

  if (expected.length === 0) return 0;

  const completedExpected = expected.filter((date) => completed.has(date)).length;
  return Math.round((completedExpected / expected.length) * 100);
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

  const completedDates = completedDatesForHabit(habit, logs, today);
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
  if (isHabitEffectivelyPaused(habit, today)) return "paused";

  const todayStatus = getHabitLogStatusMap(logs, [habit]).get(habitStatusKey(habit.id, today));
  if (todayStatus === "complete") return "done";
  if (todayStatus === "skipped") return "skipped";
  if (todayStatus === "failed") return "failed";

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
