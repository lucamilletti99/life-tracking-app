# Analytics Metrics Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the Analytics summary page into a trend-first metrics dashboard with calmer controls, consistent top stat cards, and clearer interactive affordances without changing the underlying analytics model.

**Architecture:** Keep the App Router structure and current analytics data flow intact. Implement the redesign in four layers: lock the control behavior, refactor the summary header into a consistent metric row, remove redundant page sections and reorder the page hierarchy, then restyle the weekly review and navigation cards. Reuse the existing analytics summary model and current `use client` boundaries instead of introducing new data-fetching or routing patterns.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, Base UI, lucide-react, date-fns, Vitest, ESLint

---

## Execution Prerequisites

- [ ] **Step 1: Create a dedicated worktree before implementation**

```bash
git worktree add ../life-tracking-app-analytics-dashboard -b codex/analytics-dashboard-redesign
cd ../life-tracking-app-analytics-dashboard
```

Expected: a clean worktree on branch `codex/analytics-dashboard-redesign`, separate from the current dirty workspace.

- [ ] **Step 2: Read the local Next.js docs relevant to this client-heavy UI work**

```bash
sed -n '1,220p' node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md
sed -n '1,180p' node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md
```

Expected: confirm that interactive analytics UI should remain in Client Components and that Vitest coverage should stay focused on synchronous Client/Server component unit tests.

- [ ] **Step 3: Keep the approved design spec open while implementing**

```bash
sed -n '1,260p' docs/superpowers/specs/2026-04-26-analytics-metrics-dashboard-redesign-design.md
```

Expected: implementation stays anchored to the approved scope and wording.

## File Structure

### Create
- `docs/superpowers/plans/2026-04-26-analytics-metrics-dashboard-redesign.md` — this implementation plan
- `components/analytics/AnalyticsSummaryHeader.test.tsx` — coverage for control ordering, subordinate copy, and balanced-score progress semantics
- `components/analytics/summary/SummaryMetricCard.tsx` — reusable summary stat card with optional score bar and delta formatting
- `components/analytics/summary/WeeklyReviewInsightsCard.test.tsx` — coverage for prompt ordering and non-alert styling
- `components/analytics/summary/DeepDiveEntryCard.test.tsx` — coverage for explicit link affordance
- `app/(app)/analytics/page.test.tsx` — page-level coverage for section removal and trend-first ordering

### Modify
- `hooks/useAnalyticsControls.ts` — allow switching into persisted `custom` mode without immediately editing dates
- `components/analytics/AnalyticsControls.tsx` — add the `Custom` preset, hide raw date inputs until custom mode is active, and tone down the control hierarchy
- `components/analytics/AnalyticsControls.test.tsx` — update control rendering expectations for hidden/revealed date inputs
- `components/analytics/AnalyticsSummaryHeader.tsx` — render controls before the stat row, switch to a consistent 4-card layout, and feed subordinate copy/deltas into a reusable metric card
- `app/(app)/analytics/page.tsx` — remove `KPIs` and `Score breakdown`, keep the trend chart first, and reuse the link-card component for both lower navigation targets
- `components/analytics/summary/WeeklyReviewInsightsCard.tsx` — move the ready-state prompt above the score blocks and restyle it as inline warm accent text
- `components/analytics/summary/DeepDiveEntryCard.tsx` — add an explicit `Open` cue and directional affordance

### Delete
- `components/analytics/summary/ScoreBreakdownCard.tsx` — redundant with the top summary cards after the redesign

## Task 1: Lock Custom-Range Control Behavior

**Files:**
- Modify: `hooks/useAnalyticsControls.ts`
- Modify: `components/analytics/AnalyticsControls.tsx`
- Modify: `components/analytics/AnalyticsControls.test.tsx`
- Reference: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

- [ ] **Step 1: Write the failing control-rendering tests**

`components/analytics/AnalyticsControls.test.tsx`

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AnalyticsControls } from "@/components/analytics/AnalyticsControls";
import { parseStoredControls } from "@/hooks/useAnalyticsControls";

