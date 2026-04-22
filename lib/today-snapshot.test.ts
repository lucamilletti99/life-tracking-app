import { describe, expect, it } from "vitest";

import { buildTodaySnapshot } from "./today-snapshot";
import type { Goal, Habit, HabitGoalLink, LogEntry, Todo } from "./types";

const baseHabit: Omit<Habit, "id" | "title" | "recurrence_type" | "recurrence_config"> = {
  tracking_type: "boolean",
  auto_create_calendar_instances: true,
  is_active: true,
  created_at: "",
  updated_at: "",
};

function habit(overrides: Partial<Habit>): Habit {
  return {
    ...baseHabit,
    id: "habit-1",
    title: "Read",
    recurrence_type: "daily",
    recurrence_config: {},
    ...overrides,
  };
}

function goal(overrides: Partial<Goal>): Goal {
  return {
    id: "goal-1",
    title: "Read books",
    goal_type: "accumulation",
    unit: "pages",
    target_value: 200,
    start_date: "2026-04-01",
    end_date: "2026-04-30",
    is_active: true,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function todo(overrides: Partial<Todo>): Todo {
  return {
    id: "todo-1",
    title: "Plan chapter",
    start_datetime: "2026-04-21T09:00:00",
    end_datetime: "2026-04-21T09:30:00",
    all_day: false,
    status: "pending",
    source_type: "manual",
    requires_numeric_log: false,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function log(overrides: Partial<LogEntry>): LogEntry {
  return {
    id: `l-${Math.random()}`,
    entry_date: "2026-04-21",
    entry_datetime: "2026-04-21T08:00:00Z",
    source_type: "habit",
    source_id: "habit-1",
    numeric_value: 1,
    unit: "count",
    note: undefined,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("buildTodaySnapshot", () => {
  it("groups habits by time-of-day buckets and computes status", () => {
    const snapshot = buildTodaySnapshot({
      habits: [
        habit({ id: "h-morning", title: "Morning walk", cue_time: "07:30" }),
        habit({ id: "h-evening", title: "Evening read", cue_time: "19:00" }),
      ],
      todos: [todo({ id: "todo-1" })],
      goals: [goal()],
      logs: [
        log({ source_id: "h-morning", entry_date: "2026-04-21" }),
      ],
      habitGoalLinks: [
        { id: "hgl-1", habit_id: "h-morning", goal_id: "goal-1", created_at: "" },
      ],
      habitStacks: [],
      today: "2026-04-21",
    });

    expect(snapshot.habitGroups.morning).toHaveLength(1);
    expect(snapshot.habitGroups.evening).toHaveLength(1);
    expect(snapshot.habitGroups.morning[0]?.status).toBe("done");
    expect(snapshot.habitGroups.evening[0]?.status).toBe("due");
  });

  it("includes only today's todos and summary counters", () => {
    const snapshot = buildTodaySnapshot({
      habits: [habit({ id: "h1" }), habit({ id: "h2" })],
      todos: [
        todo({ id: "today", start_datetime: "2026-04-21T09:00:00" }),
        todo({ id: "other", start_datetime: "2026-04-20T09:00:00" }),
      ],
      goals: [goal()],
      logs: [log({ source_id: "h1", entry_date: "2026-04-21" })],
      habitGoalLinks: [] as HabitGoalLink[],
      habitStacks: [],
      today: "2026-04-21",
    });

    expect(snapshot.todosToday).toHaveLength(1);
    expect(snapshot.summary.totalHabits).toBe(2);
    expect(snapshot.summary.completedHabits).toBe(1);
    expect(snapshot.summary.habitsWithActiveStreak).toBeGreaterThanOrEqual(1);
  });

  it("includes stack sequencing cues for the next habit in a chain", () => {
    const snapshot = buildTodaySnapshot({
      habits: [
        habit({ id: "habit-a", title: "Drink water" }),
        habit({ id: "habit-b", title: "Meditate" }),
      ],
      todos: [],
      goals: [],
      logs: [log({ source_id: "habit-a", entry_date: "2026-04-21" })],
      habitGoalLinks: [],
      habitStacks: [
        {
          id: "stack-1",
          preceding_habit_id: "habit-a",
          following_habit_id: "habit-b",
          sort_order: 0,
          created_at: "",
        },
      ],
      today: "2026-04-21",
    });

    const stackedRow = snapshot.habitGroups.anytime.find((row) => row.habit.id === "habit-b");
    expect(stackedRow?.stackCueFromTitles).toEqual(["Drink water"]);
  });
});
