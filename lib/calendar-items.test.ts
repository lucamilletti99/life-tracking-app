import { describe, expect, it } from "vitest";

import { buildCalendarItems } from "./calendar-items";
import { SKIPPED_LOG_NOTE } from "./habit-status";
import type { Habit, HabitGoalLink, LogEntry, Todo, TodoGoalLink } from "./types";

const baseHabit: Omit<Habit, "id" | "title" | "recurrence_type" | "recurrence_config"> = {
  tracking_type: "boolean",
  auto_create_calendar_instances: true,
  is_active: true,
  created_at: "",
  updated_at: "",
};

function habitLog(overrides: Partial<LogEntry>): LogEntry {
  return {
    id: `l-${Math.random()}`,
    entry_date: "2026-04-20",
    entry_datetime: "2026-04-20T09:00:00Z",
    source_type: "habit",
    source_id: "habit-1",
    numeric_value: 1,
    unit: undefined,
    note: undefined,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function todo(overrides: Partial<Todo>): Todo {
  return {
    id: "todo-1",
    title: "Manual task",
    start_datetime: "2026-04-20T09:00:00",
    end_datetime: "2026-04-20T09:30:00",
    all_day: false,
    status: "pending",
    source_type: "manual",
    requires_numeric_log: false,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("buildCalendarItems", () => {
  it("flags today after a skipped yesterday for never-miss-twice cue", () => {
    const habits: Habit[] = [
      {
        ...baseHabit,
        id: "habit-1",
        title: "Read",
        recurrence_type: "daily",
        recurrence_config: {},
      },
    ];

    const items = buildCalendarItems({
      todos: [],
      habits,
      logs: [
        habitLog({
          entry_date: "2026-04-20",
          entry_datetime: "2026-04-20T10:00:00Z",
          note: SKIPPED_LOG_NOTE,
          numeric_value: 0,
        }),
      ],
      habitGoalLinks: [],
      todoGoalLinks: [],
      start: "2026-04-21",
      end: "2026-04-21",
      today: "2026-04-21",
    });

    expect(items[0]?.never_miss_twice_alert).toBe(true);
  });

  it("flags today after a skipped previous scheduled day for non-daily habits", () => {
    const habits: Habit[] = [
      {
        ...baseHabit,
        id: "habit-1",
        title: "Read",
        recurrence_type: "weekdays",
        recurrence_config: { weekdays: [1, 3, 5] }, // Mon/Wed/Fri
      },
    ];

    const items = buildCalendarItems({
      todos: [],
      habits,
      logs: [
        habitLog({
          entry_date: "2026-04-20",
          entry_datetime: "2026-04-20T10:00:00Z",
          note: SKIPPED_LOG_NOTE,
          numeric_value: 0,
        }),
      ],
      habitGoalLinks: [],
      todoGoalLinks: [],
      start: "2026-04-22",
      end: "2026-04-22",
      today: "2026-04-22",
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.never_miss_twice_alert).toBe(true);
  });

  it("enriches habit occurrences with status and linked goals", () => {
    const habits: Habit[] = [
      {
        ...baseHabit,
        id: "habit-1",
        title: "Read",
        recurrence_type: "daily",
        recurrence_config: {},
      },
    ];

    const habitGoalLinks: HabitGoalLink[] = [
      { id: "hgl-1", habit_id: "habit-1", goal_id: "goal-1", created_at: "" },
    ];

    const items = buildCalendarItems({
      todos: [],
      habits,
      logs: [habitLog({ entry_date: "2026-04-20" })],
      habitGoalLinks,
      todoGoalLinks: [],
      start: "2026-04-20",
      end: "2026-04-20",
      today: "2026-04-20",
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "habit-habit-1-2026-04-20",
      status: "complete",
      linked_goal_ids: ["goal-1"],
    });
  });

  it("uses habit start time, duration, and unit for generated habit occurrences", () => {
    const habits: Habit[] = [
      {
        ...baseHabit,
        id: "habit-1",
        title: "Morning weigh-in",
        tracking_type: "measurement",
        unit: "lbs",
        cue_time: "07:15:00",
        recurrence_type: "daily",
        recurrence_config: { duration_minutes: 45 },
      },
    ];

    const items = buildCalendarItems({
      todos: [],
      habits,
      logs: [],
      habitGoalLinks: [],
      todoGoalLinks: [],
      start: "2026-04-22",
      end: "2026-04-22",
      today: "2026-04-22",
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      start_datetime: "2026-04-22T07:15:00",
      end_datetime: "2026-04-22T08:00:00",
      unit: "lbs",
    });
  });

  it("skips paused habits", () => {
    const habits: Habit[] = [
      {
        ...baseHabit,
        id: "habit-1",
        title: "Read",
        recurrence_type: "daily",
        recurrence_config: {},
        is_paused: true,
      },
    ];

    const items = buildCalendarItems({
      todos: [],
      habits,
      logs: [habitLog({ entry_date: "2026-04-20", note: SKIPPED_LOG_NOTE, numeric_value: 0 })],
      habitGoalLinks: [],
      todoGoalLinks: [],
      start: "2026-04-20",
      end: "2026-04-20",
      today: "2026-04-20",
    });

    expect(items).toHaveLength(0);
  });

  it("includes habits whose pause-until date has already passed", () => {
    const habits: Habit[] = [
      {
        ...baseHabit,
        id: "habit-1",
        title: "Read",
        recurrence_type: "daily",
        recurrence_config: {},
        is_paused: true,
        paused_until: "2026-04-20",
      },
    ];

    const items = buildCalendarItems({
      todos: [],
      habits,
      logs: [],
      habitGoalLinks: [],
      todoGoalLinks: [],
      start: "2026-04-21",
      end: "2026-04-21",
      today: "2026-04-21",
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe("habit-habit-1-2026-04-21");
  });

  it("enriches todos with linked goals", () => {
    const todoGoalLinks: TodoGoalLink[] = [
      { id: "tgl-1", todo_id: "todo-1", goal_id: "goal-2", created_at: "" },
    ];

    const items = buildCalendarItems({
      todos: [todo({ id: "todo-1" })],
      habits: [],
      logs: [],
      habitGoalLinks: [],
      todoGoalLinks,
      start: "2026-04-20",
      end: "2026-04-20",
      today: "2026-04-20",
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "todo-1",
      kind: "todo",
      linked_goal_ids: ["goal-2"],
    });
  });

  it("inherits unit from source habit for numeric habit-linked todos", () => {
    const habits: Habit[] = [
      {
        ...baseHabit,
        id: "habit-1",
        title: "Drink water",
        tracking_type: "measurement",
        unit: "oz",
        auto_create_calendar_instances: false,
        recurrence_type: "daily",
        recurrence_config: {},
      },
    ];

    const items = buildCalendarItems({
      todos: [
        todo({
          id: "todo-1",
          source_type: "habit_instance",
          source_habit_id: "habit-1",
          requires_numeric_log: true,
        }),
      ],
      habits,
      logs: [],
      habitGoalLinks: [],
      todoGoalLinks: [],
      start: "2026-04-20",
      end: "2026-04-20",
      today: "2026-04-20",
    });

    const todoItem = items.find((item) => item.id === "todo-1");
    expect(todoItem).toMatchObject({
      id: "todo-1",
      unit: "oz",
    });
  });
});
