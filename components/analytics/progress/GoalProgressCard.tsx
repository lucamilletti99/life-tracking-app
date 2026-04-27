import { GoalTrajectoryChart } from "@/components/goals/GoalTrajectoryChart";
import type { GoalProgressModel } from "@/lib/analytics/types";

interface GoalProgressCardProps {
  row: GoalProgressModel;
}

export function GoalProgressCard({ row }: GoalProgressCardProps) {
  return (
    <article className="surface-card p-4" aria-label={`Goal progress ${row.goal.title}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[14px] font-medium text-ink">{row.goal.title}</p>
          <p className="text-[12px] text-ink-subtle">
            {row.completionPercent}% complete · pace {row.paceLabel.replace("_", " ")}
          </p>
        </div>
        <p className={`text-[12px] ${row.paceLabel === "behind" ? "text-destructive" : "text-ember"}`}>
          {row.paceLabel === "ahead" ? "Ahead" : row.paceLabel === "on_track" ? "On track" : "Behind"}
        </p>
      </div>

      <GoalTrajectoryChart trajectory={row.trajectory} />
    </article>
  );
}
