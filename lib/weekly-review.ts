import { format, getDay, parseISO, startOfWeek } from "date-fns";

import type { WeeklyReview } from "./types";

export function weekStartForDate(dateIso: string): string {
  return format(startOfWeek(parseISO(dateIso), { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function shouldShowWeeklyReviewPrompt(input: {
  asOf: string;
  weeklyReviews: WeeklyReview[];
}): boolean {
  const isSunday = getDay(parseISO(input.asOf)) === 0;
  if (!isSunday) return false;

  const weekStart = weekStartForDate(input.asOf);
  return !input.weeklyReviews.some((review) => review.week_start === weekStart);
}
