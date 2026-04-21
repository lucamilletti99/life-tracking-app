import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfWeek,
  subWeeks,
} from "date-fns";

import { buildCalendarItems } from "@/lib/calendar-items";
import { habitsService } from "@/lib/services/habits";
import { logsService } from "@/lib/services/logs";
import { todosService } from "@/lib/services/todos";
import type { CalendarItem } from "@/lib/types";

export function useCalendarWeek() {
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

  const startStr = format(weekStart, "yyyy-MM-dd");
  const endStr = format(weekEnd, "yyyy-MM-dd");

  const refresh = useCallback(() => setRefreshToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      try {
        const [todos, habits, logs, habitGoalLinks, todoGoalLinks] = await Promise.all([
          todosService.forDateRange(
            format(weekStart, "yyyy-MM-dd'T'00:00:00"),
            format(weekEnd, "yyyy-MM-dd'T'23:59:59"),
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
  }, [endStr, refreshToken, startStr, weekEnd, weekStart]);

  return {
    currentDate,
    weekStart,
    weekEnd,
    days,
    items,
    loading,
    refresh,
    goToPrevWeek: () => setCurrentDate((d) => subWeeks(d, 1)),
    goToNextWeek: () => setCurrentDate((d) => addWeeks(d, 1)),
    goToToday: () => setCurrentDate(new Date()),
  };
}
