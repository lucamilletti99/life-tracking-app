import { format, parseISO } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import type { GoalTrajectory } from "@/lib/goal-calculations";

interface GoalTrajectoryChartProps {
  trajectory: GoalTrajectory;
}

export function GoalTrajectoryChart({ trajectory }: GoalTrajectoryChartProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-neutral-900">Trajectory</h2>
      <div className="mt-3 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trajectory.series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => format(parseISO(value), "MMM d")}
              tick={{ fill: "#737373", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              labelFormatter={(label) =>
                typeof label === "string"
                  ? format(parseISO(label), "MMM d, yyyy")
                  : String(label ?? "")
              }
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#111827"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="expected"
              stroke="#9ca3af"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
