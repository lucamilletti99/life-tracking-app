import { clsx, type ClassValue } from "clsx"
import { format } from "date-fns"
import { twMerge } from "tailwind-merge"

import type { CalendarItem } from "./types"

export type DayLoad = "empty" | "light" | "moderate" | "busy"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDayLoad(items: CalendarItem[], date: Date): DayLoad {
  const dateStr = format(date, "yyyy-MM-dd")
  const count = items.filter(
    (item) => !item.all_day && item.start_datetime.startsWith(dateStr),
  ).length
  if (count === 0) return "empty"
  if (count <= 2) return "light"
  if (count <= 4) return "moderate"
  return "busy"
}
