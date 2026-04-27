import { HabitCompletionTrendChart } from "@/components/analytics/progress/HabitCompletionTrendChart";
import { HabitNumericTrendChart } from "@/components/analytics/progress/HabitNumericTrendChart";
import type { HabitProgressModel } from "@/lib/analytics/types";

interface HabitProgressCardProps {
  row: HabitProgressModel;
}

export function HabitProgressCard({ row }: HabitProgressCardProps) {
  return (
    <article className="surface-card p-4" aria-label={`Habit progress ${row.habit.title}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[14px] font-medium text-ink">{row.habit.title}</p>
          <p className="text-[12px] text-ink-subtle">
            Completion {row.completionRate}% · Streak {row.streakCurrent}/{row.streakBest}
          </p>
        </div>
        <p className={`text-[12px] ${row.hasProgress ? "text-ember" : "text-ink-subtle"}`}>
          {row.hasProgress ? "Progress detected" : "No progress in range"}
        </p>
      </div>

      <HabitCompletionTrendChart data={row.completionTrend} />

      {row.numericSeries && (
        <div className="mt-3 border-t border-hairline pt-3">
          <p className="mb-2 text-[11px] text-ink-muted">Numeric trend ({row.numericSeries.unit})</p>
          <HabitNumericTrendChart series={row.numericSeries} />
        </div>
      )}
    </article>
  );
}
