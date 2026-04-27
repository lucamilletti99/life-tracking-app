import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";

import type { AnalyticsGranularity, AnalyticsRange } from "./types";

interface ClampAnalyticsRangeInput {
  startDate: string;
  endDate: string;
  minDays?: number;
  maxDays?: number;
}

export interface ClampedAnalyticsRange extends AnalyticsRange {
  days: number;
}

function iso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function safeOrderedRange(startDate: string, endDate: string): AnalyticsRange {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (isAfter(start, end)) {
    return {
      startDate: iso(end),
      endDate: iso(start),
    };
  }

  return { startDate: iso(start), endDate: iso(end) };
}

function rangeDays(range: AnalyticsRange): number {
  return differenceInCalendarDays(parseISO(range.endDate), parseISO(range.startDate)) + 1;
}

export function clampAnalyticsRange(input: ClampAnalyticsRangeInput): ClampedAnalyticsRange {
  const minDays = input.minDays ?? 30;
  const maxDays = input.maxDays ?? 730;
  const ordered = safeOrderedRange(input.startDate, input.endDate);

  let end = parseISO(ordered.endDate);
  let start = parseISO(ordered.startDate);
  let days = rangeDays(ordered);

  if (days < minDays) {
    start = subDays(end, minDays - 1);
    days = minDays;
  }

  if (days > maxDays) {
    start = subDays(end, maxDays - 1);
    days = maxDays;
  }

  return {
    startDate: iso(start),
    endDate: iso(end),
    days,
  };
}

export function toPreviousComparisonRange(range: AnalyticsRange): AnalyticsRange {
  const days = rangeDays(range);
  const previousEnd = subDays(parseISO(range.startDate), 1);
  const previousStart = subDays(previousEnd, days - 1);

  return {
    startDate: iso(previousStart),
    endDate: iso(previousEnd),
  };
}

export function bucketStartIso(dateIso: string, granularity: AnalyticsGranularity): string {
  const date = parseISO(dateIso);

  if (granularity === "daily") {
    return iso(date);
  }

  if (granularity === "weekly") {
    return iso(startOfWeek(date, { weekStartsOn: 1 }));
  }

  return iso(startOfMonth(date));
}

export function bucketEndIso(bucketStartIsoDate: string, granularity: AnalyticsGranularity): string {
  const start = parseISO(bucketStartIsoDate);
  if (granularity === "daily") return bucketStartIsoDate;
  if (granularity === "weekly") {
    return iso(endOfWeek(start, { weekStartsOn: 1 }));
  }
  return iso(endOfMonth(start));
}

export function buildBucketSequence(
  range: AnalyticsRange,
  granularity: AnalyticsGranularity,
): Array<{ bucketStart: string; bucketEnd: string }> {
  const start = parseISO(range.startDate);
  const end = parseISO(range.endDate);
  const seen = new Set<string>();
  const buckets: Array<{ bucketStart: string; bucketEnd: string }> = [];

  let cursor = start;
  while (!isAfter(cursor, end)) {
    const day = iso(cursor);
    const bucketStart = bucketStartIso(day, granularity);
    if (!seen.has(bucketStart)) {
      seen.add(bucketStart);
      buckets.push({
        bucketStart,
        bucketEnd: bucketEndIso(bucketStart, granularity),
      });
    }

    cursor = addDays(cursor, 1);
  }

  return buckets;
}

export function rangeIncludes(dateIso: string, range: AnalyticsRange): boolean {
  return dateIso >= range.startDate && dateIso <= range.endDate;
}
