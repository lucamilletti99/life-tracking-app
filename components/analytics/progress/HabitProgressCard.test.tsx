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

import { HabitProgressCard } from "@/components/analytics/progress/HabitProgressCard";
import type { HabitProgressModel } from "@/lib/analytics/types";

const row: HabitProgressModel = {
  habit: {
    id: "habit-1",
    title: "Read",
    tracking_type: "numeric",
    recurrence_type: "daily",
    recurrence_config: {},
    auto_create_calendar_instances: true,
    is_active: true,
    created_at: "",
    updated_at: "",
    unit: "pages",
  },
  completionRate: 80,
  streakCurrent: 5,
  streakBest: 12,
  hasProgress: true,
  completionTrend: [
    {
      bucketStart: "2026-04-01",
      bucketEnd: "2026-04-01",
      completed: 1,
      expected: 1,
      rate: 100,
    },
  ],
  numericSeries: {
    unit: "pages",
    points: [
      {
        bucketStart: "2026-04-01",
        bucketEnd: "2026-04-01",
        value: 22,
      },
    ],
  },
};

describe("HabitProgressCard", () => {
  it("renders habit metrics and numeric trend label", () => {
    const html = renderToStaticMarkup(<HabitProgressCard row={row} />);

    expect(html).toContain("Read");
    expect(html).toContain("Completion 80%");
    expect(html).toContain("Progress detected");
    expect(html).toContain("Numeric trend (pages)");
  });
});
