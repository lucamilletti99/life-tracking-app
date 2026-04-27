import type { AnalyticsSummaryModel } from "@/lib/analytics/types";

interface ScoreBreakdownCardProps {
  summary: AnalyticsSummaryModel;
}

export function ScoreBreakdownCard({ summary }: ScoreBreakdownCardProps) {
  return (
    <section className="surface-card p-5" aria-label="Score breakdown">
      <p className="text-eyebrow mb-4">Score breakdown</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-hairline bg-background p-3">
          <p className="text-[12px] text-ink-muted">Habit consistency</p>
          <p className="text-display-sm mt-1 text-[22px] text-ink">{summary.habitConsistencyScore}%</p>
        </div>
        <div className="rounded-lg border border-hairline bg-background p-3">
          <p className="text-[12px] text-ink-muted">Goal pace</p>
          <p className="text-display-sm mt-1 text-[22px] text-ink">{summary.goalPaceScore}%</p>
        </div>
        <div className="rounded-lg border border-hairline bg-background p-3">
          <p className="text-[12px] text-ink-muted">Execution volume</p>
          <p className="text-display-sm mt-1 text-[22px] text-ink">{summary.executionVolumeScore}%</p>
        </div>
      </div>
    </section>
  );
}
