import { describe, expect, it } from "vitest";

import type { Habit, LogEntry } from "./types";
import { getHabitOccurrenceStatusMap, habitStatusKey, SKIPPED_LOG_NOTE } from "./habit-status";

function log(overrides: Partial<LogEntry>): LogEntry {
  return {
    id: crypto.randomUUID(),
    entry_date: "2026-04-20",
    entry_datetime: "2026-04-20T08:00:00Z",
    source_type: "habit",
    source_id: "habit-1",
    numeric_value: 1,
    unit: undefined,
    note: undefined,
    goal_ids: [],
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function habit(overrides: Partial<Habit>): Habit {
  return {
    id: "habit-1",
    title: "Spend less",
    tracking_type: "measurement",
    unit: "USD",
    recurrence_type: "daily",
    recurrence_config: {},
    target_direction: "at_most",
    default_target_value: 500,
    auto_create_calendar_instances: true,
    is_active: true,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("getHabitOccurrenceStatusMap", () => {
  it("marks a habit occurrence complete when a habit log exists for the same date", () => {
    const map = getHabitOccurrenceStatusMap([
      log({ source_id: "habit-a", entry_date: "2026-04-22" }),
    ]);

    expect(map.get(habitStatusKey("habit-a", "2026-04-22"))).toBe("complete");
  });

  it("marks skipped when latest log carries skip marker", () => {
    const map = getHabitOccurrenceStatusMap([
      log({
        source_id: "habit-a",
        entry_date: "2026-04-22",
        entry_datetime: "2026-04-22T10:00:00Z",
      }),
      log({
        source_id: "habit-a",
        entry_date: "2026-04-22",
        entry_datetime: "2026-04-22T12:00:00Z",
        note: SKIPPED_LOG_NOTE,
        numeric_value: 0,
      }),
    ]);

    expect(map.get(habitStatusKey("habit-a", "2026-04-22"))).toBe("skipped");
  });

  it("ignores non-habit log rows", () => {
    const map = getHabitOccurrenceStatusMap([
      log({ source_type: "todo", source_id: "todo-1" }),
      log({ source_type: "manual", source_id: undefined }),
    ]);

    expect(map.size).toBe(0);
  });

  it("marks failed when latest numeric value misses threshold", () => {
    const map = getHabitOccurrenceStatusMap(
      [
        log({
          source_id: "habit-a",
          entry_date: "2026-04-22",
          entry_datetime: "2026-04-22T10:00:00Z",
          numeric_value: 400,
        }),
        log({
          source_id: "habit-a",
          entry_date: "2026-04-22",
          entry_datetime: "2026-04-22T12:00:00Z",
          numeric_value: 650,
        }),
      ],
      [habit({ id: "habit-a", default_target_value: 500, target_direction: "at_most" })],
    );

    expect(map.get(habitStatusKey("habit-a", "2026-04-22"))).toBe("failed");
  });
});
