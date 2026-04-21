import { describe, expect, it } from "vitest";

import type { Habit, LogEntry } from "./types";
import {
  buildHabitHeatmap,
  getHabitTodayState,
  getRemainingQuotaInPeriod,
} from "./habit-insights";
import { SKIPPED_LOG_NOTE } from "./habit-status";

const baseHabit: Omit<Habit, "id" | "title" | "recurrence_type" | "recurrence_config"> = {
  tracking_type: "boolean",
  auto_create_calendar_instances: true,
  is_active: true,
  created_at: "",
  updated_at: "",
};

function log(date: string, overrides?: Partial<LogEntry>): LogEntry {
  return {
    id: `l-${date}-${Math.random()}`,
    entry_date: date,
    entry_datetime: `${date}T08:00:00Z`,
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

describe("buildHabitHeatmap", () => {
  it("builds a 12-week matrix ending at today with status per day", () => {
    const heatmap = buildHabitHeatmap("habit-1", [
      log("2026-04-20"),
      log("2026-04-19", { note: SKIPPED_LOG_NOTE, numeric_value: 0 }),
    ], "2026-04-21");

    expect(heatmap).toHaveLength(84);
    expect(heatmap[83]?.date).toBe("2026-04-21");
    expect(heatmap.find((cell) => cell.date === "2026-04-20")?.status).toBe("complete");
    expect(heatmap.find((cell) => cell.date === "2026-04-19")?.status).toBe("skipped");
  });
});

describe("quota and today state", () => {
  it("returns remaining weekly quota for times_per_week", () => {
    const habit: Habit = {
      ...baseHabit,
      id: "habit-1",
      title: "Read",
      recurrence_type: "times_per_week",
      recurrence_config: { times_per_period: 3 },
    };

    const remaining = getRemainingQuotaInPeriod(habit, [
      log("2026-04-20"),
    ], "2026-04-21");

    expect(remaining).toBe(2);
  });

  it("distinguishes due vs optional today for times_per_week", () => {
    const habit: Habit = {
      ...baseHabit,
      id: "habit-1",
      title: "Read",
      recurrence_type: "times_per_week",
      recurrence_config: { times_per_period: 2 },
    };

    const dueState = getHabitTodayState(habit, [log("2026-04-20")], "2026-04-21");
    expect(dueState).toBe("due");

    const optionalState = getHabitTodayState(habit, [log("2026-04-20"), log("2026-04-22")], "2026-04-23");
    expect(optionalState).toBe("optional");
  });

  it("marks non-scheduled weekday as not_due", () => {
    const habit: Habit = {
      ...baseHabit,
      id: "habit-1",
      title: "Read",
      recurrence_type: "weekdays",
      recurrence_config: { weekdays: [1, 3, 5] },
    };

    const state = getHabitTodayState(habit, [], "2026-04-21"); // Tuesday
    expect(state).toBe("not_due");
  });
});
