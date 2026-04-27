import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  getDate,
  getDay,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import type { Habit } from "./types";

function isoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function datesInRange(start: string, end: string): Date[] {
  const result: Date[] = [];
  let cur = parseISO(start);
  const last = parseISO(end);

  while (cur <= last) {
    result.push(cur);
    cur = addDays(cur, 1);
  }

  return result;
}

function selectEvenly(all: Date[], n: number): string[] {
  const period = all.length;
  const count = Math.min(Math.max(0, n), period);
  if (count === 0) return [];

  const indices = Array.from(
    { length: count },
    (_, i) => Math.floor((i * period) / count),
  );
  return indices.filter((idx) => idx < period).map((idx) => isoDate(all[idx]));
}

function buildPerWeekOccurrences(start: string, end: string, n: number): string[] {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  const result: string[] = [];
  let periodStart = startOfWeek(startDate, { weekStartsOn: 1 });

  while (!isAfter(periodStart, endDate)) {
    const periodEnd = endOfWeek(periodStart, { weekStartsOn: 1 });
    const clampedStart = isBefore(periodStart, startDate) ? startDate : periodStart;
    const clampedEnd = isAfter(periodEnd, endDate) ? endDate : periodEnd;

    const weekDates = datesInRange(isoDate(clampedStart), isoDate(clampedEnd));
    result.push(...selectEvenly(weekDates, n));

    periodStart = addDays(periodEnd, 1);
  }

  return result;
}

function buildPerMonthOccurrences(start: string, end: string, n: number): string[] {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  const result: string[] = [];
  let periodStart = startOfMonth(startDate);

  while (!isAfter(periodStart, endDate)) {
    const periodEnd = endOfMonth(periodStart);
    const clampedStart = isBefore(periodStart, startDate) ? startDate : periodStart;
    const clampedEnd = isAfter(periodEnd, endDate) ? endDate : periodEnd;

    const monthDates = datesInRange(isoDate(clampedStart), isoDate(clampedEnd));
    result.push(...selectEvenly(monthDates, n));

    periodStart = addMonths(periodStart, 1);
  }

  return result;
}

export function getOccurrencesInRange(
  habit: Habit,
  start: string,
  end: string,
): string[] {
  const all = datesInRange(start, end);
  const cfg = habit.recurrence_config;

  if (habit.recurrence_type === "daily") {
    return all.map(isoDate);
  }

  if (habit.recurrence_type === "weekdays") {
    const days = cfg.weekdays ?? [];
    return all.filter((d) => days.includes(getDay(d))).map(isoDate);
  }

  if (habit.recurrence_type === "times_per_week") {
    const n = cfg.times_per_period ?? 1;
    return buildPerWeekOccurrences(start, end, n);
  }

  if (habit.recurrence_type === "times_per_month") {
    const n = cfg.times_per_period ?? 1;
    return buildPerMonthOccurrences(start, end, n);
  }

  if (habit.recurrence_type === "day_of_month") {
    const dayNum = cfg.day_of_month ?? 1;
    return all.filter((d) => getDate(d) === dayNum).map(isoDate);
  }

  return [];
}
