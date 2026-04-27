import { describe, expect, it } from "vitest";

import * as habitValidation from "./habit-validation";
import type { Habit } from "./types";

const {
  MEASUREMENT_UNIT_REQUIRED_MESSAGE,
  normalizeHabitUnit,
  prepareHabitCreatePayload,
  prepareHabitUpdatePayload,
} = habitValidation;

const baseHabit: Habit = {
  id: "habit-1",
  title: "Track weight",
  tracking_type: "measurement",
  recurrence_type: "daily",
  recurrence_config: {},
  auto_create_calendar_instances: true,
  is_active: true,
  created_at: "",
  updated_at: "",
};

describe("habit validation", () => {
  it("normalizes whitespace units", () => {
    expect(normalizeHabitUnit("  lbs  ")).toBe("lbs");
    expect(normalizeHabitUnit("   ")).toBeUndefined();
  });

  it("rejects measurement habit create payloads without a unit", () => {
    expect(() =>
      prepareHabitCreatePayload({
        ...baseHabit,
        unit: "  ",
      }),
    ).toThrow(MEASUREMENT_UNIT_REQUIRED_MESSAGE);
  });

  it("allows non-measurement habit create payloads without a unit", () => {
    const payload = prepareHabitCreatePayload({
      ...baseHabit,
      tracking_type: "boolean",
      unit: undefined,
    });
    expect(payload.unit).toBeUndefined();
  });

  it("rejects updates that would leave a measurement habit without a unit", () => {
    const current = {
      ...baseHabit,
      unit: "lbs",
    };
    expect(() => prepareHabitUpdatePayload(current, { unit: "  " })).toThrow(
      MEASUREMENT_UNIT_REQUIRED_MESSAGE,
    );
  });

  it("requires a unit when switching tracking type to measurement", () => {
    const current = {
      ...baseHabit,
      tracking_type: "boolean" as const,
      unit: undefined,
    };
    expect(() =>
      prepareHabitUpdatePayload(current, { tracking_type: "measurement" }),
    ).toThrow(MEASUREMENT_UNIT_REQUIRED_MESSAGE);
  });

  it("defaults target direction to at_least on create", () => {
    const payload = prepareHabitCreatePayload({
      ...baseHabit,
      unit: "lbs",
      target_direction: undefined,
    });
    expect(payload.target_direction).toBe("at_least");
  });

  it("clears target value for boolean tracking habits", () => {
    const payload = prepareHabitCreatePayload({
      ...baseHabit,
      tracking_type: "boolean",
      default_target_value: 3,
    });
    expect(payload.default_target_value).toBeUndefined();
  });

  it("serializes cleared update fields as nulls so persisted edits can remove hidden values", () => {
    const current = {
      ...baseHabit,
      unit: "pages",
      default_target_value: 30,
      cue_location: "Desk",
      cue_context: "After coffee",
      target_direction: "at_least" as const,
    };

    expect(typeof habitValidation.serializeHabitUpdatePayload).toBe("function");

    const payload = habitValidation.serializeHabitUpdatePayload?.(current, {
      tracking_type: "boolean",
      unit: undefined,
      default_target_value: undefined,
      cue_location: undefined,
      cue_context: undefined,
    });

    expect(payload).toMatchObject({
      tracking_type: "boolean",
      unit: null,
      default_target_value: null,
      cue_location: null,
      cue_context: null,
      target_direction: "at_least",
    });
  });
});
