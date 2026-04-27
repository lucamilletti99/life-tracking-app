"use client";

import Link from "next/link";
import { useMemo } from "react";

import { AnalyticsControls } from "@/components/analytics/AnalyticsControls";
import { useAnalyticsState } from "@/components/analytics/AnalyticsStateProvider";
import { GoalProgressCard } from "@/components/analytics/progress/GoalProgressCard";
import { HabitProgressCard } from "@/components/analytics/progress/HabitProgressCard";
import { TopBar } from "@/components/layout/TopBar";
import { buildAnalyticsProgressModel } from "@/lib/analytics/progress";

export default function AnalyticsProgressPage() {
  const { controls, dataset } = useAnalyticsState();

  const model = useMemo(
    () =>
      buildAnalyticsProgressModel({
        goals: dataset.goals,
        habits: dataset.habits,
        logs: dataset.logs,
        habitGoalLinks: dataset.habitGoalLinks,
        range: {
          startDate: controls.controls.startDate,
          endDate: controls.controls.endDate,
        },
        granularity: controls.controls.granularity,
      }),
    [
      controls.controls.endDate,
      controls.controls.granularity,
      controls.controls.startDate,
      dataset.goals,
      dataset.habits,
      dataset.habitGoalLinks,
      dataset.logs,
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
      <TopBar
        eyebrow="Deep dive"
        title="Analytics Progress"
        subtitle="Combined habit and goal charts for the selected window."
        right={
          <Link
            href="/analytics"
            className="rounded-md border border-hairline px-3 py-1.5 text-[12px] text-ink transition-chrome hover:bg-muted"
          >
            Back to summary
          </Link>
        }
      />

      <div className="mx-auto max-w-6xl px-8 pt-5">
        <AnalyticsControls
          controls={controls.controls}
          presets={controls.presets}
          onPresetChange={controls.setPreset}
          onRangeChange={controls.setCustomRange}
          onGranularityChange={controls.setGranularity}
          onComparisonToggle={controls.setComparisonEnabled}
          onRefresh={dataset.refresh}
          refreshing={dataset.refreshing}
        />
      </div>

      <div className="scroll-seamless flex-1">
        <div className="mx-auto max-w-6xl space-y-6 px-8 py-5 pb-16">
          <section id="habits" className="space-y-3" aria-label="Habit progress">
            <div className="flex items-center justify-between">
              <h2 className="text-display-sm text-[24px] text-ink">Habits</h2>
              <p className="text-[12px] text-ink-subtle">{model.habits.length} habits</p>
            </div>
            {model.habits.length === 0 ? (
              <div className="surface-card p-4 text-[13px] text-ink-subtle">No active habits.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {model.habits.map((row) => (
                  <HabitProgressCard key={row.habit.id} row={row} />
                ))}
              </div>
            )}
          </section>

          <section id="goals" className="space-y-3" aria-label="Goal progress">
            <div className="flex items-center justify-between">
              <h2 className="text-display-sm text-[24px] text-ink">Goals</h2>
              <p className="text-[12px] text-ink-subtle">{model.goals.length} goals</p>
            </div>
            {model.goals.length === 0 ? (
              <div className="surface-card p-4 text-[13px] text-ink-subtle">No active goals.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {model.goals.map((row) => (
                  <GoalProgressCard key={row.goal.id} row={row} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
