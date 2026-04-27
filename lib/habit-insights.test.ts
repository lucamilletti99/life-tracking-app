import { describe, expect, it } from "vitest";

import type { Habit, LogEntry } from "./types";
import {
  buildHabitHeatmap,
  getHabitTodayState,
  getRemainingQuotaInPeriod,
  computeHabitCompletionRate,
  getAlignedHeatmapWindow,
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
  it("builds a 12-week matrix ending at today with status and value per day", () => {
    const heatmap = buildHabitHeatmap(
      "habit-1",
      [
        log("2026-04-20", { numeric_value: 178.4, unit: "lbs" }),
        log("2026-04-19", { note: SKIPPED_LOG_NOTE, numeric_value: 0 }),
      ],
      "2026-04-21",
      84,
      {
        id: "habit-1",
        tracking_type: "boolean",
      },
    );

    expect(heatmap).toHaveLength(84);
    expect(heatmap[83]?.date).toBe("2026-04-21");
    expect(heatmap.find((cell) => cell.date === "2026-04-20")?.status).toBe("complete");
    expect(heatmap.find((cell) => cell.date === "2026-04-20")?.value).toBe(178.4);
    expect(heatmap.find((cell) => cell.date === "2026-04-20")?.unit).toBe("lbs");
    expect(heatmap.find((cell) => cell.date === "2026-04-19")?.status).toBe("skipped");
    expect(heatmap.find((cell) => cell.date === "2026-04-19")?.value).toBeUndefined();
  });

  it("can return Monday-anchored week windows", () => {
    const heatmap = buildHabitHeatmap(
      "habit-1",
      [],
      "2026-04-23",
      84,
      {
        id: "habit-1",
        tracking_type: "boolean",
      },
    );

    const thisWeek = getAlignedHeatmapWindow(heatmap, "2026-04-23", 1);
    expect(thisWeek).toHaveLength(7);
    expect(thisWeek[0]?.date).toBe("2026-04-20");
    expect(thisWeek[6]?.date).toBe("2026-04-26");

    const fourWeeks = getAlignedHeatmapWindow(heatmap, "2026-04-23", 4);
    expect(fourWeeks).toHaveLength(28);
    expect(fourWeeks[0]?.date).toBe("2026-03-30");
    expect(fourWeeks[27]?.date).toBe("2026-04-26");
  });

  it("uses habit threshold rules for numeric completion status", () => {
    const heatmap = buildHabitHeatmap(
      "habit-1",
      [log("2026-04-21", { numeric_value: 2 })],
      "2026-04-21",
      7,
      {
        id: "habit-1",
        tracking_type: "measurement",
        default_target_value: 5,
        target_direction: "at_least",
      },
    );

    expect(heatmap.find((cell) => cell.date === "2026-04-21")?.status).toBe("failed");
  });
});

describe("completion rate", () => {
  it("computes rolling completion rate across expected occurrences", () => {
    const habit: Habit = {
      ...baseHabit,
      id: "habit-1",
      title: "Read",
      recurrence_type: "daily",
      recurrence_config: {},
    };

    const rate = computeHabitCompletionRate(habit, [
      log("2026-04-20"),
      log("2026-04-21"),
    ], "2026-04-21", 4);

    expect(rate).toBe(50);
  });

  it("uses per-week expected occurrences for times_per_week habits", () => {
    const habit: Habit = {
      ...baseHabit,
      id: "habit-1",
      title: "Run",
      recurrence_type: "times_per_week",
      recurrence_config: { times_per_period: 3 },
    };

    const rate = computeHabitCompletionRate(
      habit,
      [log("2026-04-13"), log("2026-04-20")],
      "2026-04-26",
      14,
    );

    expect(rate).toBe(33);
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

  it("returns failed when a tracked log misses the configured threshold", () => {
    const habit: Habit = {
      ...baseHabit,
      id: "habit-1",
      title: "Spend less",
      tracking_type: "measurement",
      unit: "USD",
      recurrence_type: "daily",
      recurrence_config: {},
      default_target_value: 500,
      target_direction: "at_most",
    };

    const state = getHabitTodayState(
      habit,
      [log("2026-04-21", { source_id: "habit-1", numeric_value: 550 })],
      "2026-04-21",
    );

    expect(state).toBe("failed");
  });

  it("returns skipped when today is explicitly skipped", () => {
    const habit: Habit = {
      ...baseHabit,
      id: "habit-1",
      title: "Read",
      recurrence_type: "daily",
      recurrence_config: {},
    };

    const state = getHabitTodayState(
      habit,
      [log("2026-04-21", { note: SKIPPED_LOG_NOTE, numeric_value: 0 })],
      "2026-04-21",
    );

    expect(state).toBe("skipped");
  });

  it("treats pause-until in the past as active", () => {
    const habit: Habit = {
      ...baseHabit,
      id: "habit-1",
      title: "Read",
      recurrence_type: "daily",
      recurrence_config: {},
      is_paused: true,
      paused_until: "2026-04-20",
    };

    const state = getHabitTodayState(habit, [], "2026-04-21");
    expect(state).toBe("due");
  });
});
