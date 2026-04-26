import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/analytics/AnalyticsStateProvider", () => ({
  useAnalyticsState: () => ({
    controls: {
      controls: {
        startDate: "2026-04-01",
        endDate: "2026-05-30",
        granularity: "weekly",
        comparisonEnabled: false,
        presetKey: "2m",
      },
      presets: ["1m", "2m", "3m", "6m", "1y", "2y"],
      setPreset: () => {},
      setCustomRange: () => {},
      setGranularity: () => {},
      setComparisonEnabled: () => {},
      reset: () => {},
    },
    dataset: {
      goals: [],
      habits: [],
      todos: [],
      logs: [],
      habitGoalLinks: [],
      todoGoalLinks: [],
      weeklyReviews: [],
      loading: false,
      refreshing: false,
      error: null,
      refresh: () => {},
    },
  }),
}));

vi.mock("@/lib/analytics/summary", () => ({
  buildAnalyticsSummaryModel: () => ({
    range: { startDate: "2026-04-01", endDate: "2026-05-30" },
    granularity: "weekly",
    balancedScore: 15,
    habitConsistencyScore: 1,
    goalPaceScore: 33,
    executionVolumeScore: 5,
    kpis: {
      totalGoals: 0,
      totalHabits: 0,
      totalTodos: 0,
      onTrackGoals: 0,
      todoCompletionRate: 0,
      logsInRange: 0,
      loggingConsistencyRate: 0,
    },
    trendSeries: [],
    reviewInsight: {
      isPromptRecommended: false,
      latestScore: null,
      recentScores: [],
      totalReviews: 0,
      latestWeekStart: null,
      reviews: [],
    },
    comparison: null,
    goalProgress: [],
  }),
}));

vi.mock("@/components/analytics/AnalyticsSummaryHeader", () => ({
  AnalyticsSummaryHeader: () => <section>Header marker</section>,
}));

vi.mock("@/components/analytics/summary/SummaryTrendChart", () => ({
  SummaryTrendChart: () => <section>Trend marker</section>,
}));

vi.mock("@/components/analytics/summary/WeeklyReviewInsightsCard", () => ({
  WeeklyReviewInsightsCard: () => <section>Weekly review marker</section>,
}));

vi.mock("@/components/analytics/summary/DeepDiveEntryCard", () => ({
  DeepDiveEntryCard: ({ title }: { title: string }) => <a>{title}</a>,
}));

import AnalyticsPage from "./page";

describe("AnalyticsPage", () => {
  it("removes redundant sections and keeps trend content above the lower cards", () => {
    const html = renderToStaticMarkup(<AnalyticsPage />);

    expect(html).not.toContain("KPIs");
    expect(html).not.toContain("Score breakdown");
    expect(html.indexOf("Trend marker")).toBeLessThan(html.indexOf("Weekly review marker"));
    expect(html.indexOf("Trend marker")).toBeLessThan(html.indexOf("Progress deep-dive"));
    expect(html).toContain("Jump to goals");
  });
});
