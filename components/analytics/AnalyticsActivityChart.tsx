"use client";

import { format, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
} from "recharts";

import { SafeResponsiveContainer } from "@/components/charts/SafeResponsiveContainer";

interface DailyLogPoint {
  date: string;
  total: number;
}

interface AnalyticsActivityChartProps {
  data: DailyLogPoint[];
}

export function AnalyticsActivityChart({ data }: AnalyticsActivityChartProps) {
  return (
    <SafeResponsiveContainer minHeight={256}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="seriesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent-ember)" stopOpacity={0.22} />
            <stop offset="95%" stopColor="var(--accent-ember)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" />
        <XAxis
          dataKey="date"
          tickFormatter={(value: string) => format(parseISO(value), "MMM d")}
          tick={{ fill: "var(--ink-subtle)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--surface-elevated)",
            border: "1px solid var(--hairline)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--ink)",
          }}
          labelFormatter={(label) =>
            typeof label === "string"
              ? format(parseISO(label), "MMM d, yyyy")
              : String(label ?? "")
          }
          formatter={(value, name) => [
            typeof value === "number" ? value.toLocaleString() : String(value ?? ""),
            name === "total" ? "Total" : "Entries",
          ]}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--accent-ember)"
          fill="url(#seriesFill)"
          strokeWidth={1.75}
        />
      </AreaChart>
    </SafeResponsiveContainer>
  );
}
