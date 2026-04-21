import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";

import { buildCalendarItems } from "@/lib/calendar-items";
import { habitsService } from "@/lib/services/habits";
import { logsService } from "@/lib/services/logs";
import { todosService } from "@/lib/services/todos";
import type { CalendarItem } from "@/lib/types";

export type CalendarViewMode = "week" | "day" | "month";

export function useCalendarWeek(view: CalendarViewMode = "week") {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);

  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate],
  );
  const weekEnd = useMemo(
    () => endOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate],
  );
  const days = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekEnd, weekStart],
  );

  const rangeStart = useMemo(() => {
    if (view === "day") return startOfDay(currentDate);
    if (view === "month") return startOfMonth(currentDate);
    return weekStart;
  }, [currentDate, view, weekStart]);

  const rangeEnd = useMemo(() => {
    if (view === "day") return endOfDay(currentDate);
    if (view === "month") return endOfMonth(currentDate);
    return weekEnd;
  }, [currentDate, view, weekEnd]);

  const startStr = format(rangeStart, "yyyy-MM-dd");
  const endStr = format(rangeEnd, "yyyy-MM-dd");

  const refresh = useCallback(() => setRefreshToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      try {
        const [todos, habits, logs, habitGoalLinks, todoGoalLinks] = await Promise.all([
          todosService.forDateRange(
            format(rangeStart, "yyyy-MM-dd'T'00:00:00"),
            format(rangeEnd, "yyyy-MM-dd'T'23:59:59"),
          ),
          habitsService.list(),
          logsService.forDateRange(startStr, endStr),
          habitsService.listGoalLinks(),
          todosService.listGoalLinks(),
        ]);

        const enriched = buildCalendarItems({
          todos,
          habits,
          logs,
          habitGoalLinks,
          todoGoalLinks,
          start: startStr,
          end: endStr,
          today: format(new Date(), "yyyy-MM-dd"),
        });

        if (!cancelled) {
          setItems(enriched);
        }
      } catch (error) {
        if (!cancelled) {
          setItems([]);
          console.error(error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [endStr, rangeEnd, rangeStart, refreshToken, startStr]);

  const goToPrevPeriod = useCallback(() => {
    setCurrentDate((date) => {
      if (view === "day") return subDays(date, 1);
      if (view === "month") return subMonths(date, 1);
      return subWeeks(date, 1);
    });
  }, [view]);

  const goToNextPeriod = useCallback(() => {
    setCurrentDate((date) => {
      if (view === "day") return addDays(date, 1);
      if (view === "month") return addMonths(date, 1);
      return addWeeks(date, 1);
    });
  }, [view]);

  return {
    currentDate,
    weekStart,
    weekEnd,
    days,
    items,
    loading,
    refresh,
    setCurrentDate,
    goToPrevPeriod,
    goToNextPeriod,
    goToToday: () => setCurrentDate(new Date()),
  };
}
