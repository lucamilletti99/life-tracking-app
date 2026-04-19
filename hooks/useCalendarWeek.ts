import { useMemo, useState } from "react";
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

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const startStr = format(weekStart, "yyyy-MM-dd");
  const endStr = format(weekEnd, "yyyy-MM-dd");

  const items = useMemo((): CalendarItem[] => {
    const todos = todosService.forDateRange(
      format(weekStart, "yyyy-MM-dd'T'00:00:00"),
      format(weekEnd, "yyyy-MM-dd'T'23:59:59"),
    );

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

    const habits = habitsService
      .list()
      .filter((h) => h.auto_create_calendar_instances);

    const habitItems: CalendarItem[] = habits.flatMap((habit) => {
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

    return [...todoItems, ...habitItems];
  }, [currentDate, endStr, startStr, weekEnd, weekStart]);

  return {
    currentDate,
    weekStart,
    weekEnd,
    days,
    items,
    goToPrevWeek: () => setCurrentDate((d) => subWeeks(d, 1)),
    goToNextWeek: () => setCurrentDate((d) => addWeeks(d, 1)),
    goToToday: () => setCurrentDate(new Date()),
  };
}
