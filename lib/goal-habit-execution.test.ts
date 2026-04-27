import { describe, expect, it } from "vitest";

import { buildGoalHabitExecutionMap } from "./goal-habit-execution";
import type { Goal, Habit, HabitGoalLink, LogEntry } from "./types";

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    title: "Lose weight",
    goal_type: "target",
    unit: "lbs",
    target_value: 170,
    baseline_value: 180,
    start_date: "2026-04-01",
    end_date: "2026-05-01",
    is_active: true,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "habit-1",
    title: "Morning walk",
    tracking_type: "boolean",
    recurrence_type: "daily",
    recurrence_config: {},
    auto_create_calendar_instances: true,
    is_active: true,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function log(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: `l-${Math.random()}`,
    entry_date: "2026-04-25",
    entry_datetime: "2026-04-25T09:00:00Z",
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

describe("buildGoalHabitExecutionMap", () => {
  it("returns a no-link summary when no habits are linked", () => {
    const map = buildGoalHabitExecutionMap({
      goals: [goal()],
      habits: [habit()],
      habitGoalLinks: [],
      logs: [],
      today: "2026-04-25",
    });

    expect(map.get("goal-1")).toMatchObject({
      linkedHabits: 0,
      tone: "none",
    });
  });

  it("marks strong execution when linked habits are completed", () => {
    const goals = [goal()];
    const habits = [habit({ id: "habit-1" }), habit({ id: "habit-2", title: "Weigh-in" })];
    const habitGoalLinks: HabitGoalLink[] = [
      { id: "hgl-1", goal_id: "goal-1", habit_id: "habit-1", created_at: "" },
      { id: "hgl-2", goal_id: "goal-1", habit_id: "habit-2", created_at: "" },
    ];
    const weekDates = [
      "2026-04-19",
      "2026-04-20",
      "2026-04-21",
      "2026-04-22",
      "2026-04-23",
      "2026-04-24",
      "2026-04-25",
    ];
    const logs = weekDates.flatMap((date) => [
      log({ source_id: "habit-1", entry_date: date }),
      log({ source_id: "habit-2", entry_date: date, numeric_value: 1 }),
    ]);

    const map = buildGoalHabitExecutionMap({
      goals,
      habits,
      habitGoalLinks,
      logs,
      today: "2026-04-25",
    });

    expect(map.get("goal-1")).toMatchObject({
      linkedHabits: 2,
      dueToday: 2,
      completedToday: 2,
      tone: "strong",
    });
  });

  it("treats failed tracked habits as due but not completed", () => {
    const goals = [goal()];
    const habits = [
      habit({
        id: "habit-1",
        tracking_type: "measurement",
        unit: "USD",
        default_target_value: 500,
        target_direction: "at_most",
      }),
    ];
    const habitGoalLinks: HabitGoalLink[] = [
      { id: "hgl-1", goal_id: "goal-1", habit_id: "habit-1", created_at: "" },
    ];
    const logs = [log({ source_id: "habit-1", numeric_value: 700 })];

    const map = buildGoalHabitExecutionMap({
      goals,
      habits,
      habitGoalLinks,
      logs,
      today: "2026-04-25",
    });

    expect(map.get("goal-1")).toMatchObject({
      dueToday: 1,
      completedToday: 0,
    });
  });
});
