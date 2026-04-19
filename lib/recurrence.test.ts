import { describe, expect, it } from "vitest";

import { getOccurrencesInRange } from "./recurrence";
import type { Habit } from "./types";

const base = {
  id: "h1",
  title: "Test",
  tracking_type: "numeric" as const,
  auto_create_calendar_instances: true,
  is_active: true,
  created_at: "",
  updated_at: "",
};

describe("daily recurrence", () => {
  it("returns one occurrence per day", () => {
    const habit: Habit = { ...base, recurrence_type: "daily", recurrence_config: {} };
    const dates = getOccurrencesInRange(habit, "2026-04-14", "2026-04-20");

    expect(dates).toHaveLength(7);
    expect(dates[0]).toBe("2026-04-14");
    expect(dates[6]).toBe("2026-04-20");
  });
});

describe("weekdays recurrence", () => {
  it("returns only specified weekdays", () => {
    const habit: Habit = {
      ...base,
      recurrence_type: "weekdays",
      recurrence_config: { weekdays: [1, 3] },
    };
    const dates = getOccurrencesInRange(habit, "2026-04-14", "2026-04-20");

    expect(dates).toContain("2026-04-15");
    expect(dates).toContain("2026-04-20");
    expect(dates).not.toContain("2026-04-14");
  });
});

describe("times_per_week recurrence", () => {
  it("returns exactly N dates spread through the week", () => {
    const habit: Habit = {
      ...base,
      recurrence_type: "times_per_week",
      recurrence_config: { times_per_period: 3 },
    };
    const dates = getOccurrencesInRange(habit, "2026-04-14", "2026-04-20");

    expect(dates).toHaveLength(3);
  });
});

describe("day_of_month recurrence", () => {
  it("returns only the specified day number", () => {
    const habit: Habit = {
      ...base,
      recurrence_type: "day_of_month",
      recurrence_config: { day_of_month: 15 },
    };
    const dates = getOccurrencesInRange(habit, "2026-04-01", "2026-04-30");

    expect(dates).toEqual(["2026-04-15"]);
  });
});
