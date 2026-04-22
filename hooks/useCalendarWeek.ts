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

import { getOccurrencesInRange } from "@/lib/recurrence";
import { habitsService } from "@/lib/services/habits";
import { getServiceContext } from "@/lib/services/context";
import { getHabitOccurrenceStatusMap, habitStatusKey } from "@/lib/habit-status";
import { logsService } from "@/lib/services/logs";
import { todosService } from "@/lib/services/todos";
import type { CalendarItem, HabitGoalLink, TodoGoalLink } from "@/lib/types";

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
  const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
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
        const ctx = await getServiceContext();
        const [todos, habits, logs] = await Promise.all([
          todosService.forDateRange(
            ctx,
            format(rangeStart, "yyyy-MM-dd'T'00:00:00"),
            format(rangeEnd, "yyyy-MM-dd'T'23:59:59"),
          ),
          habitsService.list(ctx),
          logsService.forDateRange(ctx, startStr, endStr),
        ]);

        const habitIds = habits.map((h) => h.id);
        const todoIds = todos.map((t) => t.id);

        const [habitGoalLinks, todoGoalLinks] = await Promise.all([
          habitsService.listGoalLinksForHabitIds(ctx, habitIds),
          todosService.listGoalLinksForIds(ctx, todoIds),
        ]);

        const habitGoalMap = new Map<string, string[]>();
        for (const link of habitGoalLinks as HabitGoalLink[]) {
          const ids = habitGoalMap.get(link.habit_id) ?? [];
          ids.push(link.goal_id);
          habitGoalMap.set(link.habit_id, ids);
        }

        const todoGoalMap = new Map<string, string[]>();
        for (const link of todoGoalLinks as TodoGoalLink[]) {
          const ids = todoGoalMap.get(link.todo_id) ?? [];
          ids.push(link.goal_id);
          todoGoalMap.set(link.todo_id, ids);
        }

        const habitStatusMap = getHabitOccurrenceStatusMap(logs);

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
          linked_goal_ids: todoGoalMap.get(t.id) ?? [],
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
              status: habitStatusMap.get(habitStatusKey(habit.id, date)) ?? "pending",
              source_habit_id: habit.id,
              requires_numeric_log: habit.tracking_type !== "boolean",
              linked_goal_ids: habitGoalMap.get(habit.id) ?? [],
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
