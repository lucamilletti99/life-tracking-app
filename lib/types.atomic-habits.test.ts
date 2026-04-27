import { describe, expect, it } from "vitest";

import type { Habit, LogEntry } from "./types";

describe("Atomic habits type extensions", () => {
  it("supports cue/identity/ease fields on Habit", () => {
    const habit: Habit = {
      id: "h1",
      title: "Morning run",
      description: "Run outside",
      tracking_type: "duration",
      unit: "min",
      recurrence_type: "daily",
      recurrence_config: {},
      default_target_value: 30,
      target_direction: "at_least",
      auto_create_calendar_instances: true,
      is_active: true,
      created_at: "2026-04-21T00:00:00Z",
      updated_at: "2026-04-21T00:00:00Z",
      cue_time: "07:30",
      cue_location: "Neighborhood",
      cue_context: "After coffee",
      implementation_intention: "When I finish coffee, I run outside for 30 minutes.",
      minimum_version: "Put on running shoes and walk 2 minutes",
      environment_setup: "Set shoes by the door at night",
      identity_statement: "I am someone who moves daily.",
      temptation_bundle: "Only listen to favorite podcast while running",
      is_paused: false,
      paused_until: undefined,
      difficulty_rating: 3,
      sort_order: 10,
      category: "health",
      color_tag: "#16a34a",
    };

    expect(habit.identity_statement).toBe("I am someone who moves daily.");
    expect(habit.cue_time).toBe("07:30");
    expect(habit.target_direction).toBe("at_least");
  });

  it("supports optional completion metadata on LogEntry", () => {
    const log: LogEntry = {
      id: "l1",
      entry_date: "2026-04-21",
      entry_datetime: "2026-04-21T07:35:00Z",
      source_type: "habit",
      source_id: "h1",
      numeric_value: 30,
      unit: "min",
      note: "Felt strong",
      completion_photo_url: "https://example.com/run.jpg",
      mood_rating: 4,
      difficulty_felt: 2,
      created_at: "2026-04-21T07:35:00Z",
      updated_at: "2026-04-21T07:35:00Z",
    };

    expect(log.mood_rating).toBe(4);
    expect(log.completion_photo_url).toContain("example.com");
  });
});
