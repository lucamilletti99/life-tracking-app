import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("recharts", () => ({
  CartesianGrid: () => <div data-chart="grid" />,
  Line: () => <div data-chart="line" />,
  LineChart: ({ children }: { children: unknown }) => <div>{children}</div>,
  Tooltip: () => <div data-chart="tooltip" />,
  XAxis: () => <div data-chart="x-axis" />,
  YAxis: () => <div data-chart="y-axis" />,
  ResponsiveContainer: ({ children }: { children: unknown }) => <div>{children}</div>,
}));

import { GoalProgressCard } from "@/components/analytics/progress/GoalProgressCard";
import type { GoalProgressModel } from "@/lib/analytics/types";

const row: GoalProgressModel = {
  goal: {
    id: "goal-1",
    title: "Read 500 pages",
    goal_type: "accumulation",
    unit: "pages",
    target_value: 500,
    start_date: "2026-04-01",
    end_date: "2026-06-30",
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  completionPercent: 52,
  paceLabel: "on_track",
  trajectory: {
    current: 260,
    expectedByNow: 240,
    projectedEndValue: 540,
    projectedCompletionDate: "2026-06-24",
    paceLabel: "on_track",
    series: [
      { date: "2026-04-01", actual: 10, expected: 8 },
      { date: "2026-04-02", actual: 20, expected: 16 },
    ],
  },
};

describe("GoalProgressCard", () => {
  it("renders goal title and pace status", () => {
    const html = renderToStaticMarkup(<GoalProgressCard row={row} />);

    expect(html).toContain("Read 500 pages");
    expect(html).toContain("52% complete");
    expect(html).toContain("On track");
  });
});
