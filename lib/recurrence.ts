import { addDays, format, getDate, getDay, parseISO } from "date-fns";

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
    const period = all.length;
    const indices = Array.from({ length: n }, (_, i) => Math.floor((i * period) / n));
    return indices.filter((idx) => idx < period).map((idx) => isoDate(all[idx]));
  }

  if (habit.recurrence_type === "times_per_month") {
    const n = cfg.times_per_period ?? 1;
    const period = all.length;
    const indices = Array.from({ length: n }, (_, i) => Math.floor((i * period) / n));
    return indices.filter((idx) => idx < period).map((idx) => isoDate(all[idx]));
  }

  if (habit.recurrence_type === "day_of_month") {
    const dayNum = cfg.day_of_month ?? 1;
    return all.filter((d) => getDate(d) === dayNum).map(isoDate);
  }

  return [];
}
