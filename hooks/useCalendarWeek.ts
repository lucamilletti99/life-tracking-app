import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfWeek,
  subWeeks,
} from "date-fns";

import { getOccurrencesInRange } from "@/lib/recurrence";
import { habitsService } from "@/lib/services/habits";
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
        const [todos, habits] = await Promise.all([
          todosService.forDateRange(
            format(weekStart, "yyyy-MM-dd'T'00:00:00"),
            format(weekEnd, "yyyy-MM-dd'T'23:59:59"),
          ),
          habitsService.list(),
        ]);

        const todoItems: CalendarItem[] = todos.map((t) => ({
          id: t.id,
          title: t.title,
          start_datetime: t.start_datetime,
          end_datetime: t.end_datetime,
          all_day: t.all_day,
          kind: "todo",
          status: t.status,
          source_habit_id: t.source_habit_id,
          requires_numeric_log: t.requires_numeric_log,
          linked_goal_ids: [],
        }));

        const habitItems: CalendarItem[] = habits
          .filter((h) => h.auto_create_calendar_instances)
          .flatMap((habit) => {
            const dates = getOccurrencesInRange(habit, startStr, endStr);
            return dates.map((date) => ({
              id: `habit-${habit.id}-${date}`,
              title: habit.title,
              start_datetime: `${date}T08:00:00`,
              end_datetime: `${date}T08:30:00`,
              all_day: false,
              kind: "habit_occurrence" as const,
              status: "pending" as const,
              source_habit_id: habit.id,
              requires_numeric_log: habit.tracking_type !== "boolean",
              linked_goal_ids: [],
            }));
          });

        if (!cancelled) {
          setItems([...todoItems, ...habitItems]);
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