describe("AnalyticsControls", () => {
  it("hides manual date inputs until Custom is selected", () => {
    const html = renderToStaticMarkup(
      <AnalyticsControls
        controls={{
          startDate: "2026-04-01",
          endDate: "2026-05-30",
          granularity: "weekly",
          comparisonEnabled: true,
          presetKey: "2m",
        }}
        presets={["1m", "2m", "3m", "6m", "1y", "2y"]}
        onPresetChange={() => {}}
        onRangeChange={() => {}}
        onGranularityChange={() => {}}
        onComparisonToggle={() => {}}
        onRefresh={() => {}}
        refreshing={false}
      />,
    );

    expect(html).toContain(">Custom<");
    expect(html).not.toContain('type="date"');
  });

  it("shows manual date inputs when the custom range is active", () => {
    const html = renderToStaticMarkup(
      <AnalyticsControls
        controls={{
          startDate: "2026-04-01",
          endDate: "2026-05-30",
          granularity: "weekly",
          comparisonEnabled: false,
          presetKey: "custom",
        }}
        presets={["1m", "2m", "3m", "6m", "1y", "2y"]}
        onPresetChange={() => {}}
        onRangeChange={() => {}}
        onGranularityChange={() => {}}
        onComparisonToggle={() => {}}
        onRefresh={() => {}}
        refreshing={false}
      />,
    );

    expect((html.match(/type="date"/g) ?? [])).toHaveLength(2);
    expect(html).toContain("Granularity");
    expect(html).toContain("Compare previous period");
  });
});

describe("parseStoredControls", () => {
  it("returns null for invalid JSON payload", () => {
    expect(parseStoredControls("not-json")).toBeNull();
  });

  it("returns null for missing required fields", () => {
    expect(parseStoredControls(JSON.stringify({ startDate: "2026-01-01" }))).toBeNull();
  });

  it("clamps restored ranges and preserves valid controls", () => {
    const parsed = parseStoredControls(
      JSON.stringify({
        startDate: "2026-04-20",
        endDate: "2026-04-22",
        granularity: "daily",
        comparisonEnabled: true,
        presetKey: "custom",
      }),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.endDate).toBe("2026-04-22");
    expect(parsed?.startDate).toBe("2026-03-24");
    expect(parsed?.granularity).toBe("daily");
  });
});
```

- [ ] **Step 2: Run the control tests to verify they fail**

Run: `npm test -- components/analytics/AnalyticsControls.test.tsx`

Expected: FAIL because the current controls always render date inputs and do not expose a `Custom` preset button.

- [ ] **Step 3: Implement persisted custom-mode selection and conditional date inputs**

`hooks/useAnalyticsControls.ts`

```ts
import type {
  AnalyticsControlsState,
  AnalyticsGranularity,
  AnalyticsPresetKey,
} from "@/lib/analytics/types";

function setPreset(preset: AnalyticsPresetKey) {
  if (preset === "custom") {
    setControls((prev) => ({
      ...prev,
      presetKey: "custom",
    }));
    return;
  }

  const endDate = controls.endDate;
  const startDate = format(
    subDays(new Date(`${endDate}T00:00:00`), PRESET_DAYS[preset] - 1),
    "yyyy-MM-dd",
  );
  const clamped = clampAnalyticsRange({ startDate, endDate });

  setControls((prev) => ({
    ...prev,
    startDate: clamped.startDate,
    endDate: clamped.endDate,
    presetKey: preset,
  }));
}
```

`components/analytics/AnalyticsControls.tsx`

```tsx
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import type {
  AnalyticsControlsState,
  AnalyticsPresetKey,
} from "@/lib/analytics/types";

