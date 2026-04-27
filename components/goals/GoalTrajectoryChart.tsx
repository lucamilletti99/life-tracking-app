"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
} from "recharts";

import { SafeResponsiveContainer } from "@/components/charts/SafeResponsiveContainer";
import type { GoalTrajectory } from "@/lib/goal-calculations";

interface GoalTrajectoryChartProps {
  trajectory: GoalTrajectory;
}

function getTokenColor(variable: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return value || fallback;
}

export function GoalTrajectoryChart({ trajectory }: GoalTrajectoryChartProps) {
  // Pull live token values so the chart respects the active theme.
  const [colors, setColors] = useState({
    ink: "#2a2620",
    subtle: "#a6a09a",
    grid: "#e8e3dc",
  });

  useEffect(() => {
    function sync() {
      setColors({
        ink: getTokenColor("--ink", "#2a2620"),
        subtle: getTokenColor("--ink-subtle", "#a6a09a"),
        grid: getTokenColor("--hairline", "#e8e3dc"),
      });
    }
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="rounded-xl border border-hairline bg-surface p-5">
      <p className="text-eyebrow">Trajectory</p>
      <div className="mt-3 h-56 w-full">
        <SafeResponsiveContainer minHeight={224}>
          <LineChart data={trajectory.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => format(parseISO(value), "MMM d")}
              tick={{ fill: colors.subtle, fontSize: 11 }}
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
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke={colors.ink}
              strokeWidth={1.75}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="expected"
              stroke={colors.subtle}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </SafeResponsiveContainer>
      </div>
    </div>
  );
}
