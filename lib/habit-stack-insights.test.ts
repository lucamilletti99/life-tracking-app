import { describe, expect, it } from "vitest";

import { SKIPPED_LOG_NOTE } from "./habit-status";
import { buildHabitStackCueMap } from "./habit-stack-insights";
import type { Habit, HabitStack, LogEntry } from "./types";

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
    title: "Habit",
    recurrence_type: "daily",
    recurrence_config: {},
    ...overrides,
  };
}

function stack(overrides: Partial<HabitStack>): HabitStack {
  return {
    id: "stack-1",
    preceding_habit_id: "habit-a",
    following_habit_id: "habit-b",
    sort_order: 0,
    created_at: "",
    ...overrides,
  };
}

function log(overrides: Partial<LogEntry>): LogEntry {
  return {
    id: "log-1",
    entry_date: "2026-04-21",
    entry_datetime: "2026-04-21T08:00:00Z",
    source_type: "habit",
    source_id: "habit-a",
    numeric_value: 1,
    note: undefined,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("buildHabitStackCueMap", () => {
  it("flags the following habit when precedent is completed today", () => {
    const cues = buildHabitStackCueMap({
      habits: [
        habit({ id: "habit-a", title: "Stack start" }),
        habit({ id: "habit-b", title: "Stack next" }),
      ],
      stacks: [stack()],
      logs: [log({ source_id: "habit-a" })],
      today: "2026-04-21",
    });

    expect(cues.get("habit-b")).toEqual(["habit-a"]);
  });

  it("does not flag when the following habit is already complete today", () => {
    const cues = buildHabitStackCueMap({
      habits: [
        habit({ id: "habit-a", title: "Stack start" }),
        habit({ id: "habit-b", title: "Stack next" }),
      ],
      stacks: [stack()],
      logs: [
        log({ source_id: "habit-a" }),
        log({ id: "log-2", source_id: "habit-b" }),
      ],
      today: "2026-04-21",
    });

    expect(cues.has("habit-b")).toBe(false);
  });

  it("ignores skipped precedent and paused following habits", () => {
    const cues = buildHabitStackCueMap({
      habits: [
        habit({ id: "habit-a", title: "Stack start" }),
        habit({ id: "habit-b", title: "Stack next", is_paused: true }),
      ],
      stacks: [stack()],
      logs: [log({ source_id: "habit-a", note: SKIPPED_LOG_NOTE, numeric_value: 0 })],
      today: "2026-04-21",
    });

    expect(cues.size).toBe(0);
  });
});
