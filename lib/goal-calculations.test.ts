import { describe, expect, it } from "vitest";

import {
  buildGoalTrajectory,
  buildGoalTrajectoryMessage,
  calculateGoalProgress,
} from "./goal-calculations";
import type { Goal, LogEntry } from "./types";

const base = {
  description: undefined,
  baseline_value: undefined,
  current_value_cache: undefined,
  is_active: true,
  created_at: "",
  updated_at: "",
};

describe("target goal", () => {
  it("calculates progress toward lower target (e.g. weight loss)", () => {
    const goal: Goal = {
      ...base,
      id: "g1",
      title: "Lose weight",
      goal_type: "target",
      unit: "lbs",
      target_value: 170,
      baseline_value: 180,
      start_date: "2026-04-01",
      end_date: "2026-06-30",
    };
    const logs: LogEntry[] = [
      {
        id: "l1",
        entry_date: "2026-04-15",
        entry_datetime: "2026-04-15T07:00:00Z",
        source_type: "habit",
        numeric_value: 175,
        unit: "lbs",
        goal_ids: [],
        created_at: "",
        updated_at: "",
      },
    ];

    const result = calculateGoalProgress(goal, logs);

    expect(result.current_value).toBe(175);
    expect(result.percentage).toBe(50);
  });
});

describe("accumulation goal", () => {
  it("sums logs within date range", () => {
    const goal: Goal = {
      ...base,
      id: "g2",
      title: "Read 500 pages",
      goal_type: "accumulation",
      unit: "pages",
      target_value: 500,
      start_date: "2026-04-01",
      end_date: "2026-04-30",
    };
    const logs: LogEntry[] = [
      {
        id: "l1",
        entry_date: "2026-04-10",
        entry_datetime: "2026-04-10T20:00:00Z",
        source_type: "habit",
        numeric_value: 42,
        unit: "pages",
        goal_ids: [],
        created_at: "",
        updated_at: "",
      },
      {
        id: "l2",
        entry_date: "2026-04-11",
        entry_datetime: "2026-04-11T20:00:00Z",
        source_type: "habit",
        numeric_value: 38,
        unit: "pages",
        goal_ids: [],
        created_at: "",
        updated_at: "",
      },
      {
        id: "l3",
        entry_date: "2026-03-31",
        entry_datetime: "2026-03-31T20:00:00Z",
        source_type: "habit",
        numeric_value: 100,
        unit: "pages",
        goal_ids: [],
        created_at: "",
        updated_at: "",
      },
    ];

    const result = calculateGoalProgress(goal, logs);

    expect(result.current_value).toBe(80);
    expect(result.percentage).toBe(16);
  });
});

describe("limit goal", () => {
  it("computes remaining budget and marks on track when under limit", () => {
    const goal: Goal = {
      ...base,
      id: "g3",
      title: "Spend < $600/week",
      goal_type: "limit",
      unit: "USD",
      target_value: 600,
      start_date: "2026-04-14",
      end_date: "2026-04-20",
    };
    const logs: LogEntry[] = [
      {
        id: "l1",
        entry_date: "2026-04-14",
        entry_datetime: "2026-04-14T20:00:00Z",
        source_type: "habit",
        numeric_value: 84,
        unit: "USD",
        goal_ids: [],
        created_at: "",
        updated_at: "",
      },
      {
        id: "l2",
        entry_date: "2026-04-15",
        entry_datetime: "2026-04-15T20:00:00Z",
        source_type: "habit",
        numeric_value: 120,
        unit: "USD",
        goal_ids: [],
        created_at: "",
        updated_at: "",
      },
    ];

    const inProgress = calculateGoalProgress(goal, logs, undefined, "2026-04-18");
    const afterEnd = calculateGoalProgress(goal, logs, undefined, "2026-04-21");

    expect(inProgress.current_value).toBe(204);
    expect(inProgress.is_on_track).toBe(true);
    expect(inProgress.percentage).toBe(66); // remaining budget: (1 - 204/600) * 100
    expect(inProgress.is_completed).toBe(false);
    expect(afterEnd.is_completed).toBe(true);
  });

  it("marks off track when over limit", () => {
    const goal: Goal = {
      ...base,
      id: "g3",
      title: "Spend < $600/week",
      goal_type: "limit",
      unit: "USD",
      target_value: 600,
      start_date: "2026-04-14",
      end_date: "2026-04-20",
    };
    const logs: LogEntry[] = Array.from({ length: 7 }, (_, i) => ({
      id: `l${i}`,
      entry_date: `2026-04-${14 + i}`,
      entry_datetime: `2026-04-${14 + i}T20:00:00Z`,
      source_type: "habit" as const,
      numeric_value: 100,
      unit: "USD",
      goal_ids: [] as string[],
      created_at: "",
      updated_at: "",
    }));

    const result = calculateGoalProgress(goal, logs);

    expect(result.is_on_track).toBe(false);
    expect(result.is_completed).toBe(false);
  });

  it("does not mark limit goals completed until the goal period ends", () => {
    const goal: Goal = {
      ...base,
      id: "g3",
      title: "Spend < $600/week",
      goal_type: "limit",
      unit: "USD",
      target_value: 600,
      start_date: "2026-04-14",
      end_date: "2026-04-20",
    };

    const inProgress = calculateGoalProgress(goal, [], undefined, "2026-04-18");
    const afterEnd = calculateGoalProgress(goal, [], undefined, "2026-04-21");

    expect(inProgress.is_completed).toBe(false);
    expect(afterEnd.is_completed).toBe(true);
  });
});

