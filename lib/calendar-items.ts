import { format, parseISO, subDays } from "date-fns";

import { getOccurrencesInRange } from "./recurrence";
import { getHabitOccurrenceStatusMap, habitStatusKey } from "./habit-status";
import type {
  CalendarItem,
  Habit,
  HabitGoalLink,
  LogEntry,
  Todo,
  TodoGoalLink,
} from "./types";

interface BuildCalendarItemsInput {
  todos: Todo[];
  habits: Habit[];
  logs: LogEntry[];
  habitGoalLinks: HabitGoalLink[];
  todoGoalLinks: TodoGoalLink[];
  start: string;
  end: string;
  today: string;
}

function buildLinkMap<T extends { goal_id: string }>(
  links: T[],
  idSelector: (link: T) => string,
): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const link of links) {
    const entityId = idSelector(link);
    const existing = map.get(entityId) ?? [];
    map.set(entityId, [...existing, link.goal_id]);
  }

  return map;
}

function dateBefore(dateIso: string): string {
  return format(subDays(parseISO(`${dateIso}T00:00:00`), 1), "yyyy-MM-dd");
}

export function buildCalendarItems({
  todos,
  habits,
  logs,
  habitGoalLinks,
  todoGoalLinks,
  start,
  end,
  today,
}: BuildCalendarItemsInput): CalendarItem[] {
  const habitGoalMap = buildLinkMap(habitGoalLinks, (link) => link.habit_id);
  const todoGoalMap = buildLinkMap(todoGoalLinks, (link) => link.todo_id);
  const habitStatusMap = getHabitOccurrenceStatusMap(logs);

  const todoItems: CalendarItem[] = todos.map((todo) => ({
    id: todo.id,
    title: todo.title,
    start_datetime: todo.start_datetime,
    end_datetime: todo.end_datetime,
    all_day: todo.all_day,
    kind: "todo",
    status: todo.status,
    source_habit_id: todo.source_habit_id,
    requires_numeric_log: todo.requires_numeric_log,
    linked_goal_ids: todoGoalMap.get(todo.id) ?? [],
  }));

  const habitItems: CalendarItem[] = habits
    .filter((habit) => habit.auto_create_calendar_instances)
    .filter((habit) => !habit.is_paused)
    .flatMap((habit) => {
      const linkedGoalIds = habitGoalMap.get(habit.id) ?? [];

      return getOccurrencesInRange(habit, start, end).map((date) => {
        const status = habitStatusMap.get(habitStatusKey(habit.id, date)) ?? "pending";
        const priorDateStatus = habitStatusMap.get(habitStatusKey(habit.id, dateBefore(date)));

        return {
          id: `habit-${habit.id}-${date}`,
          title: habit.title,
          start_datetime: `${date}T08:00:00`,
          end_datetime: `${date}T08:30:00`,
          all_day: false,
          kind: "habit_occurrence" as const,
          status,
          source_habit_id: habit.id,
          requires_numeric_log: habit.tracking_type !== "boolean",
          linked_goal_ids: linkedGoalIds,
          never_miss_twice_alert:
            date === today && status === "pending" && priorDateStatus === "skipped",
        };
      });
    });

  return [...todoItems, ...habitItems].sort((a, b) =>
    a.start_datetime.localeCompare(b.start_datetime),
  );
}
