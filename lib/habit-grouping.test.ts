import { describe, expect, it } from "vitest";

import type { Goal, Habit, HabitGoalLink } from "./types";
import { groupHabitsByGoal } from "./habit-grouping";

const goalBase = {
  description: undefined,
  baseline_value: undefined,
  current_value_cache: undefined,
  is_active: true,
  created_at: "",
  updated_at: "",
};

const habitBase = {
  description: undefined,
  unit: undefined,
  default_target_value: undefined,
  auto_create_calendar_instances: true,
  is_active: true,
  created_at: "",
  updated_at: "",
};

describe("groupHabitsByGoal", () => {
  it("groups habits under each goal and keeps unlinked habits separate", () => {
    const goals: Goal[] = [
      {
        ...goalBase,
        id: "g1",
        title: "Goal A",
        goal_type: "target",
        unit: "unit",
        target_value: 10,
        start_date: "2026-04-01",
        end_date: "2026-04-30",
      },
      {
        ...goalBase,
        id: "g2",
        title: "Goal B",
        goal_type: "accumulation",
        unit: "unit",
        target_value: 20,
        start_date: "2026-04-01",
        end_date: "2026-04-30",
      },
    ];

    const habits: Habit[] = [
      {
        ...habitBase,
        id: "h1",
        title: "Habit 1",
        tracking_type: "boolean",
        recurrence_type: "daily",
        recurrence_config: {},
      },
      {
        ...habitBase,
        id: "h2",
        title: "Habit 2",
        tracking_type: "numeric",
        recurrence_type: "times_per_week",
        recurrence_config: { times_per_period: 3 },
      },
      {
        ...habitBase,
        id: "h3",
        title: "Habit 3",
        tracking_type: "amount",
        recurrence_type: "times_per_month",
        recurrence_config: { times_per_period: 1 },
      },
    ];

    const links: HabitGoalLink[] = [
      {
        id: "l1",
        habit_id: "h1",
        goal_id: "g1",
        created_at: "",
      },
      {
        id: "l2",
        habit_id: "h2",
        goal_id: "g2",
        created_at: "",
      },
    ];

    const grouped = groupHabitsByGoal({ goals, habits, links });

    expect(grouped.sections).toHaveLength(2);
    expect(grouped.sections[0].goal.title).toBe("Goal A");
    expect(grouped.sections[0].habits.map((h) => h.id)).toEqual(["h1"]);
    expect(grouped.sections[1].goal.title).toBe("Goal B");
    expect(grouped.sections[1].habits.map((h) => h.id)).toEqual(["h2"]);
    expect(grouped.unlinked.map((h) => h.id)).toEqual(["h3"]);
  });

  it("deduplicates repeated habit-goal links in the same section", () => {
    const goals: Goal[] = [
      {
        ...goalBase,
        id: "g1",
        title: "Goal A",
        goal_type: "target",
        unit: "unit",
        target_value: 10,
        start_date: "2026-04-01",
        end_date: "2026-04-30",
      },
    ];

    const habits: Habit[] = [
      {
        ...habitBase,
        id: "h1",
        title: "Habit 1",
        tracking_type: "boolean",
        recurrence_type: "daily",
        recurrence_config: {},
      },
    ];

    const links: HabitGoalLink[] = [
      { id: "l1", habit_id: "h1", goal_id: "g1", created_at: "" },
      { id: "l2", habit_id: "h1", goal_id: "g1", created_at: "" },
    ];

    const grouped = groupHabitsByGoal({ goals, habits, links });

    expect(grouped.sections).toHaveLength(1);
    expect(grouped.sections[0].habits.map((h) => h.id)).toEqual(["h1"]);
  });
});