interface AnalyticsControlsProps {
  controls: AnalyticsControlsState;
  presets: Array<Exclude<AnalyticsPresetKey, "custom">>;
  onPresetChange: (preset: AnalyticsPresetKey) => void;
  onRangeChange: (startDate: string, endDate: string) => void;
  onGranularityChange: (value: AnalyticsControlsState["granularity"]) => void;
  onComparisonToggle: (enabled: boolean) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const PRESET_LABELS: Record<Exclude<AnalyticsPresetKey, "custom">, string> = {
  "1m": "1M",
  "2m": "2M",
  "3m": "3M",
  "6m": "6M",
  "1y": "1Y",
  "2y": "2Y",
};

export function AnalyticsControls({
  controls,
  presets,
  onPresetChange,
  onRangeChange,
  onGranularityChange,
  onComparisonToggle,
  onRefresh,
  refreshing,
}: AnalyticsControlsProps) {
  const minDate = useMemo(() => {
    const end = new Date(`${controls.endDate}T00:00:00`);
    end.setDate(end.getDate() - (730 - 1));
    return end.toISOString().slice(0, 10);
  }, [controls.endDate]);

  const presetOptions: AnalyticsPresetKey[] = [...presets, "custom"];

  return (
    <section className="surface-card p-4" aria-label="Analytics controls">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-eyebrow">Range</span>
          {presetOptions.map((preset) => (
            <Button
              key={preset}
              type="button"
              size="sm"
              variant={controls.presetKey === preset ? "default" : "outline"}
              onClick={() => onPresetChange(preset)}
            >
              {preset === "custom" ? "Custom" : PRESET_LABELS[preset]}
            </Button>
          ))}
        </div>

        {controls.presetKey === "custom" && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-[12px] text-ink-muted">
              Start
              <input
                className="mt-1 w-full rounded-md border border-hairline bg-surface px-2.5 py-2 text-[13px] text-ink"
                type="date"
                value={controls.startDate}
                min={minDate}
                max={controls.endDate}
                onChange={(event) => onRangeChange(event.target.value, controls.endDate)}
              />
            </label>

            <label className="text-[12px] text-ink-muted">
              End
              <input
                className="mt-1 w-full rounded-md border border-hairline bg-surface px-2.5 py-2 text-[13px] text-ink"
                type="date"
                value={controls.endDate}
                min={controls.startDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) => onRangeChange(controls.startDate, event.target.value)}
              />
            </label>
          </div>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-[12px] text-ink-muted">
              Granularity
              <select
                className="mt-1 w-full rounded-md border border-hairline bg-surface px-2.5 py-2 text-[13px] text-ink"
                value={controls.granularity}
                onChange={(event) =>
                  onGranularityChange(
                    event.target.value as AnalyticsControlsState["granularity"],
                  )
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>

            <label className="flex items-center gap-2 pt-4 text-[12px] text-ink-muted">
              <input
                type="checkbox"
                checked={controls.comparisonEnabled}
                onChange={(event) => onComparisonToggle(event.target.checked)}
              />
              Compare previous period
            </label>
          </div>

          <Button type="button" size="sm" variant="outline" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the targeted control tests again**

Run: `npm test -- components/analytics/AnalyticsControls.test.tsx`

Expected: PASS with all `AnalyticsControls` and `parseStoredControls` assertions green.

- [ ] **Step 5: Commit the control behavior change**

```bash
git add hooks/useAnalyticsControls.ts components/analytics/AnalyticsControls.tsx components/analytics/AnalyticsControls.test.tsx
git commit -m "feat: add custom analytics range controls"
```

## Task 2: Refactor The Summary Header Into A Consistent Metric Row

**Files:**
- Create: `components/analytics/AnalyticsSummaryHeader.test.tsx`
- Create: `components/analytics/summary/SummaryMetricCard.tsx`
- Modify: `components/analytics/AnalyticsSummaryHeader.tsx`

- [ ] **Step 1: Write the failing summary-header tests**

`components/analytics/AnalyticsSummaryHeader.test.tsx`

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AnalyticsSummaryHeader } from "@/components/analytics/AnalyticsSummaryHeader";
import type { AnalyticsSummaryModel } from "@/lib/analytics/types";

const baseSummary: AnalyticsSummaryModel = {
  range: { startDate: "2026-04-01", endDate: "2026-05-30" },
  granularity: "weekly",
  balancedScore: 15,
  habitConsistencyScore: 1,
  goalPaceScore: 33,
  executionVolumeScore: 5,
  kpis: {
    totalGoals: 3,
    totalHabits: 4,
    totalTodos: 0,
    onTrackGoals: 1,
    todoCompletionRate: 0,
    logsInRange: 4,
    loggingConsistencyRate: 7,
  },
  trendSeries: [],
  reviewInsight: {
    isPromptRecommended: false,
    latestScore: null,
    recentScores: [],
    totalReviews: 0,
    latestWeekStart: null,
    reviews: [],
  },
  comparison: null,
  goalProgress: [],
};

const controls = {
  controls: {
    startDate: "2026-04-01",
    endDate: "2026-05-30",
    granularity: "weekly" as const,
    comparisonEnabled: false,
    presetKey: "2m" as const,
  },
  presets: ["1m", "2m", "3m", "6m", "1y", "2y"] as const,
  onPresetChange: () => {},
  onRangeChange: () => {},
  onGranularityChange: () => {},
  onComparisonToggle: () => {},
  onRefresh: () => {},
  refreshing: false,
};

describe("AnalyticsSummaryHeader", () => {
  it("renders controls before the metric row and uses static subordinate copy by default", () => {
    const html = renderToStaticMarkup(
      <AnalyticsSummaryHeader summary={baseSummary} controls={controls} />,
    );

    expect(html.indexOf("Analytics controls")).toBeLessThan(html.indexOf("Balanced score"));
    expect(html).toContain("out of 100");
    expect((html.match(/this period/g) ?? [])).toHaveLength(3);
    expect(html).toContain("sm:grid-cols-2");
    expect(html).toContain("xl:grid-cols-4");
  });

  it("renders comparison deltas and balanced-score progress semantics when comparison is active", () => {
    const html = renderToStaticMarkup(
      <AnalyticsSummaryHeader
        summary={{
          ...baseSummary,
          comparison: {
            previousRange: { startDate: "2026-01-31", endDate: "2026-03-31" },
            deltaBalancedScore: 12,
            deltaHabitConsistencyScore: -4,
            deltaGoalPaceScore: 7,
            deltaExecutionVolumeScore: -2,
            deltaTodoCompletionRate: 0,
            deltaLogsInRange: 0,
          },
        }}
        controls={{
          ...controls,
          controls: {
            ...controls.controls,
            comparisonEnabled: true,
          },
        }}
      />,
    );

    expect(html).toContain("+12 vs previous period");
    expect(html).toContain("-4 vs previous period");
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="15"');
  });
});
```

- [ ] **Step 2: Run the header tests to verify they fail**

Run: `npm test -- components/analytics/AnalyticsSummaryHeader.test.tsx`

Expected: FAIL because the current header renders the score row before the controls, does not render the static fallback copy, and has no balanced-score progress semantics.

- [ ] **Step 3: Implement a reusable metric card and wire it into the header**

`components/analytics/summary/SummaryMetricCard.tsx`

```tsx
interface SummaryMetricCardProps {
  label: string;
  value: string;
  subline: string;
  emphasized?: boolean;
  progressValue?: number;
}

export function formatScoreDelta(delta: number) {
  const signed = delta > 0 ? `+${delta}` : `${delta}`;
  return `${signed} vs previous period`;
}

export function SummaryMetricCard({
  label,
  value,
  subline,
  emphasized = false,
  progressValue,
}: SummaryMetricCardProps) {
  const clampedProgress =
    typeof progressValue === "number"
      ? Math.min(100, Math.max(0, progressValue))
      : null;

  return (
    <div className={emphasized ? "surface-card-elevated p-4" : "surface-card p-4"}>
      <p className="text-eyebrow">{label}</p>
      <p className="text-display-sm mt-1 text-[30px] text-ink">{value}</p>

      {clampedProgress !== null && (
        <div
          className="mt-3 h-[6px] w-full overflow-hidden rounded-full bg-hairline"
          role="progressbar"
          aria-label={`${label} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={clampedProgress}
        >
          <div
            className="h-full rounded-full bg-ember transition-smooth"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      )}

      <p className="mt-2 text-[12px] text-ink-subtle">{subline}</p>
    </div>
  );
}
```

`components/analytics/AnalyticsSummaryHeader.tsx`

```tsx
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
            subline={
              comparison
                ? formatScoreDelta(comparison.deltaBalancedScore)
                : "out of 100"
            }
            emphasized
            progressValue={summary.balancedScore}
          />
          <SummaryMetricCard
            label="Habit consistency"
            value={`${summary.habitConsistencyScore}%`}
            subline={
              comparison
                ? formatScoreDelta(comparison.deltaHabitConsistencyScore)
                : "this period"
            }
          />
          <SummaryMetricCard
            label="Goal pace"
            value={`${summary.goalPaceScore}%`}
            subline={
              comparison
                ? formatScoreDelta(comparison.deltaGoalPaceScore)
                : "this period"
            }
          />
          <SummaryMetricCard
            label="Execution volume"
            value={`${summary.executionVolumeScore}%`}
            subline={
              comparison
                ? formatScoreDelta(comparison.deltaExecutionVolumeScore)
                : "this period"
            }
          />
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Run the summary-header tests again**

Run: `npm test -- components/analytics/AnalyticsSummaryHeader.test.tsx`

Expected: PASS with the control ordering, delta text, and progressbar semantics verified.

- [ ] **Step 5: Commit the summary-header refactor**

```bash
git add components/analytics/AnalyticsSummaryHeader.tsx components/analytics/AnalyticsSummaryHeader.test.tsx components/analytics/summary/SummaryMetricCard.tsx
git commit -m "feat: refine analytics summary cards"
```

## Task 3: Remove Redundant Sections And Make The Trend Chart Primary

**Files:**
- Create: `app/(app)/analytics/page.test.tsx`
- Modify: `app/(app)/analytics/page.tsx`
- Delete: `components/analytics/summary/ScoreBreakdownCard.tsx`

- [ ] **Step 1: Write the failing page-composition test**

`app/(app)/analytics/page.test.tsx`

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/analytics/AnalyticsStateProvider", () => ({
  useAnalyticsState: () => ({
    controls: {
      controls: {
        startDate: "2026-04-01",
        endDate: "2026-05-30",
        granularity: "weekly",
        comparisonEnabled: false,
        presetKey: "2m",
      },
      presets: ["1m", "2m", "3m", "6m", "1y", "2y"],
      setPreset: () => {},
      setCustomRange: () => {},
      setGranularity: () => {},
      setComparisonEnabled: () => {},
      reset: () => {},
    },
    dataset: {
      goals: [],
      habits: [],
      todos: [],
      logs: [],
      habitGoalLinks: [],
      todoGoalLinks: [],
      weeklyReviews: [],
      loading: false,
      refreshing: false,
      error: null,
      refresh: () => {},
    },
  }),
}));

vi.mock("@/lib/analytics/summary", () => ({
  buildAnalyticsSummaryModel: () => ({
    range: { startDate: "2026-04-01", endDate: "2026-05-30" },
    granularity: "weekly",
    balancedScore: 15,
    habitConsistencyScore: 1,
    goalPaceScore: 33,
    executionVolumeScore: 5,
    kpis: {
      totalGoals: 0,
      totalHabits: 0,
      totalTodos: 0,
      onTrackGoals: 0,
      todoCompletionRate: 0,
      logsInRange: 0,
      loggingConsistencyRate: 0,
    },
    trendSeries: [],
    reviewInsight: {
      isPromptRecommended: false,
      latestScore: null,
      recentScores: [],
      totalReviews: 0,
      latestWeekStart: null,
      reviews: [],
    },
    comparison: null,
    goalProgress: [],
  }),
}));

vi.mock("@/components/analytics/AnalyticsSummaryHeader", () => ({
  AnalyticsSummaryHeader: () => <section>Header marker</section>,
}));

vi.mock("@/components/analytics/summary/SummaryTrendChart", () => ({
  SummaryTrendChart: () => <section>Trend marker</section>,
}));

vi.mock("@/components/analytics/summary/WeeklyReviewInsightsCard", () => ({
  WeeklyReviewInsightsCard: () => <section>Weekly review marker</section>,
}));

vi.mock("@/components/analytics/summary/DeepDiveEntryCard", () => ({
  DeepDiveEntryCard: ({ title }: { title: string }) => <a>{title}</a>,
}));

import AnalyticsPage from "./page";

describe("AnalyticsPage", () => {
  it("removes redundant sections and keeps trend content above the lower cards", () => {
    const html = renderToStaticMarkup(<AnalyticsPage />);

    expect(html).not.toContain("KPIs");
    expect(html).not.toContain("Score breakdown");
    expect(html.indexOf("Trend marker")).toBeLessThan(html.indexOf("Weekly review marker"));
    expect(html.indexOf("Trend marker")).toBeLessThan(html.indexOf("Progress deep-dive"));
    expect(html).toContain("Jump to goals");
  });
});
```

- [ ] **Step 2: Run the page test to verify it fails**

Run: `npm test -- "app/(app)/analytics/page.test.tsx"`

Expected: FAIL because the current page still renders the `KPIs` section, still imports `ScoreBreakdownCard`, and does not reuse the lower navigation card component consistently.

- [ ] **Step 3: Remove redundant sections, reorder content, and delete the breakdown card**

`app/(app)/analytics/page.tsx`

```tsx
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
```

Delete the redundant card:

```bash
git rm components/analytics/summary/ScoreBreakdownCard.tsx
```

- [ ] **Step 4: Run the page test again**

Run: `npm test -- "app/(app)/analytics/page.test.tsx"`

Expected: PASS with the `KPIs` and `Score breakdown` strings gone and the trend marker appearing before the lower sections.

- [ ] **Step 5: Commit the page hierarchy cleanup**

```bash
git add "app/(app)/analytics/page.tsx" "app/(app)/analytics/page.test.tsx"
git commit -m "feat: simplify analytics summary page"
```

## Task 4: Restyle Weekly Review And Lower Navigation Affordances

**Files:**
- Create: `components/analytics/summary/WeeklyReviewInsightsCard.test.tsx`
- Create: `components/analytics/summary/DeepDiveEntryCard.test.tsx`
- Modify: `components/analytics/summary/WeeklyReviewInsightsCard.tsx`
- Modify: `components/analytics/summary/DeepDiveEntryCard.tsx`

- [ ] **Step 1: Write the failing weekly-review and link-card tests**

`components/analytics/summary/WeeklyReviewInsightsCard.test.tsx`

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { WeeklyReviewInsightsCard } from "@/components/analytics/summary/WeeklyReviewInsightsCard";
import type { AnalyticsSummaryModel } from "@/lib/analytics/types";

const summary: AnalyticsSummaryModel = {
  range: { startDate: "2026-04-01", endDate: "2026-05-30" },
  granularity: "weekly",
  balancedScore: 15,
  habitConsistencyScore: 1,
  goalPaceScore: 33,
  executionVolumeScore: 5,
  kpis: {
    totalGoals: 3,
    totalHabits: 4,
    totalTodos: 0,
    onTrackGoals: 1,
    todoCompletionRate: 0,
    logsInRange: 4,
    loggingConsistencyRate: 7,
  },
  trendSeries: [],
  reviewInsight: {
    isPromptRecommended: true,
    latestScore: 8,
    recentScores: [7, 8],
    totalReviews: 2,
    latestWeekStart: "2026-04-20",
    reviews: [],
  },
  comparison: null,
  goalProgress: [],
};

describe("WeeklyReviewInsightsCard", () => {
  it("renders the ready-state prompt above the history blocks without alert styling", () => {
    const html = renderToStaticMarkup(<WeeklyReviewInsightsCard summary={summary} />);

    expect(html.indexOf("Weekly review is ready for this week.")).toBeLessThan(
      html.indexOf("Latest score"),
    );
    expect(html).toContain("text-ember");
    expect(html).not.toContain("border-ember");
  });
});
```

`components/analytics/summary/DeepDiveEntryCard.test.tsx`

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DeepDiveEntryCard } from "@/components/analytics/summary/DeepDiveEntryCard";

describe("DeepDiveEntryCard", () => {
  it("renders an explicit open cue for navigation affordance", () => {
    const html = renderToStaticMarkup(
      <DeepDiveEntryCard
        title="Progress deep-dive"
        description="Open all habit and goal charts in one combined analytics page."
        href="/analytics/progress"
      />,
    );

    expect(html).toContain("Progress deep-dive");
    expect(html).toContain(">Open<");
    expect(html).toContain("group");
  });
});
```

- [ ] **Step 2: Run the new lower-section tests to verify they fail**

Run: `npm test -- components/analytics/summary/WeeklyReviewInsightsCard.test.tsx components/analytics/summary/DeepDiveEntryCard.test.tsx`

Expected: FAIL because the prompt still renders below the data blocks in alert-like chrome and the navigation card has no explicit `Open` cue.

- [ ] **Step 3: Restyle the weekly review prompt and deep-link card affordances**

`components/analytics/summary/WeeklyReviewInsightsCard.tsx`

```tsx
import type { AnalyticsSummaryModel } from "@/lib/analytics/types";

interface WeeklyReviewInsightsCardProps {
  summary: AnalyticsSummaryModel;
}

export function WeeklyReviewInsightsCard({ summary }: WeeklyReviewInsightsCardProps) {
  const insight = summary.reviewInsight;

  return (
    <section className="surface-card p-5" aria-label="Weekly review insights">
      <p className="text-eyebrow mb-3">Weekly review</p>

      {insight.isPromptRecommended && (
        <p className="mb-3 text-[12px] font-medium text-ember">
          Weekly review is ready for this week.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-hairline bg-background p-3">
          <p className="text-[12px] text-ink-muted">Latest score</p>
          <p className="text-display-sm mt-1 text-[24px] text-ink">
            {insight.latestScore ?? "-"}
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
```

`components/analytics/summary/DeepDiveEntryCard.tsx`

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface DeepDiveEntryCardProps {
  title: string;
  description: string;
  href: string;
}

export function DeepDiveEntryCard({ title, description, href }: DeepDiveEntryCardProps) {
  return (
    <Link
      href={href}
      className="surface-card group flex items-center justify-between gap-4 rounded-xl p-4 transition-chrome hover:border-ember hover:bg-ember-soft focus-visible:border-ember"
    >
      <div>
        <p className="text-[14px] font-medium text-ink">{title}</p>
        <p className="mt-1 text-[12px] leading-5 text-ink-muted">{description}</p>
      </div>

      <div className="flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-ink-subtle transition-colors group-hover:text-ink">
        <span>Open</span>
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Run the lower-section tests again**

Run: `npm test -- components/analytics/summary/WeeklyReviewInsightsCard.test.tsx components/analytics/summary/DeepDiveEntryCard.test.tsx`

Expected: PASS with the prompt above the history blocks and the explicit `Open` cue present.

- [ ] **Step 5: Commit the weekly-review and navigation affordance polish**

```bash
git add components/analytics/summary/WeeklyReviewInsightsCard.tsx components/analytics/summary/WeeklyReviewInsightsCard.test.tsx components/analytics/summary/DeepDiveEntryCard.tsx components/analytics/summary/DeepDiveEntryCard.test.tsx
git commit -m "feat: polish analytics secondary actions"
```

## Task 5: Run Final Verification For The Analytics Summary Surface

**Files:**
- Verify: `hooks/useAnalyticsControls.ts`
- Verify: `components/analytics/AnalyticsControls.tsx`
- Verify: `components/analytics/AnalyticsSummaryHeader.tsx`
- Verify: `components/analytics/summary/SummaryMetricCard.tsx`
- Verify: `components/analytics/summary/WeeklyReviewInsightsCard.tsx`
- Verify: `components/analytics/summary/DeepDiveEntryCard.tsx`
- Verify: `app/(app)/analytics/page.tsx`

- [ ] **Step 1: Run the focused analytics test suite**

Run:

```bash
npx vitest run \
  components/analytics/AnalyticsControls.test.tsx \
  components/analytics/AnalyticsSummaryHeader.test.tsx \
  components/analytics/summary/SummaryTrendChart.test.tsx \
  components/analytics/summary/WeeklyReviewInsightsCard.test.tsx \
  components/analytics/summary/DeepDiveEntryCard.test.tsx \
  "app/(app)/analytics/page.test.tsx" \
  lib/analytics.test.ts
```

Expected: PASS with all analytics-focused tests green.

- [ ] **Step 2: Run targeted lint on the changed analytics files**

Run:

```bash
npx eslint \
  "app/(app)/analytics/page.tsx" \
  "app/(app)/analytics/page.test.tsx" \
  components/analytics/AnalyticsControls.tsx \
  components/analytics/AnalyticsControls.test.tsx \
  components/analytics/AnalyticsSummaryHeader.tsx \
  components/analytics/AnalyticsSummaryHeader.test.tsx \
  components/analytics/summary/SummaryMetricCard.tsx \
  components/analytics/summary/WeeklyReviewInsightsCard.tsx \
  components/analytics/summary/WeeklyReviewInsightsCard.test.tsx \
  components/analytics/summary/DeepDiveEntryCard.tsx \
  components/analytics/summary/DeepDiveEntryCard.test.tsx \
  hooks/useAnalyticsControls.ts
```

Expected: no ESLint errors.

- [ ] **Step 3: Run a final Git diff review before the feature commit**

Run:

```bash
git diff -- app/(app)/analytics/page.tsx components/analytics hooks/useAnalyticsControls.ts
```

Expected: diff shows the intended scope only: custom controls, consistent summary cards, trend-first layout, weekly-review restyle, and lower-card affordance polish.

- [ ] **Step 4: Commit the finished analytics dashboard redesign**

```bash
git add "app/(app)/analytics/page.tsx" components/analytics hooks/useAnalyticsControls.ts
git commit -m "feat: redesign analytics summary dashboard"
```
