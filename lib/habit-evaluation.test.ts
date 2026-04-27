import { describe, expect, it } from "vitest";

import { evaluateHabitLogStatus } from "./habit-evaluation";
import { SKIPPED_LOG_NOTE } from "./habit-status";
import type { Habit, LogEntry } from "./types";

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "habit-1",
    title: "Spend less",
    tracking_type: "measurement",
    unit: "USD",
    recurrence_type: "daily",
    recurrence_config: {},
    default_target_value: 500,
    target_direction: "at_most",
    auto_create_calendar_instances: true,
    is_active: true,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function log(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: "log-1",
    entry_date: "2026-04-25",
    entry_datetime: "2026-04-25T09:00:00Z",
    source_type: "habit",
    source_id: "habit-1",
    numeric_value: 300,
    unit: "USD",
    note: undefined,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("evaluateHabitLogStatus", () => {
  it("marks at_most habits complete when value is below target", () => {
    const status = evaluateHabitLogStatus(habit(), log({ numeric_value: 300 }));
    expect(status).toBe("complete");
  });

  it("marks at_most habits complete when value equals target", () => {
    const status = evaluateHabitLogStatus(habit(), log({ numeric_value: 500 }));
    expect(status).toBe("complete");
  });

  it("marks at_most habits failed when value exceeds target", () => {
    const status = evaluateHabitLogStatus(habit(), log({ numeric_value: 501 }));
    expect(status).toBe("failed");
  });

  it("marks at_least habits failed when value is below target", () => {
    const status = evaluateHabitLogStatus(
      habit({ target_direction: "at_least" }),
      log({ numeric_value: 499 }),
    );
    expect(status).toBe("failed");
  });

  it("respects skip marker over threshold logic", () => {
    const status = evaluateHabitLogStatus(
      habit({ target_direction: "at_least" }),
      log({ numeric_value: 999, note: SKIPPED_LOG_NOTE }),
    );
    expect(status).toBe("skipped");
  });

  it("keeps legacy behavior when no target value is configured", () => {
    const status = evaluateHabitLogStatus(
      habit({ default_target_value: undefined }),
      log({ numeric_value: 999 }),
    );
    expect(status).toBe("complete");
  });
});
