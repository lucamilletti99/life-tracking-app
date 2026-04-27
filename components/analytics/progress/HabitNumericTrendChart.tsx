"use client";

import { format, parseISO } from "date-fns";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

import { SafeResponsiveContainer } from "@/components/charts/SafeResponsiveContainer";
import type { HabitNumericSeries } from "@/lib/analytics/types";

interface HabitNumericTrendChartProps {
  series: HabitNumericSeries;
}

export function HabitNumericTrendChart({ series }: HabitNumericTrendChartProps) {
  return (
    <div className="h-44 w-full">
      <SafeResponsiveContainer minHeight={176}>
        <LineChart data={series.points} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" />
          <XAxis
            dataKey="bucketStart"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--ink-subtle)", fontSize: 10 }}
            tickFormatter={(value: string) => format(parseISO(value), "MMM d")}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--ink-subtle)", fontSize: 10 }} />
          <Tooltip
            labelFormatter={(value) =>
              typeof value === "string" ? format(parseISO(value), "MMM d, yyyy") : String(value)
            }
            formatter={(value) => [
              value == null ? "-" : `${Number(value).toLocaleString()} ${series.unit}`,
              "Value",
            ]}
            contentStyle={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--hairline)",
              borderRadius: 8,
              color: "var(--ink)",
              fontSize: 12,
            }}
          />
          <Line type="monotone" dataKey="value" stroke="var(--chart-2)" strokeWidth={1.8} dot={false} connectNulls />
        </LineChart>
      </SafeResponsiveContainer>
    </div>
  );
}
