import { ArrowRight } from "lucide-react";

import type { AnalyticsSummaryModel } from "@/lib/analytics/types";

interface WeeklyReviewInsightsCardProps {
  summary: AnalyticsSummaryModel;
}

export function WeeklyReviewInsightsCard({ summary }: WeeklyReviewInsightsCardProps) {
  const insight = summary.reviewInsight;

  return (
    <section className="surface-card p-4" aria-label="Weekly review insights">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-eyebrow">Weekly review</p>
        {insight.isPromptRecommended && (
          <span className="flex items-center gap-1 text-[12px] font-medium text-ember">
            This week is ready
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-hairline bg-background p-3">
          <p className="text-[12px] text-ink-muted">Latest score</p>
          <p className="text-display-sm mt-1 text-[24px] text-ink">
            {insight.latestScore ?? "–"}
          </p>
          <p className="mt-1 text-[11px] text-ink-subtle">
            {insight.latestWeekStart ? `Week of ${insight.latestWeekStart}` : "No reviews yet"}
          </p>
        </div>

        <div className="rounded-lg border border-hairline bg-background p-3">
          <p className="text-[12px] text-ink-muted">Recent scores</p>
          <p className="mt-2 text-[13px] text-ink">
            {insight.recentScores.length > 0 ? insight.recentScores.join(" · ") : "No trend yet"}
          </p>
          <p className="mt-1 text-[11px] text-ink-subtle">
            {insight.totalReviews} total review{insight.totalReviews === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </section>
  );
}
