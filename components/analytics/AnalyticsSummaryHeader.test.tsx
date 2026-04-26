import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AnalyticsSummaryHeader } from "@/components/analytics/AnalyticsSummaryHeader";
import type { AnalyticsSummaryModel } from "@/lib/analytics/types";

const baseSummary: AnalyticsSummaryModel = {
  range: { startDate: "2026-04-01", endDate: "2026-05-30" },
  granularity: "weekly",
  balancedScore: 15,
  habitConsistencyScore: 1,
  goalPaceScore: 33,
  executionVolumeScore: 5,
  kpis: {
    totalGoals: 3,
    totalHabits: 4,
    totalTodos: 0,
    onTrackGoals: 1,
    todoCompletionRate: 0,
    logsInRange: 4,
    loggingConsistencyRate: 7,
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
};

const controls = {
  controls: {
    startDate: "2026-04-01",
    endDate: "2026-05-30",
    granularity: "weekly" as const,
    comparisonEnabled: false,
    presetKey: "2m" as const,
  },
  presets: ["1m", "2m", "3m", "6m", "1y", "2y"] as const,
  onPresetChange: () => {},
  onRangeChange: () => {},
  onGranularityChange: () => {},
  onComparisonToggle: () => {},
  onRefresh: () => {},
  refreshing: false,
};

describe("AnalyticsSummaryHeader", () => {
  it("renders controls before the metric row and uses static subordinate copy by default", () => {
    const html = renderToStaticMarkup(
      <AnalyticsSummaryHeader summary={baseSummary} controls={controls} />,
    );

    expect(html.indexOf("Analytics controls")).toBeLessThan(html.indexOf("Balanced score"));
    expect(html).toContain("out of 100");
    expect((html.match(/this period/g) ?? [])).toHaveLength(3);
    expect(html).toContain("sm:grid-cols-2");
    expect(html).toContain("xl:grid-cols-4");
  });

  it("renders comparison deltas and balanced-score progress semantics when comparison is active", () => {
    const html = renderToStaticMarkup(
      <AnalyticsSummaryHeader
        summary={{
          ...baseSummary,
          comparison: {
            previousRange: { startDate: "2026-01-31", endDate: "2026-03-31" },
            deltaBalancedScore: 12,
            deltaHabitConsistencyScore: -4,
            deltaGoalPaceScore: 7,
            deltaExecutionVolumeScore: -2,
            deltaTodoCompletionRate: 0,
            deltaLogsInRange: 0,
          },
        }}
        controls={{
          ...controls,
          controls: {
            ...controls.controls,
            comparisonEnabled: true,
          },
        }}
      />,
    );

    expect(html).toContain("+12 vs previous period");
    expect(html).toContain("-4 vs previous period");
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="15"');
  });
});
