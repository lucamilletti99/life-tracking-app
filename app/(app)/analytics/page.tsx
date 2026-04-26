"use client";

import { useMemo } from "react";

import { AnalyticsSummaryHeader } from "@/components/analytics/AnalyticsSummaryHeader";
import { useAnalyticsState } from "@/components/analytics/AnalyticsStateProvider";
import { DeepDiveEntryCard } from "@/components/analytics/summary/DeepDiveEntryCard";
import { SummaryTrendChart } from "@/components/analytics/summary/SummaryTrendChart";
import { WeeklyReviewInsightsCard } from "@/components/analytics/summary/WeeklyReviewInsightsCard";
import { buildAnalyticsSummaryModel } from "@/lib/analytics/summary";

export default function AnalyticsPage() {
  const { controls, dataset } = useAnalyticsState();

  const summary = useMemo(
    () =>
      buildAnalyticsSummaryModel({
        goals: dataset.goals,
        habits: dataset.habits,
        todos: dataset.todos,
        logs: dataset.logs,
        habitGoalLinks: dataset.habitGoalLinks,
        todoGoalLinks: dataset.todoGoalLinks,
        weeklyReviews: dataset.weeklyReviews,
        range: {
          startDate: controls.controls.startDate,
          endDate: controls.controls.endDate,
        },
        granularity: controls.controls.granularity,
        comparisonEnabled: controls.controls.comparisonEnabled,
      }),
    [
      controls.controls.comparisonEnabled,
      controls.controls.endDate,
      controls.controls.granularity,
      controls.controls.startDate,
      dataset.goals,
      dataset.habits,
      dataset.habitGoalLinks,
      dataset.logs,
      dataset.todoGoalLinks,
      dataset.todos,
      dataset.weeklyReviews,
    ],
  );

  if (dataset.loading) {
    return (
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <>
      <AnalyticsSummaryHeader
        summary={summary}
        controls={{
          controls: controls.controls,
          presets: controls.presets,
          onPresetChange: controls.setPreset,
          onRangeChange: controls.setCustomRange,
          onGranularityChange: controls.setGranularity,
          onComparisonToggle: controls.setComparisonEnabled,
          onRefresh: dataset.refresh,
          refreshing: dataset.refreshing,
        }}
      />

      <div className="scroll-seamless flex-1">
        <div className="mx-auto max-w-6xl space-y-5 px-8 py-6 pb-16">
          {dataset.error && (
            <section className="surface-card border-destructive p-4 text-[13px] text-destructive">
              Failed to load analytics data. Use refresh to retry.
            </section>
          )}

          <SummaryTrendChart summary={summary} />
          <WeeklyReviewInsightsCard summary={summary} />

          <section className="grid grid-cols-1 gap-3 md:grid-cols-2" aria-label="Deep dive links">
            <DeepDiveEntryCard
              title="Progress deep-dive"
              description="Open all habit and goal charts in one combined analytics page."
              href="/analytics/progress"
            />
            <DeepDiveEntryCard
              title="Jump to goals"
              description="Open trajectory cards and pace ranking directly."
              href="/analytics/progress#goals"
            />
          </section>
        </div>
      </div>
    </>
  );
}
