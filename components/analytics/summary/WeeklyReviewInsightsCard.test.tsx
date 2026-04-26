import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { WeeklyReviewInsightsCard } from "@/components/analytics/summary/WeeklyReviewInsightsCard";
import type { AnalyticsSummaryModel } from "@/lib/analytics/types";

const summary: AnalyticsSummaryModel = {
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
    isPromptRecommended: true,
    latestScore: 8,
    recentScores: [7, 8],
    totalReviews: 2,
    latestWeekStart: "2026-04-20",
    reviews: [],
  },
  comparison: null,
  goalProgress: [],
};

describe("WeeklyReviewInsightsCard", () => {
  it("renders the ready-state prompt above the history blocks without alert styling", () => {
    const html = renderToStaticMarkup(<WeeklyReviewInsightsCard summary={summary} />);

    expect(html.indexOf("Weekly review is ready for this week.")).toBeLessThan(
      html.indexOf("Latest score"),
    );
    expect(html).toContain("text-ember");
    expect(html).not.toContain("border-ember");
  });
});
