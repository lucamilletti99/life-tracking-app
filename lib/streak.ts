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
  subDays,
} from "date-fns";

import { getHabitLogStatusMap } from "./habit-status";
import type {
  HabitTargetDirection,
  LogEntry,
  RecurrenceConfig,
  RecurrenceType,
  TrackingType,
} from "./types";

export interface StreakResult {
  current: number;
  best: number;
  lastCompletedDate: string | null;
  missedYesterday: boolean;
  neverMissedTwice: boolean;
}

interface PeriodResult {
  met: boolean;
  closed: boolean;
}

function iso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function toDate(date: string): Date {
  return parseISO(date);
}

function isDueOnDate(
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

  return false;
}

function buildDueDates(
  startDate: string,
  endDate: string,
  recurrenceType: RecurrenceType,
  recurrenceConfig: RecurrenceConfig,
): string[] {
  const due: string[] = [];
  let cursor = toDate(startDate);
  const end = toDate(endDate);

  while (!isAfter(cursor, end)) {
    if (isDueOnDate(recurrenceType, recurrenceConfig, cursor)) {
      due.push(iso(cursor));
    }

    cursor = addDays(cursor, 1);
  }

  return due;
}

function summarizeDueDates(dueDates: string[], completed: Set<string>, today: string): {
  current: number;
  best: number;
  neverMissedTwice: boolean;
} {
  if (dueDates.length === 0) {
    return { current: 0, best: 0, neverMissedTwice: true };
  }

  let best = 0;
  let running = 0;
  let consecutiveMisses = 0;

  for (const date of dueDates) {
    if (completed.has(date)) {
      running += 1;
      best = Math.max(best, running);
      consecutiveMisses = 0;
    } else {
      running = 0;
      consecutiveMisses += 1;
    }
  }

  const dueDatesForCurrent = dueDates.filter((date) => date < today || completed.has(date));
  let current = 0;
  for (let i = dueDatesForCurrent.length - 1; i >= 0; i -= 1) {
    if (!completed.has(dueDatesForCurrent[i])) break;
    current += 1;
  }

  let neverMissedTwice = true;
  consecutiveMisses = 0;
  for (const date of dueDates) {
    if (completed.has(date)) {
      consecutiveMisses = 0;
      continue;
    }

    consecutiveMisses += 1;
    if (consecutiveMisses >= 2) {
      neverMissedTwice = false;
      break;
    }
  }

  return { current, best, neverMissedTwice };
}

function summarizePeriods(periods: PeriodResult[]): {
  current: number;
  best: number;
  neverMissedTwice: boolean;
} {
  if (periods.length === 0) {
    return { current: 0, best: 0, neverMissedTwice: true };
  }

  let best = 0;
  let running = 0;
  let consecutiveMisses = 0;

  for (const period of periods) {
    if (period.met) {
      running += 1;
      best = Math.max(best, running);
      consecutiveMisses = 0;
    } else {
      running = 0;
      if (period.closed) {
        consecutiveMisses += 1;
      }
    }
  }

  const currentPeriods =
    periods.length > 0 && !periods[periods.length - 1].closed && !periods[periods.length - 1].met
      ? periods.slice(0, -1)
      : periods;

  let current = 0;
  for (let i = currentPeriods.length - 1; i >= 0; i -= 1) {
    if (!currentPeriods[i].met) break;
    current += 1;
  }

  let neverMissedTwice = true;
  consecutiveMisses = 0;
  for (const period of periods) {
    if (!period.closed) continue;

    if (period.met) {
      consecutiveMisses = 0;
      continue;
    }

    consecutiveMisses += 1;
    if (consecutiveMisses >= 2) {
      neverMissedTwice = false;
      break;
    }
  }

  return { current, best, neverMissedTwice };
}

function computePeriodStreak(
  recurrenceType: "times_per_week" | "times_per_month",
  recurrenceConfig: RecurrenceConfig,
  completedDates: string[],
  today: string,
): Pick<StreakResult, "current" | "best" | "neverMissedTwice"> {
  const required = Math.max(recurrenceConfig.times_per_period ?? 1, 1);
  const end = toDate(today);

  if (completedDates.length === 0) {
    return { current: 0, best: 0, neverMissedTwice: true };
  }

  const firstCompleted = toDate(completedDates[0]);
  const initialStart =
    recurrenceType === "times_per_week"
      ? startOfWeek(firstCompleted, { weekStartsOn: 1 })
      : startOfMonth(firstCompleted);

  const periods: PeriodResult[] = [];
  let periodStart = initialStart;

  while (!isAfter(periodStart, end)) {
    const periodEnd =
      recurrenceType === "times_per_week"
        ? endOfWeek(periodStart, { weekStartsOn: 1 })
        : endOfMonth(periodStart);

    const periodStartIso = iso(periodStart);
    const periodEndIso = iso(periodEnd);

    const completedCount = completedDates.filter((date) => date >= periodStartIso && date <= periodEndIso).length;

    periods.push({
      met: completedCount >= required,
      closed: !isBefore(end, periodEnd),
    });

    periodStart =
      recurrenceType === "times_per_week"
        ? addDays(periodEnd, 1)
        : addMonths(periodStart, 1);
  }

  return summarizePeriods(periods);
}

export function computeStreak(
  habitId: string,
  recurrenceType: RecurrenceType,
  recurrenceConfig: RecurrenceConfig,
  logs: LogEntry[],
  today: string,
  evaluation?: {
    trackingType?: TrackingType;
    defaultTargetValue?: number;
    targetDirection?: HabitTargetDirection;
  },
): StreakResult {
  const todayDate = toDate(today);

  const statusMap = getHabitLogStatusMap(logs, [
    {
      id: habitId,
      tracking_type: evaluation?.trackingType ?? "boolean",
      default_target_value: evaluation?.defaultTargetValue,
      target_direction: evaluation?.targetDirection ?? "at_least",
    },
  ]);
  const completedDates = [...statusMap.entries()]
    .filter(([key, status]) => {
      const [id, date] = key.split("|");
      return id === habitId && status === "complete" && date <= today;
    })
    .map(([key]) => key.split("|")[1])
    .sort();

  const lastCompletedDate = completedDates.length > 0 ? completedDates[completedDates.length - 1] : null;

  const completedSet = new Set(completedDates);

  const yesterday = iso(subDays(todayDate, 1));
  const missedYesterday =
    (recurrenceType === "daily" || recurrenceType === "weekdays" || recurrenceType === "day_of_month") &&
    isDueOnDate(recurrenceType, recurrenceConfig, toDate(yesterday)) &&
    !completedSet.has(yesterday);

  if (recurrenceType === "times_per_week" || recurrenceType === "times_per_month") {
    const periodSummary = computePeriodStreak(
      recurrenceType,
      recurrenceConfig,
      completedDates,
      today,
    );

    return {
      current: periodSummary.current,
      best: periodSummary.best,
      lastCompletedDate,
      missedYesterday: false,
      neverMissedTwice: periodSummary.neverMissedTwice,
    };
  }

  const firstDate = completedDates[0] ?? today;
  const dueDates = buildDueDates(firstDate, today, recurrenceType, recurrenceConfig);
  const summary = summarizeDueDates(dueDates, completedSet, today);

  return {
    current: summary.current,
    best: summary.best,
    lastCompletedDate,
    missedYesterday,
    neverMissedTwice: summary.neverMissedTwice,
  };
}