describe("goal trajectory", () => {
  it("projects accumulation goals with pace direction", () => {
    const goal: Goal = {
      ...base,
      id: "g-acc",
      title: "Read 100 pages",
      goal_type: "accumulation",
      unit: "pages",
      target_value: 100,
      start_date: "2026-04-01",
      end_date: "2026-04-10",
    };

    const logs: LogEntry[] = [
      {
        id: "l1",
        entry_date: "2026-04-01",
        entry_datetime: "2026-04-01T10:00:00Z",
        source_type: "habit",
        numeric_value: 10,
        unit: "pages",
        created_at: "",
        updated_at: "",
      },
      {
        id: "l2",
        entry_date: "2026-04-04",
        entry_datetime: "2026-04-04T10:00:00Z",
        source_type: "habit",
        numeric_value: 15,
        unit: "pages",
        created_at: "",
        updated_at: "",
      },
    ];

    const trajectory = buildGoalTrajectory(goal, logs, "2026-04-05");
    expect(trajectory.current).toBe(25);
    expect(trajectory.expectedByNow).toBeGreaterThan(25);
    expect(trajectory.paceLabel).toBe("behind");
    expect(trajectory.projectedEndValue).toBeGreaterThan(0);
  });

  it("flags limit goals that are projected to overshoot", () => {
    const goal: Goal = {
      ...base,
      id: "g-limit",
      title: "Spend under 600",
      goal_type: "limit",
      unit: "USD",
      target_value: 600,
      start_date: "2026-04-01",
      end_date: "2026-04-30",
    };

    const logs: LogEntry[] = Array.from({ length: 10 }, (_, i) => ({
      id: `l${i}`,
      entry_date: `2026-04-${String(i + 1).padStart(2, "0")}`,
      entry_datetime: `2026-04-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
      source_type: "habit" as const,
      numeric_value: 30,
      unit: "USD",
      created_at: "",
      updated_at: "",
    }));

    const trajectory = buildGoalTrajectory(goal, logs, "2026-04-10");
    expect(trajectory.paceLabel).toBe("behind");
    expect(trajectory.projectedEndValue).toBeGreaterThan(goal.target_value);
  });

  it("returns compounding-in-progress messaging when behind but trend is improving", () => {
    const goal: Goal = {
      ...base,
      id: "g-acc-improving",
      title: "Read 200 pages",
      goal_type: "accumulation",
      unit: "pages",
      target_value: 200,
      start_date: "2026-04-01",
      end_date: "2026-04-20",
    };

    const logs: LogEntry[] = [
      {
        id: "l1",
        entry_date: "2026-04-10",
        entry_datetime: "2026-04-10T10:00:00Z",
        source_type: "habit",
        numeric_value: 15,
        unit: "pages",
        created_at: "",
        updated_at: "",
      },
      {
        id: "l2",
        entry_date: "2026-04-11",
        entry_datetime: "2026-04-11T10:00:00Z",
        source_type: "habit",
        numeric_value: 25,
        unit: "pages",
        created_at: "",
        updated_at: "",
      },
      {
        id: "l3",
        entry_date: "2026-04-12",
        entry_datetime: "2026-04-12T10:00:00Z",
        source_type: "habit",
        numeric_value: 30,
        unit: "pages",
        created_at: "",
        updated_at: "",
      },
    ];

    const trajectory = buildGoalTrajectory(goal, logs, "2026-04-12");
    const message = buildGoalTrajectoryMessage(goal, trajectory);

    expect(trajectory.paceLabel).toBe("behind");
    expect(message.title).toContain("Compounding in progress");
  });

  it("returns projected-date messaging when pace is on track", () => {
    const goal: Goal = {
      ...base,
      id: "g-acc-on-track",
      title: "Read 100 pages",
      goal_type: "accumulation",
      unit: "pages",
      target_value: 100,
      start_date: "2026-04-01",
      end_date: "2026-04-10",
    };

    const logs: LogEntry[] = [
      {
        id: "l1",
        entry_date: "2026-04-01",
        entry_datetime: "2026-04-01T10:00:00Z",
        source_type: "habit",
        numeric_value: 10,
        unit: "pages",
        created_at: "",
        updated_at: "",
      },
      {
        id: "l2",
        entry_date: "2026-04-02",
        entry_datetime: "2026-04-02T10:00:00Z",
        source_type: "habit",
        numeric_value: 10,
        unit: "pages",
        created_at: "",
        updated_at: "",
      },
      {
        id: "l3",
        entry_date: "2026-04-03",
        entry_datetime: "2026-04-03T10:00:00Z",
        source_type: "habit",
        numeric_value: 10,
        unit: "pages",
        created_at: "",
        updated_at: "",
      },
      {
        id: "l4",
        entry_date: "2026-04-04",
        entry_datetime: "2026-04-04T10:00:00Z",
        source_type: "habit",
        numeric_value: 10,
        unit: "pages",
        created_at: "",
        updated_at: "",
      },
      {
        id: "l5",
        entry_date: "2026-04-05",
        entry_datetime: "2026-04-05T10:00:00Z",
        source_type: "habit",
        numeric_value: 10,
        unit: "pages",
        created_at: "",
        updated_at: "",
      },
    ];

    const trajectory = buildGoalTrajectory(goal, logs, "2026-04-05");
    const message = buildGoalTrajectoryMessage(goal, trajectory);

    expect(trajectory.paceLabel).toBe("on_track");
    expect(message.detail).toContain("At current pace");
  });
});
