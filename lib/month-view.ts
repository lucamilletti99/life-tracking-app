import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import type { CalendarItem } from "./types";

export interface MonthGridCell {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  items: CalendarItem[];
}

function toIsoDate(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

export function buildMonthGrid(currentDate: Date, items: CalendarItem[]): MonthGridCell[][] {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const itemsByDate = new Map<string, CalendarItem[]>();

  for (const item of items) {
    const date = item.start_datetime.slice(0, 10);
    const current = itemsByDate.get(date) ?? [];
    current.push(item);
    itemsByDate.set(date, current);
  }

  for (const bucket of itemsByDate.values()) {
    bucket.sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));
  }

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd }).map((date) => {
    const iso = toIsoDate(date);
    return {
      date: iso,
      isCurrentMonth: isSameMonth(date, monthStart),
      isToday: isToday(date),
      items: itemsByDate.get(iso) ?? [],
    } satisfies MonthGridCell;
  });

  const weeks: MonthGridCell[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return weeks;
}

export function dayCellDate(cell: MonthGridCell): Date {
  return parseISO(cell.date);
}
