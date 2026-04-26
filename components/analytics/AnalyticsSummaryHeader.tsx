"use client";

import type { ComponentProps } from "react";

import { AnalyticsControls } from "@/components/analytics/AnalyticsControls";
import {
  SummaryMetricCard,
  formatScoreDelta,
} from "@/components/analytics/summary/SummaryMetricCard";
import { TopBar } from "@/components/layout/TopBar";
import type { AnalyticsSummaryModel } from "@/lib/analytics/types";

interface AnalyticsSummaryHeaderProps {
  summary: AnalyticsSummaryModel;
  controls: ComponentProps<typeof AnalyticsControls>;
}

export function AnalyticsSummaryHeader({ summary, controls }: AnalyticsSummaryHeaderProps) {
  const comparison = summary.comparison;

  return (
    <>
      <TopBar
        eyebrow="Signal"
        title="Analytics"
        subtitle="A clearer view of consistency, pace, and execution volume."
      />
      <div className="px-8 pt-6">
        <AnalyticsControls {...controls} />

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryMetricCard
            label="Balanced score"
            value={`${summary.balancedScore}`}
            subline={comparison ? formatScoreDelta(comparison.deltaBalancedScore) : "out of 100"}
            emphasized
            progressValue={summary.balancedScore}
          />
          <SummaryMetricCard
            label="Habit consistency"
            value={`${summary.habitConsistencyScore}%`}
            subline={
              comparison ? formatScoreDelta(comparison.deltaHabitConsistencyScore) : "this period"
            }
          />
          <SummaryMetricCard
            label="Goal pace"
            value={`${summary.goalPaceScore}%`}
            subline={comparison ? formatScoreDelta(comparison.deltaGoalPaceScore) : "this period"}
          />
          <SummaryMetricCard
            label="Execution volume"
            value={`${summary.executionVolumeScore}%`}
            subline={
              comparison ? formatScoreDelta(comparison.deltaExecutionVolumeScore) : "this period"
            }
          />
        </div>
      </div>
    </>
  );
}
