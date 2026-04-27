import { addMinutes, format, parseISO, subDays } from "date-fns";

import { isHabitEffectivelyPaused } from "./habit-pause";
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

const DEFAULT_HABIT_START_HOUR = 8;
const DEFAULT_HABIT_START_MINUTE = 0;
const DEFAULT_HABIT_DURATION_MINUTES = 30;
const PREVIOUS_OCCURRENCE_LOOKBACK_DAYS = 120;

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

function parseHabitStartTime(cueTime?: string): { hour: number; minute: number } {
  if (!cueTime) {
    return { hour: DEFAULT_HABIT_START_HOUR, minute: DEFAULT_HABIT_START_MINUTE };
  }

  const match = cueTime.match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return { hour: DEFAULT_HABIT_START_HOUR, minute: DEFAULT_HABIT_START_MINUTE };
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return { hour: DEFAULT_HABIT_START_HOUR, minute: DEFAULT_HABIT_START_MINUTE };
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return { hour: DEFAULT_HABIT_START_HOUR, minute: DEFAULT_HABIT_START_MINUTE };
  }

  return { hour, minute };
}

function buildPreviousOccurrenceByDate(
  habit: Habit,
  start: string,
  end: string,
): Map<string, string> {
  const lookbackStart = format(
    subDays(parseISO(`${start}T00:00:00`), PREVIOUS_OCCURRENCE_LOOKBACK_DAYS),
    "yyyy-MM-dd",
  );
  const allOccurrences = getOccurrencesInRange(habit, lookbackStart, end);
  const previousByDate = new Map<string, string>();

  for (let i = 1; i < allOccurrences.length; i += 1) {
    previousByDate.set(allOccurrences[i], allOccurrences[i - 1]);
  }

  return previousByDate;
}

function resolveHabitDurationMinutes(habit: Habit): number {
  const raw = habit.recurrence_config?.duration_minutes;
  const parsed =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number.parseInt(raw, 10)
        : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_HABIT_DURATION_MINUTES;
  }

  return Math.round(parsed);
}

function buildHabitWindow(habit: Habit, date: string): {
  start_datetime: string;
  end_datetime: string;
} {
  const start = parseISO(`${date}T00:00:00`);
  const { hour, minute } = parseHabitStartTime(habit.cue_time);
  start.setHours(hour, minute, 0, 0);

  const end = addMinutes(start, resolveHabitDurationMinutes(habit));

  return {
    start_datetime: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
    end_datetime: format(end, "yyyy-MM-dd'T'HH:mm:ss"),
  };
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
  const habitById = new Map(habits.map((habit) => [habit.id, habit]));

  const todoItems: CalendarItem[] = todos.map((todo) => ({
    id: todo.id,
    title: todo.title,
    start_datetime: todo.start_datetime,
    end_datetime: todo.end_datetime,
    unit: todo.source_habit_id ? habitById.get(todo.source_habit_id)?.unit : undefined,
    all_day: todo.all_day,
    kind: "todo",
    status: todo.status,
    source_habit_id: todo.source_habit_id,
    requires_numeric_log: todo.requires_numeric_log,
    linked_goal_ids: todoGoalMap.get(todo.id) ?? [],
  }));

  const habitItems: CalendarItem[] = habits
    .filter((habit) => habit.auto_create_calendar_instances)
    .filter((habit) => !isHabitEffectivelyPaused(habit, today))
    .flatMap((habit) => {
      const linkedGoalIds = habitGoalMap.get(habit.id) ?? [];
      const occurrences = getOccurrencesInRange(habit, start, end);
      const previousOccurrenceByDate = buildPreviousOccurrenceByDate(habit, start, end);

      return occurrences.map((date) => {
        const status = habitStatusMap.get(habitStatusKey(habit.id, date)) ?? "pending";
        const previousOccurrenceDate = previousOccurrenceByDate.get(date);
        const priorDateStatus = previousOccurrenceDate
          ? habitStatusMap.get(habitStatusKey(habit.id, previousOccurrenceDate))
          : undefined;
        const window = buildHabitWindow(habit, date);

        return {
          id: `habit-${habit.id}-${date}`,
          title: habit.title,
          ...window,
          unit: habit.unit,
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
