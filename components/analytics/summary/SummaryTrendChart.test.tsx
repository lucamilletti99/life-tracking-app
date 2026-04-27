import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("recharts", () => ({
  Area: () => <div data-chart="area" />,
  AreaChart: ({ children }: { children: unknown }) => <div>{children}</div>,
  CartesianGrid: () => <div data-chart="grid" />,
  Legend: () => <div data-chart="legend" />,
  Tooltip: () => <div data-chart="tooltip" />,
  XAxis: () => <div data-chart="x-axis" />,
  YAxis: () => <div data-chart="y-axis" />,
  ResponsiveContainer: ({ children }: { children: unknown }) => <div>{children}</div>,
}));

import { SummaryTrendChart } from "@/components/analytics/summary/SummaryTrendChart";
import type { AnalyticsSummaryModel } from "@/lib/analytics/types";

const summary: AnalyticsSummaryModel = {
  range: { startDate: "2026-04-01", endDate: "2026-05-30" },
  granularity: "weekly",
  balancedScore: 72,
  habitConsistencyScore: 75,
  goalPaceScore: 68,
  executionVolumeScore: 70,
  kpis: {
    totalGoals: 2,
    totalHabits: 3,
    totalTodos: 4,
    onTrackGoals: 1,
    todoCompletionRate: 50,
    logsInRange: 12,
    loggingConsistencyRate: 42,
  },
  trendSeries: [
    {
      bucketStart: "2026-04-01",
      bucketEnd: "2026-04-07",
      logEntries: 5,
      numericTotal: 10,
      habitCompletions: 4,
      todoCompleted: 2,
    },
  ],
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

describe("SummaryTrendChart", () => {
  it("renders trend section shell", () => {
    const html = renderToStaticMarkup(<SummaryTrendChart summary={summary} />);

    expect(html).toContain('aria-label="Summary trend chart"');
    expect(html).toContain("Trend");
    expect(html).toContain("weekly");
  });
});
