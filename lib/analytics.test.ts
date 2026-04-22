import { describe, expect, it } from "vitest";

import type { Goal, Habit, LogEntry, Todo } from "./types";
import { buildAnalyticsSnapshot } from "./analytics";

const goalBase = {
  description: undefined,
  baseline_value: undefined,
  current_value_cache: undefined,
  is_active: true,
  created_at: "",
  updated_at: "",
};

describe("buildAnalyticsSnapshot", () => {
  it("computes high-level metrics and daily series", () => {
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
      {
        ...goalBase,
        id: "g2",
        title: "Spend",
        goal_type: "limit",
        unit: "USD",
        target_value: 200,
        start_date: "2026-04-14",
        end_date: "2026-04-20",
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
    ];

    const todos: Todo[] = [
      {
        id: "t1",
        title: "Done todo",
        start_datetime: "2026-04-15T10:00:00",
        end_datetime: "2026-04-15T10:30:00",
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
        start_datetime: "2026-04-16T10:00:00",
        end_datetime: "2026-04-16T10:30:00",
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
        entry_date: "2026-04-15",
        entry_datetime: "2026-04-15T12:00:00",
        source_type: "habit",
        source_id: "h1",
        numeric_value: 20,
        unit: "pages",
        goal_ids: [],
        created_at: "",
        updated_at: "",
      },
      {
        id: "l2",
        entry_date: "2026-04-16",
        entry_datetime: "2026-04-16T12:00:00",
        source_type: "habit",
        source_id: "h1",
        numeric_value: 50,
        unit: "USD",
        goal_ids: [],
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
      asOf: "2026-04-20",
    });

    expect(snapshot.totals.totalGoals).toBe(2);
    expect(snapshot.totals.totalHabits).toBe(1);
    expect(snapshot.totals.todoCompletionRate).toBe(50);
    expect(snapshot.totals.logsInWindow).toBe(2);
    expect(snapshot.totals.onTrackGoals).toBe(2);
    expect(snapshot.dailyLogSeries).toHaveLength(7);
    expect(snapshot.dailyLogSeries.find((d) => d.date === "2026-04-15")?.total).toBe(20);
    expect(snapshot.dailyLogSeries.find((d) => d.date === "2026-04-16")?.entries).toBe(1);
  });
});
