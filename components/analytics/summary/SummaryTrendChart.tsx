"use client";

import { format, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SafeResponsiveContainer } from "@/components/charts/SafeResponsiveContainer";
import type { AnalyticsSummaryModel } from "@/lib/analytics/types";

interface SummaryTrendChartProps {
  summary: AnalyticsSummaryModel;
}

export function SummaryTrendChart({ summary }: SummaryTrendChartProps) {
  return (
    <section className="surface-card p-5" aria-label="Summary trend chart">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-eyebrow">Trend</p>
        <p className="text-[12px] text-ink-subtle">{summary.granularity}</p>
      </div>

      <div className="h-52 w-full md:h-60">
        <SafeResponsiveContainer minHeight={200}>
          <AreaChart data={summary.trendSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="logsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-ember)" stopOpacity={0.24} />
                <stop offset="95%" stopColor="var(--accent-ember)" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" />
            <XAxis
              dataKey="bucketStart"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--ink-subtle)", fontSize: 11 }}
              tickFormatter={(value: string) => format(parseISO(value), "MMM d")}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--ink-subtle)", fontSize: 11 }}
            />
            <Tooltip
              labelFormatter={(value) =>
                typeof value === "string" ? format(parseISO(value), "MMM d, yyyy") : String(value)
              }
              contentStyle={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--hairline)",
                borderRadius: 8,
                color: "var(--ink)",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="logEntries"
              name="Logs"
              stroke="var(--accent-ember)"
              fill="url(#logsFill)"
              strokeWidth={1.8}
            />
            <Area
              type="monotone"
              dataKey="habitCompletions"
              name="Habit completions"
              stroke="var(--chart-2)"
              fill="transparent"
              strokeWidth={1.8}
            />
          </AreaChart>
        </SafeResponsiveContainer>
      </div>
    </section>
  );
}
