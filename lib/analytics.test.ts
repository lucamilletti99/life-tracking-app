import { describe, expect, it } from "vitest";

import { buildAnalyticsSnapshot } from "./analytics";
import type { Goal, Habit, LogEntry, Todo } from "./types";

const goalBase = {
  description: undefined,
  baseline_value: undefined,
  current_value_cache: undefined,
  is_active: true,
  created_at: "",
  updated_at: "",
};

describe("buildAnalyticsSnapshot", () => {
  it("computes expanded analytics payload", () => {
    const goals: Goal[] = [
      {
        ...goalBase,
        id: "g1",
        title: "Read",
        goal_type: "accumulation",
        unit: "pages",
        target_value: 100,
        start_date: "2026-04-01",
        end_date: "2026-04-30",
      },
    ];

    const habits: Habit[] = [
      {
        id: "h1",
        title: "Read habit",
        tracking_type: "numeric",
        unit: "pages",
        recurrence_type: "daily",
        recurrence_config: {},
        auto_create_calendar_instances: true,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      {
        id: "h2",
        title: "Walk",
        tracking_type: "boolean",
        recurrence_type: "daily",
        recurrence_config: {},
        auto_create_calendar_instances: true,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
    ];

    const todos: Todo[] = [
      {
        id: "t1",
        title: "Done todo",
        start_datetime: "2026-04-21T10:00:00",
        end_datetime: "2026-04-21T10:30:00",
        all_day: false,
        status: "complete",
        source_type: "manual",
        requires_numeric_log: false,
        created_at: "",
        updated_at: "",
      },
      {
        id: "t2",
        title: "Pending todo",
        start_datetime: "2026-04-20T10:00:00",
        end_datetime: "2026-04-20T10:30:00",
        all_day: false,
        status: "pending",
        source_type: "manual",
        requires_numeric_log: false,
        created_at: "",
        updated_at: "",
      },
    ];

    const logs: LogEntry[] = [
      {
        id: "l1",
        entry_date: "2026-04-20",
        entry_datetime: "2026-04-20T12:00:00",
        source_type: "habit",
        source_id: "h1",
        numeric_value: 20,
        unit: "pages",
        created_at: "",
        updated_at: "",
      },
      {
        id: "l2",
        entry_date: "2026-04-21",
        entry_datetime: "2026-04-21T12:00:00",
        source_type: "habit",
        source_id: "h1",
        numeric_value: 15,
        unit: "pages",
        created_at: "",
        updated_at: "",
      },
      {
        id: "l3",
        entry_date: "2026-04-21",
        entry_datetime: "2026-04-21T18:00:00",
        source_type: "habit",
        source_id: "h2",
        numeric_value: 1,
        unit: "count",
        created_at: "",
        updated_at: "",
      },
    ];

    const snapshot = buildAnalyticsSnapshot({
      goals,
      habits,
      todos,
      logs,
      days: 7,
      asOf: "2026-04-21",
    });

    expect(snapshot.totals.totalGoals).toBe(1);
    expect(snapshot.totals.totalHabits).toBe(2);
    expect(snapshot.streakLeaderboard[0]?.habitId).toBe("h1");
    expect(snapshot.habitStats).toHaveLength(2);
    expect(snapshot.weeklyComparison.thisWeekCompleted).toBeGreaterThanOrEqual(1);
    expect(snapshot.weeklyComparison.deltaPercent).toBeTypeOf("number");
    expect(snapshot.dayStrength.bestDay).toBeTruthy();
    expect(snapshot.habitHeatmaps).toHaveLength(2);
    expect(snapshot.habitHeatmaps[0]?.cells).toHaveLength(84);
  });
});
