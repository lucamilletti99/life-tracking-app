import { describe, expect, it } from "vitest";

import type { LogEntry } from "./types";
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
});
