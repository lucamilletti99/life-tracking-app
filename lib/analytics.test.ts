import { describe, expect, it } from "vitest";

import { toLegacyHabitStats } from "./analytics";
import { buildAnalyticsProgressModel } from "./analytics/progress";
import { buildAnalyticsSummaryModel, computeBalancedScore } from "./analytics/summary";
import {
  bucketStartIso,
  clampAnalyticsRange,
  toPreviousComparisonRange,
} from "./analytics/timeframe";
import type {
  Goal,
  Habit,
  HabitGoalLink,
  LogEntry,
  Todo,
  TodoGoalLink,
  WeeklyReview,
} from "./types";

const goalBase = {
  description: undefined,
  baseline_value: undefined,
  current_value_cache: undefined,
  is_active: true,
  created_at: "",
  updated_at: "",
} satisfies Omit<Goal, "id" | "title" | "goal_type" | "unit" | "target_value" | "start_date" | "end_date">;

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "habit-1",
    title: "Habit",
    tracking_type: "boolean",
    recurrence_type: "daily",
    recurrence_config: {},
    auto_create_calendar_instances: true,
    is_active: true,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function log(
  date: string,
  overrides: Partial<LogEntry> = {},
): LogEntry {
  return {
    id: `log-${date}-${Math.random()}`,
    entry_date: date,
    entry_datetime: `${date}T08:00:00Z`,
    source_type: "habit",
    source_id: "habit-1",
    numeric_value: 1,
    unit: "count",
    goal_ids: [],
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("analytics timeframe", () => {
  it("clamps selected range to 30-730 days", () => {
    const shortRange = clampAnalyticsRange({
      startDate: "2026-04-10",
      endDate: "2026-04-15",
    });
    expect(shortRange.days).toBe(30);
    expect(shortRange.endDate).toBe("2026-04-15");

    const longRange = clampAnalyticsRange({
      startDate: "2021-01-01",
      endDate: "2026-04-15",
    });
    expect(longRange.days).toBe(730);
    expect(longRange.endDate).toBe("2026-04-15");
  });

  it("maps dates to expected daily/weekly/monthly bucket starts", () => {
    expect(bucketStartIso("2026-04-23", "daily")).toBe("2026-04-23");
    expect(bucketStartIso("2026-04-23", "weekly")).toBe("2026-04-20"); // Monday
    expect(bucketStartIso("2026-04-23", "monthly")).toBe("2026-04-01");
  });

  it("creates equal-length previous comparison windows", () => {
    const comparison = toPreviousComparisonRange({
      startDate: "2026-04-01",
      endDate: "2026-05-30",
    });

    expect(comparison.startDate).toBe("2026-01-31");
    expect(comparison.endDate).toBe("2026-03-31");
  });
});

describe("analytics summary", () => {
  it("computes the balanced score with locked 40/40/20 weighting", () => {
    expect(computeBalancedScore({
      habitConsistencyScore: 90,
      goalPaceScore: 70,
      executionVolumeScore: 50,
    })).toBe(74);
  });

  it("builds summary metrics with todo-inclusive KPIs and weekly review insight", () => {
    const goals: Goal[] = [
      {
        ...goalBase,
        id: "goal-1",
        title: "Read 120 pages",
        goal_type: "accumulation",
        unit: "pages",
        target_value: 120,
        start_date: "2026-04-01",
        end_date: "2026-06-30",
      },
    ];

    const habits: Habit[] = [
      habit({ id: "habit-1", title: "Read", tracking_type: "numeric", unit: "pages" }),
      habit({ id: "habit-2", title: "Meditate", tracking_type: "boolean" }),
    ];

    const habitGoalLinks: HabitGoalLink[] = [
      {
        id: "link-1",
        habit_id: "habit-1",
        goal_id: "goal-1",
        created_at: "",
      },
    ];

    const todos: Todo[] = [
      {
        id: "todo-1",
        title: "Complete reading task",
        start_datetime: "2026-04-10T10:00:00Z",
        end_datetime: "2026-04-10T10:30:00Z",
        all_day: false,
        status: "complete",
        source_type: "manual",
        requires_numeric_log: false,
        created_at: "",
        updated_at: "",
      },
      {
        id: "todo-2",
        title: "Pending task",
        start_datetime: "2026-04-11T10:00:00Z",
        end_datetime: "2026-04-11T10:30:00Z",
        all_day: false,
        status: "pending",
        source_type: "manual",
        requires_numeric_log: false,
        created_at: "",
        updated_at: "",
      },
    ];

    const logs: LogEntry[] = [
      log("2026-04-10", { source_id: "habit-1", numeric_value: 20, unit: "pages" }),
      log("2026-04-11", { source_id: "habit-1", numeric_value: 25, unit: "pages" }),
      log("2026-04-11", { id: "habit-2-log", source_id: "habit-2", numeric_value: 1, unit: "count" }),
    ];

    const reviews: WeeklyReview[] = [
      {
        id: "review-1",
        week_start: "2026-04-06",
        overall_score: 7,
        created_at: "",
      },
      {
        id: "review-2",
        week_start: "2026-04-13",
        overall_score: 8,
        created_at: "",
      },
    ];

    const summary = buildAnalyticsSummaryModel({
      goals,
      habits,
      todos,
      logs,
      habitGoalLinks,
      todoGoalLinks: [] satisfies TodoGoalLink[],
      weeklyReviews: reviews,
      range: {
        startDate: "2026-04-01",
        endDate: "2026-04-30",
      },
      granularity: "weekly",
      comparisonEnabled: true,
    });

    expect(summary.kpis.totalTodos).toBe(2);
    expect(summary.kpis.todoCompletionRate).toBe(50);
    expect(summary.reviewInsight.latestScore).toBe(8);
    expect(summary.reviewInsight.recentScores).toEqual([7, 8]);
    expect(summary.balancedScore).toBeGreaterThanOrEqual(0);
    expect(summary.balancedScore).toBeLessThanOrEqual(100);
    expect(summary.trendSeries.length).toBeGreaterThan(0);
    expect(summary.comparison).not.toBeNull();
  });
});

describe("analytics progress model", () => {
  it("returns visual payload for every habit even with zero logs", () => {
    const model = buildAnalyticsProgressModel({
      goals: [],
      habits: [
        habit({ id: "habit-a", title: "Journal", tracking_type: "boolean" }),
        habit({ id: "habit-b", title: "Weight", tracking_type: "numeric", unit: "lbs" }),
      ],
      logs: [],
      habitGoalLinks: [],
      range: {
        startDate: "2026-04-01",
        endDate: "2026-05-30",
      },
      granularity: "weekly",
    });

    expect(model.habits).toHaveLength(2);
    expect(model.habits.every((row) => row.completionTrend.length > 0)).toBe(true);
    expect(model.habits.every((row) => row.hasProgress === false)).toBe(true);
  });

  it("keeps numeric series isolated by habit and unit", () => {
    const model = buildAnalyticsProgressModel({
      goals: [],
      habits: [
        habit({ id: "h-lbs", title: "Weight", tracking_type: "numeric", unit: "lbs" }),
        habit({ id: "h-min", title: "Run", tracking_type: "duration", unit: "minutes" }),
      ],
      logs: [
        log("2026-04-02", { source_id: "h-lbs", numeric_value: 178.2, unit: "lbs" }),
        log("2026-04-03", { source_id: "h-min", numeric_value: 30, unit: "minutes" }),
      ],
      habitGoalLinks: [],
      range: {
        startDate: "2026-04-01",
        endDate: "2026-05-30",
      },
      granularity: "weekly",
    });

    const lbs = model.habits.find((row) => row.habit.id === "h-lbs");
    const min = model.habits.find((row) => row.habit.id === "h-min");

    expect(lbs?.numericSeries?.unit).toBe("lbs");
    expect(min?.numericSeries?.unit).toBe("minutes");
  });

  it("derives distinct 7d/30d/90d completion rates", () => {
    const model = buildAnalyticsProgressModel({
      goals: [],
      habits: [habit({ id: "habit-1", title: "Read", recurrence_type: "daily", recurrence_config: {} })],
      logs: [
        log("2026-04-20", { source_id: "habit-1" }),
        log("2026-04-24", { source_id: "habit-1" }),
        log("2026-04-26", { source_id: "habit-1" }),
      ],
      habitGoalLinks: [],
      range: {
        startDate: "2026-01-27",
        endDate: "2026-04-26",
      },
      granularity: "weekly",
    });

    const stats = toLegacyHabitStats(model, {
      logs: [
        log("2026-04-20", { source_id: "habit-1" }),
        log("2026-04-24", { source_id: "habit-1" }),
        log("2026-04-26", { source_id: "habit-1" }),
      ],
      today: "2026-04-26",
    });

    expect(stats[0]).toMatchObject({
      completionRate7d: 43,
      completionRate30d: 10,
      completionRate90d: 3,
    });
  });
});
