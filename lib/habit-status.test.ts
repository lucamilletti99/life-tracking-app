import { describe, expect, it } from "vitest";

import type { LogEntry } from "./types";
import {
  SKIPPED_LOG_NOTE,
  getHabitLogStatusMap,
  habitStatusKey,
} from "./habit-status";

function buildLog(overrides: Partial<LogEntry>): LogEntry {
  return {
    id: `log-${Math.random()}`,
    entry_date: "2026-04-20",
    entry_datetime: "2026-04-20T08:00:00Z",
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

describe("getHabitLogStatusMap", () => {
  it("marks complete when latest habit log is not skipped", () => {
    const map = getHabitLogStatusMap([
      buildLog({ source_id: "h-a", entry_date: "2026-04-22" }),
    ]);

    expect(map.get(habitStatusKey("h-a", "2026-04-22"))).toBe("complete");
  });

  it("marks skipped when latest log has skipped note", () => {
    const map = getHabitLogStatusMap([
      buildLog({
        source_id: "h-a",
        entry_date: "2026-04-22",
        entry_datetime: "2026-04-22T08:00:00Z",
      }),
      buildLog({
        source_id: "h-a",
        entry_date: "2026-04-22",
        entry_datetime: "2026-04-22T12:00:00Z",
        note: SKIPPED_LOG_NOTE,
        numeric_value: 0,
      }),
    ]);

    expect(map.get(habitStatusKey("h-a", "2026-04-22"))).toBe("skipped");
  });

  it("ignores non-habit logs", () => {
    const map = getHabitLogStatusMap([
      buildLog({ source_type: "todo", source_id: "todo-1" }),
      buildLog({ source_type: "manual", source_id: undefined }),
    ]);

    expect(map.size).toBe(0);
  });
});
