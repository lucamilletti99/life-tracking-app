"use client";

import { format, parseISO } from "date-fns";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

import { SafeResponsiveContainer } from "@/components/charts/SafeResponsiveContainer";
import type { HabitCompletionTrendPoint } from "@/lib/analytics/types";

interface HabitCompletionTrendChartProps {
  data: HabitCompletionTrendPoint[];
}

export function HabitCompletionTrendChart({ data }: HabitCompletionTrendChartProps) {
  return (
    <div className="h-44 w-full">
      <SafeResponsiveContainer minHeight={176}>
        <LineChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
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
            formatter={(value, key) => [`${value}`, key === "rate" ? "Completion %" : String(key)]}
            contentStyle={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--hairline)",
              borderRadius: 8,
              color: "var(--ink)",
              fontSize: 12,
            }}
          />
          <Line type="monotone" dataKey="rate" stroke="var(--accent-ember)" strokeWidth={1.8} dot={false} />
        </LineChart>
      </SafeResponsiveContainer>
    </div>
  );
}
