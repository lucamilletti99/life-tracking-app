# Planning-First Friendly UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a planning-first, friendly calendar UX that improves goal-impact visibility and planning-to-execution follow-through without introducing risk-scoring language.

**Architecture:** Introduce a tested planning domain layer (`lib/planning/*`) that computes impact tiers, pulse buckets, planning rail groups, and optimistic action transitions. Wire this through a new `usePlanningSnapshot` hook, then keep UI components thin (`GoalPulseStrip`, `PlanningRail`, `PlannerDrawer`, and enhanced calendar chips/views) so behavior remains consistent across week/day/month and analytics surfaces.

**Tech Stack:** Next.js App Router (client components), React 19, TypeScript, Tailwind CSS, Supabase client services, Vitest.

---

## Scope Check
The approved spec is one cohesive subsystem (calendar-centric planning UX). This plan keeps it as a single implementation track and ships in incremental, testable slices.

## File Structure

### New files
- `lib/planning/model.ts`
  - Impact tier and friendly pulse bucket classifiers.
- `lib/planning/model.test.ts`
  - Unit tests for impact and pulse logic.
- `lib/planning/snapshot.ts`
  - Pure builder that merges todos/habits/goal links into planning outputs.
- `lib/planning/snapshot.test.ts`
  - Unit tests for grouping/sorting and linked-goal enrichment.
- `lib/planning/workflow.ts`
  - Pure optimistic transitions for complete/log/filter actions.
- `lib/planning/workflow.test.ts`
  - Integration-style tests for quick actions and filter behavior.
- `lib/services/links.ts`
  - Supabase reads for `habit_goal_links` and `todo_goal_links`.
- `hooks/usePlanningSnapshot.ts`
  - Data orchestration hook used by Calendar page.
- `components/calendar/GoalPulseStrip.tsx`
  - Friendly bucket strip (`Great progress`, `Steady`, `Needs a touch`).
- `components/calendar/PlanningRail.tsx`
  - `This Week Focus`, `Ready to Schedule`, `Quick Wins Today` panels.
- `components/calendar/PlannerDrawer.tsx`
  - Day-first drawer with item mode fallback.
- `components/calendar/WeeklyReviewCard.tsx`
  - Lightweight momentum summary card.

### Modified files
- `lib/types.ts`
  - Extend planning-related types used by UI and hooks.
- `hooks/useCalendarWeek.ts`
  - Delegate to planning snapshot while preserving existing consumers.
- `components/calendar/CalendarItem.tsx`
  - Render impact badge + goal chips.
- `components/calendar/WeekView.tsx`
  - Pass through enriched item visuals and selection behavior.
- `components/calendar/DayView.tsx`
  - Support day selection for `PlannerDrawer` day mode.
- `components/calendar/MonthView.tsx`
  - Show friendly impact metadata consistently.
- `app/(app)/calendar/page.tsx`
  - Integrate `GoalPulseStrip`, `PlanningRail`, and `PlannerDrawer`.
- `app/(app)/analytics/page.tsx`
  - Add `WeeklyReviewCard` surface.
- `lib/analytics.ts`
  - Add weekly review summary builder.
- `lib/analytics.test.ts`
  - Validate summary payload for review card.

### Existing docs to consult before edits
- `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/index.md`

## Task 1: Build Planning Classification Primitives

**Files:**
- Create: `lib/planning/model.ts`
- Test: `lib/planning/model.test.ts`

- [ ] **Step 1: Write the failing unit tests for impact tier + pulse bucket logic**

```ts
import { describe, expect, it } from "vitest";

import type { Goal } from "@/lib/types";
import {
  buildGoalPulseBuckets,
  classifyGoalPulse,
  classifyImpactTier,
} from "./model";

const goalBase = {
  description: undefined,
  baseline_value: undefined,
  current_value_cache: undefined,
  is_active: true,
  created_at: "",
  updated_at: "",
};

describe("classifyImpactTier", () => {
  it("returns high when item links multiple goals", () => {
    expect(classifyImpactTier(["g1", "g2"], false)).toBe("high");
  });

  it("returns high when numeric logging is required with one linked goal", () => {
    expect(classifyImpactTier(["g1"], true)).toBe("high");
  });

  it("returns medium for one linked goal without numeric logging", () => {
    expect(classifyImpactTier(["g1"], false)).toBe("medium");
  });

  it("returns low for no linked goals", () => {
    expect(classifyImpactTier([], false)).toBe("low");
  });
});

describe("classifyGoalPulse", () => {
  const accumulation: Goal = {
    ...goalBase,
    id: "g1",
    title: "Read 300 pages",
    goal_type: "accumulation",
    unit: "pages",
    target_value: 300,
    start_date: "2026-04-01",
    end_date: "2026-04-30",
  };

  it("marks accumulation as great progress when ahead of pace", () => {
    expect(classifyGoalPulse(accumulation, 180, "2026-04-15")).toBe("great_progress");
  });

  it("marks accumulation as needs a touch when behind pace", () => {
    expect(classifyGoalPulse(accumulation, 60, "2026-04-20")).toBe("needs_a_touch");
  });
});

describe("buildGoalPulseBuckets", () => {
  it("groups counts by friendly pulse bucket", () => {
    const goals: Goal[] = [
      {
        ...goalBase,
        id: "g1",
        title: "Read",
        goal_type: "accumulation",
        unit: "pages",
        target_value: 300,
        start_date: "2026-04-01",
        end_date: "2026-04-30",
      },
      {
        ...goalBase,
        id: "g2",
        title: "Spend",
        goal_type: "limit",
        unit: "USD",
        target_value: 600,
        start_date: "2026-04-14",
        end_date: "2026-04-20",
      },
    ];

    const currentByGoalId = new Map([
      ["g1", 170],
      ["g2", 640],
    ]);

    const buckets = buildGoalPulseBuckets(goals, currentByGoalId, "2026-04-20");

    expect(buckets.great_progress.length).toBe(1);
    expect(buckets.needs_a_touch.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/planning/model.test.ts`
Expected: FAIL with module-not-found for `./model`.

- [ ] **Step 3: Implement planning classification primitives**

```ts
import { differenceInCalendarDays, parseISO } from "date-fns";

import type { Goal } from "@/lib/types";

export type ImpactTier = "high" | "medium" | "low";
export type GoalPulseBucket = "great_progress" | "steady" | "needs_a_touch";

export function classifyImpactTier(
  linkedGoalIds: string[],
  requiresNumericLog: boolean,
): ImpactTier {
  if (linkedGoalIds.length >= 2) return "high";
  if (linkedGoalIds.length === 1 && requiresNumericLog) return "high";
  if (linkedGoalIds.length === 1) return "medium";
  return "low";
}

function progressWindow(goal: Goal, asOf: string) {
  const start = parseISO(goal.start_date);
  const end = parseISO(goal.end_date);
  const at = parseISO(asOf);

  const totalDays = Math.max(differenceInCalendarDays(end, start) + 1, 1);
  const elapsedDays = Math.min(
    Math.max(differenceInCalendarDays(at, start) + 1, 1),
    totalDays,
  );

  return { elapsedRatio: elapsedDays / totalDays };
}

export function classifyGoalPulse(
  goal: Goal,
  currentValue: number,
  asOf: string,
): GoalPulseBucket {
  const { elapsedRatio } = progressWindow(goal, asOf);

  if (goal.goal_type === "accumulation") {
    const expected = goal.target_value * elapsedRatio;
    if (currentValue >= expected * 1.1) return "great_progress";
    if (currentValue >= expected * 0.85) return "steady";
    return "needs_a_touch";
  }

  if (goal.goal_type === "limit") {
    const expectedUsed = goal.target_value * elapsedRatio;
    if (currentValue <= expectedUsed * 0.9) return "great_progress";
    if (currentValue <= expectedUsed * 1.1) return "steady";
    return "needs_a_touch";
  }

  const baseline = goal.baseline_value ?? 0;
  const targetDelta = Math.abs(goal.target_value - baseline);
  const doneDelta = Math.abs(currentValue - baseline);
  const ratio = targetDelta === 0 ? 1 : doneDelta / targetDelta;

  if (ratio >= elapsedRatio + 0.1) return "great_progress";
  if (ratio >= elapsedRatio - 0.1) return "steady";
  return "needs_a_touch";
}

export function buildGoalPulseBuckets(
  goals: Goal[],
  currentByGoalId: Map<string, number>,
  asOf: string,
): Record<GoalPulseBucket, Goal[]> {
  return goals.reduce<Record<GoalPulseBucket, Goal[]>>(
    (acc, goal) => {
      const current = currentByGoalId.get(goal.id) ?? 0;
      const bucket = classifyGoalPulse(goal, current, asOf);
      acc[bucket].push(goal);
      return acc;
    },
    { great_progress: [], steady: [], needs_a_touch: [] },
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- lib/planning/model.test.ts`
Expected: PASS with all tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/planning/model.ts lib/planning/model.test.ts
git commit -m "feat: add friendly planning impact and pulse classifiers"
```

## Task 2: Build Planning Snapshot Builder (Grouping + Sorting)

**Files:**
- Create: `lib/planning/snapshot.ts`
- Test: `lib/planning/snapshot.test.ts`

- [ ] **Step 1: Write failing tests for planning rail grouping and linked-goal enrichment**

```ts
import { describe, expect, it } from "vitest";

import type { Goal, Habit, HabitGoalLink, Todo, TodoGoalLink } from "@/lib/types";
import { buildPlanningSnapshot } from "./snapshot";

const goals: Goal[] = [
  {
    id: "g1",
    title: "Read",
    goal_type: "accumulation",
    unit: "pages",
    target_value: 300,
    start_date: "2026-04-01",
    end_date: "2026-04-30",
    is_active: true,
    created_at: "",
    updated_at: "",
  },
];

const habits: Habit[] = [
  {
    id: "h1",
    title: "Read habit",
    tracking_type: "numeric",
    unit: "pages",
    recurrence_type: "daily",
    recurrence_config: {},
    auto_create_calendar_instances: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
];

const todos: Todo[] = [
  {
    id: "t1",
    title: "Plan reading",
    start_datetime: "2026-04-20T08:00:00",
    end_datetime: "2026-04-20T08:30:00",
    all_day: false,
    status: "pending",
    source_type: "manual",
    requires_numeric_log: true,
    created_at: "",
    updated_at: "",
  },
];

const habitGoalLinks: HabitGoalLink[] = [{ id: "hgl1", habit_id: "h1", goal_id: "g1", created_at: "" }];
const todoGoalLinks: TodoGoalLink[] = [{ id: "tgl1", todo_id: "t1", goal_id: "g1", created_at: "" }];

describe("buildPlanningSnapshot", () => {
  it("enriches calendar items with linked goals and impact tiers", () => {
    const snapshot = buildPlanningSnapshot({
      goals,
      habits,
      todos,
      habitGoalLinks,
      todoGoalLinks,
      rangeStart: "2026-04-20",
      rangeEnd: "2026-04-26",
      asOf: "2026-04-20",
    });

    expect(snapshot.calendarItems[0].linked_goal_ids).toEqual(["g1"]);
    expect(snapshot.calendarItems[0].impact_tier).toBe("high");
  });

  it("returns grouped rail sections", () => {
    const snapshot = buildPlanningSnapshot({
      goals,
      habits,
      todos,
      habitGoalLinks,
      todoGoalLinks,
      rangeStart: "2026-04-20",
      rangeEnd: "2026-04-26",
      asOf: "2026-04-20",
    });

    expect(snapshot.planningRailGroups.thisWeekFocus.length).toBeGreaterThan(0);
    expect(snapshot.planningRailGroups.quickWinsToday.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/planning/snapshot.test.ts`
Expected: FAIL with module-not-found for `./snapshot`.

- [ ] **Step 3: Implement snapshot builder**

```ts
import { format, isToday, parseISO } from "date-fns";

import { getOccurrencesInRange } from "@/lib/recurrence";
import type { Goal, Habit, HabitGoalLink, Todo, TodoGoalLink } from "@/lib/types";

import { buildGoalPulseBuckets, classifyImpactTier, type ImpactTier } from "./model";

export interface PlanningCalendarItem {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  all_day: boolean;
  kind: "todo" | "habit_occurrence";
  status: "pending" | "complete" | "skipped";
  source_habit_id?: string;
  requires_numeric_log: boolean;
  linked_goal_ids: string[];
  impact_tier: ImpactTier;
}

export function buildPlanningSnapshot(input: {
  goals: Goal[];
  habits: Habit[];
  todos: Todo[];
  habitGoalLinks: HabitGoalLink[];
  todoGoalLinks: TodoGoalLink[];
  rangeStart: string;
  rangeEnd: string;
  asOf: string;
}) {
  const habitGoalMap = new Map<string, string[]>();
  for (const link of input.habitGoalLinks) {
    const existing = habitGoalMap.get(link.habit_id) ?? [];
    habitGoalMap.set(link.habit_id, [...existing, link.goal_id]);
  }

  const todoGoalMap = new Map<string, string[]>();
  for (const link of input.todoGoalLinks) {
    const existing = todoGoalMap.get(link.todo_id) ?? [];
    todoGoalMap.set(link.todo_id, [...existing, link.goal_id]);
  }

  const todoItems: PlanningCalendarItem[] = input.todos.map((todo) => {
    const linkedGoalIds = todoGoalMap.get(todo.id) ?? [];
    return {
      id: todo.id,
      title: todo.title,
      start_datetime: todo.start_datetime,
      end_datetime: todo.end_datetime,
      all_day: todo.all_day,
      kind: "todo",
      status: todo.status,
      source_habit_id: todo.source_habit_id,
      requires_numeric_log: todo.requires_numeric_log,
      linked_goal_ids: linkedGoalIds,
      impact_tier: classifyImpactTier(linkedGoalIds, todo.requires_numeric_log),
    };
  });

  const habitItems: PlanningCalendarItem[] = input.habits
    .filter((habit) => habit.auto_create_calendar_instances)
    .flatMap((habit) => {
      const linkedGoalIds = habitGoalMap.get(habit.id) ?? [];
      return getOccurrencesInRange(habit, input.rangeStart, input.rangeEnd).map((date) => ({
        id: `habit-${habit.id}-${date}`,
        title: habit.title,
        start_datetime: `${date}T08:00:00`,
        end_datetime: `${date}T08:30:00`,
        all_day: false,
        kind: "habit_occurrence" as const,
        status: "pending" as const,
        source_habit_id: habit.id,
        requires_numeric_log: habit.tracking_type !== "boolean",
        linked_goal_ids: linkedGoalIds,
        impact_tier: classifyImpactTier(linkedGoalIds, habit.tracking_type !== "boolean"),
      }));
    });

  const calendarItems = [...todoItems, ...habitItems].sort((a, b) =>
    a.start_datetime.localeCompare(b.start_datetime),
  );

  const currentByGoalId = new Map(input.goals.map((goal) => [goal.id, 0]));
  const goalPulseBuckets = buildGoalPulseBuckets(input.goals, currentByGoalId, input.asOf);

  const planningRailGroups = {
    thisWeekFocus: calendarItems.filter((item) => item.impact_tier !== "low").slice(0, 8),
    readyToSchedule: input.habits.filter((habit) => !habit.auto_create_calendar_instances),
    quickWinsToday: calendarItems.filter(
      (item) => isToday(parseISO(item.start_datetime)) && item.status === "pending",
    ),
  };

  return {
    asOf: format(parseISO(input.asOf), "yyyy-MM-dd"),
    calendarItems,
    planningRailGroups,
    goalPulseBuckets,
    activePulseFilter: "all" as const,
    pendingLogs: [] as Array<{ sourceId: string; numericValue: number; note?: string }>,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- lib/planning/snapshot.test.ts`
Expected: PASS with grouping/enrichment assertions green.

- [ ] **Step 5: Commit**

```bash
git add lib/planning/snapshot.ts lib/planning/snapshot.test.ts
git commit -m "feat: build planning snapshot grouping and enrichment"
```

## Task 3: Add Planning Workflow Reducer (Integration-Style Behavior)

**Files:**
- Create: `lib/planning/workflow.ts`
- Test: `lib/planning/workflow.test.ts`

- [ ] **Step 1: Write failing integration-style tests for quick actions + pulse filtering**

```ts
import { describe, expect, it } from "vitest";

import { applyPlanningAction } from "./workflow";

const baseSnapshot = {
  asOf: "2026-04-20",
  activePulseFilter: "all" as const,
  calendarItems: [
    {
      id: "t1",
      title: "Read",
      start_datetime: "2026-04-20T08:00:00",
      end_datetime: "2026-04-20T08:30:00",
      all_day: false,
      kind: "todo" as const,
      status: "pending" as const,
      requires_numeric_log: true,
      linked_goal_ids: ["g1"],
      impact_tier: "high" as const,
    },
  ],
  planningRailGroups: {
    thisWeekFocus: [],
    readyToSchedule: [],
    quickWinsToday: [
      {
        id: "t1",
        title: "Read",
      },
    ],
  },
  goalPulseBuckets: {
    great_progress: [{ id: "g1" }],
    steady: [],
    needs_a_touch: [],
  },
  pendingLogs: [],
};

describe("applyPlanningAction", () => {
  it("marks item complete and removes it from quick wins", () => {
    const next = applyPlanningAction(baseSnapshot, { type: "complete", itemId: "t1" });

    expect(next.calendarItems[0].status).toBe("complete");
    expect(next.planningRailGroups.quickWinsToday).toHaveLength(0);
  });

  it("adds pending log entry for log_and_complete", () => {
    const next = applyPlanningAction(baseSnapshot, {
      type: "log_and_complete",
      itemId: "t1",
      value: 24,
      note: "morning session",
    });

    expect(next.pendingLogs[0].sourceId).toBe("t1");
    expect(next.pendingLogs[0].numericValue).toBe(24);
    expect(next.calendarItems[0].status).toBe("complete");
  });

  it("stores active pulse filter", () => {
    const next = applyPlanningAction(baseSnapshot, {
      type: "set_pulse_filter",
      filter: "needs_a_touch",
    });

    expect(next.activePulseFilter).toBe("needs_a_touch");
  });

  it("moves an item to today from planning rail", () => {
    const next = applyPlanningAction(baseSnapshot, {
      type: "move_to_today",
      itemId: "t1",
      today: "2026-04-21",
    });

    expect(next.calendarItems[0].start_datetime.startsWith("2026-04-21")).toBe(true);
  });

  it("supports rollback after failed optimistic mutation", () => {
    const changed = applyPlanningAction(baseSnapshot, { type: "complete", itemId: "t1" });
    const rolledBack = applyPlanningAction(changed, {
      type: "rollback",
      calendarItems: baseSnapshot.calendarItems,
    });

    expect(rolledBack.calendarItems[0].status).toBe("pending");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/planning/workflow.test.ts`
Expected: FAIL with module-not-found for `./workflow`.

- [ ] **Step 3: Implement planning workflow reducer**

```ts
type PlanningAction =
  | { type: "complete"; itemId: string }
  | { type: "log_and_complete"; itemId: string; value: number; note?: string }
  | { type: "set_pulse_filter"; filter: "all" | "great_progress" | "steady" | "needs_a_touch" }
  | { type: "move_to_today"; itemId: string; today: string }
  | {
      type: "rollback";
      calendarItems: Array<{
        id: string;
        status: "pending" | "complete" | "skipped";
        start_datetime: string;
        end_datetime: string;
      }>;
    };

export function applyPlanningAction<T extends {
  activePulseFilter: "all" | "great_progress" | "steady" | "needs_a_touch";
  calendarItems: Array<{
    id: string;
    status: "pending" | "complete" | "skipped";
    start_datetime: string;
    end_datetime: string;
  }>;
  planningRailGroups: {
    quickWinsToday: Array<{ id: string; title: string }>;
    thisWeekFocus: unknown[];
    readyToSchedule: unknown[];
  };
  pendingLogs: Array<{ sourceId: string; numericValue: number; note?: string }>;
}>(snapshot: T, action: PlanningAction): T {
  if (action.type === "set_pulse_filter") {
    return { ...snapshot, activePulseFilter: action.filter };
  }

  if (action.type === "rollback") {
    return {
      ...snapshot,
      calendarItems: action.calendarItems,
    };
  }

  if (action.type === "move_to_today") {
    const movedItems = snapshot.calendarItems.map((item) => {
      if (item.id !== action.itemId) return item;

      const startSuffix = item.start_datetime.slice(10);
      const endSuffix = item.end_datetime.slice(10);

      return {
        ...item,
        start_datetime: `${action.today}${startSuffix}`,
        end_datetime: `${action.today}${endSuffix}`,
      };
    });

    return {
      ...snapshot,
      calendarItems: movedItems,
    };
  }

  const markComplete = snapshot.calendarItems.map((item) =>
    item.id === action.itemId ? { ...item, status: "complete" as const } : item,
  );

  const quickWinsToday = snapshot.planningRailGroups.quickWinsToday.filter(
    (item) => item.id !== action.itemId,
  );

  if (action.type === "complete") {
    return {
      ...snapshot,
      calendarItems: markComplete,
      planningRailGroups: { ...snapshot.planningRailGroups, quickWinsToday },
    };
  }

  return {
    ...snapshot,
    calendarItems: markComplete,
    planningRailGroups: { ...snapshot.planningRailGroups, quickWinsToday },
    pendingLogs: [
      ...snapshot.pendingLogs,
      { sourceId: action.itemId, numericValue: action.value, note: action.note },
    ],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- lib/planning/workflow.test.ts`
Expected: PASS with all action behavior checks green.

- [ ] **Step 5: Commit**

```bash
git add lib/planning/workflow.ts lib/planning/workflow.test.ts
git commit -m "feat: add planning workflow reducer for quick actions"
```

## Task 4: Wire Supabase + Hooks into Planning Snapshot

**Files:**
- Create: `lib/services/links.ts`
- Create: `hooks/usePlanningSnapshot.ts`
- Modify: `hooks/useCalendarWeek.ts`
- Modify: `lib/types.ts`
- Test: `lib/planning/snapshot.test.ts` (extend)

- [ ] **Step 1: Extend snapshot tests to fail on link-table service shape assumptions**

```ts
it("hydrates todo and habit links from dedicated link arrays", () => {
  const snapshot = buildPlanningSnapshot({
    goals,
    habits,
    todos,
    habitGoalLinks: [{ id: "hgl", habit_id: "h1", goal_id: "g1", created_at: "" }],
    todoGoalLinks: [{ id: "tgl", todo_id: "t1", goal_id: "g1", created_at: "" }],
    rangeStart: "2026-04-20",
    rangeEnd: "2026-04-26",
    asOf: "2026-04-20",
  });

  expect(snapshot.calendarItems.every((item) => Array.isArray(item.linked_goal_ids))).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify current failures**

Run: `npm run test -- lib/planning/snapshot.test.ts`
Expected: FAIL if typing/shape is incompatible with new planning item fields.

- [ ] **Step 3: Implement link services + planning hook + type extensions**

```ts
// lib/services/links.ts
import { supabase } from "@/supabase/client";

import type { HabitGoalLink, TodoGoalLink } from "@/lib/types";

export const linksService = {
  async listHabitGoalLinks(): Promise<HabitGoalLink[]> {
    const { data, error } = await supabase.from("habit_goal_links").select("*");
    if (error) throw error;
    return (data ?? []) as HabitGoalLink[];
  },

  async listTodoGoalLinks(): Promise<TodoGoalLink[]> {
    const { data, error } = await supabase.from("todo_goal_links").select("*");
    if (error) throw error;
    return (data ?? []) as TodoGoalLink[];
  },
};
```

```ts
// hooks/usePlanningSnapshot.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";

import { buildPlanningSnapshot } from "@/lib/planning/snapshot";
import { goalsService } from "@/lib/services/goals";
import { habitsService } from "@/lib/services/habits";
import { linksService } from "@/lib/services/links";
import { todosService } from "@/lib/services/todos";

export function usePlanningSnapshot(currentDate: Date, view: "week" | "day" | "month") {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<ReturnType<typeof buildPlanningSnapshot> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const range = useMemo(() => {
    if (view === "month") {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      };
    }

    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });

    return { start, end };
  }, [currentDate, view]);

  const refresh = useCallback(() => setRefreshToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const [goals, habits, todos, habitGoalLinks, todoGoalLinks] = await Promise.all([
        goalsService.list(),
        habitsService.list(),
        todosService.forDateRange(
          `${format(range.start, "yyyy-MM-dd")}T00:00:00`,
          `${format(range.end, "yyyy-MM-dd")}T23:59:59`,
        ),
        linksService.listHabitGoalLinks(),
        linksService.listTodoGoalLinks(),
      ]);

      if (cancelled) return;

      setSnapshot(
        buildPlanningSnapshot({
          goals,
          habits,
          todos,
          habitGoalLinks,
          todoGoalLinks,
          rangeStart: format(range.start, "yyyy-MM-dd"),
          rangeEnd: format(range.end, "yyyy-MM-dd"),
          asOf: format(currentDate, "yyyy-MM-dd"),
        }),
      );
      setLoading(false);
    }

    load().catch((error) => {
      if (!cancelled) {
        console.error(error);
        setSnapshot(null);
        setError("Could not refresh planning data.");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentDate, range.end, range.start, refreshToken]);

  return { loading, error, snapshot, refresh };
}
```

```ts
// lib/types.ts (additions)
export type ImpactTier = "high" | "medium" | "low";
export type GoalPulseBucket = "great_progress" | "steady" | "needs_a_touch";

export interface CalendarItem {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  all_day: boolean;
  kind: "todo" | "habit_occurrence";
  status: TodoStatus;
  source_habit_id?: string;
  requires_numeric_log: boolean;
  linked_goal_ids: string[];
  impact_tier?: ImpactTier;
}
```

```ts
// hooks/useCalendarWeek.ts (delegate snapshot data)
const planning = usePlanningSnapshot(currentDate, view);

return {
  currentDate,
  weekStart,
  weekEnd,
  days,
  items: planning.snapshot?.calendarItems ?? [],
  planningRailGroups: planning.snapshot?.planningRailGroups,
  goalPulseBuckets: planning.snapshot?.goalPulseBuckets,
  activePulseFilter: planning.snapshot?.activePulseFilter ?? "all",
  loading: loading || planning.loading,
  refresh: () => {
    setRefreshToken((n) => n + 1);
    planning.refresh();
  },
  setCurrentDate,
  goToPrevPeriod,
  goToNextPeriod,
  goToToday: () => setCurrentDate(new Date()),
};
```

- [ ] **Step 4: Run targeted tests**

Run: `npm run test -- lib/planning/model.test.ts lib/planning/snapshot.test.ts lib/planning/workflow.test.ts`
Expected: PASS for all planning-domain tests.

- [ ] **Step 5: Commit**

```bash
git add lib/services/links.ts hooks/usePlanningSnapshot.ts hooks/useCalendarWeek.ts lib/types.ts lib/planning/snapshot.test.ts
git commit -m "feat: wire planning snapshot hook and link table services"
```

## Task 5: Build Calendar Planning Surfaces (Pulse Strip + Rail + Impact Chips)

**Files:**
- Create: `components/calendar/GoalPulseStrip.tsx`
- Create: `components/calendar/PlanningRail.tsx`
- Modify: `components/calendar/CalendarItem.tsx`
- Modify: `components/calendar/WeekView.tsx`
- Modify: `components/calendar/DayView.tsx`
- Modify: `components/calendar/MonthView.tsx`
- Modify: `app/(app)/calendar/page.tsx`
- Test: `lib/planning/snapshot.test.ts` (extend for focus ordering contract)

- [ ] **Step 1: Add failing snapshot test that asserts This Week Focus sorts by impact tier first**

```ts
it("orders This Week Focus by impact tier before time", () => {
  const snapshot = buildPlanningSnapshot({
    goals,
    habits,
    todos: [
      {
        ...todos[0],
        id: "t-low",
        title: "Low impact item",
        requires_numeric_log: false,
      },
      {
        ...todos[0],
        id: "t-high",
        title: "High impact item",
        requires_numeric_log: true,
      },
    ],
    habitGoalLinks,
    todoGoalLinks: [
      { id: "l1", todo_id: "t-low", goal_id: "g1", created_at: "" },
      { id: "l2", todo_id: "t-high", goal_id: "g1", created_at: "" },
    ],
    rangeStart: "2026-04-20",
    rangeEnd: "2026-04-26",
    asOf: "2026-04-20",
  });

  expect(snapshot.planningRailGroups.thisWeekFocus[0].id).toBe("t-high");
});
```

- [ ] **Step 2: Run tests to verify behavior contract fails before UI wiring**

Run: `npm run test -- lib/planning/snapshot.test.ts`
Expected: FAIL because focus ordering is still time-only and not impact-first.

- [ ] **Step 3: Implement new planning UI components and chip visuals**

```tsx
// components/calendar/GoalPulseStrip.tsx
type GoalPulseKey = "great_progress" | "steady" | "needs_a_touch";

export function GoalPulseStrip(props: {
  counts: Record<GoalPulseKey, number>;
  active: "all" | GoalPulseKey;
  onSelect: (next: "all" | GoalPulseKey) => void;
}) {
  const items: Array<{ key: GoalPulseKey; label: string }> = [
    { key: "great_progress", label: "Great progress" },
    { key: "steady", label: "Steady" },
    { key: "needs_a_touch", label: "Needs a touch" },
  ];

  return (
    <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2 py-1">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => props.onSelect(item.key)}
          className={`rounded-md px-2 py-1 text-xs ${
            props.active === item.key ? "bg-neutral-900 text-white" : "text-neutral-600"
          }`}
        >
          {item.label} ({props.counts[item.key]})
        </button>
      ))}
    </div>
  );
}
```

```tsx
// components/calendar/PlanningRail.tsx
export function PlanningRail(props: {
  thisWeekFocus: Array<{ id: string; title: string }>;
  quickWinsToday: Array<{ id: string; title: string }>;
  readyToSchedule: Array<{ id: string; title: string }>;
  onSchedule: (itemId: string) => void;
  onComplete: (itemId: string) => void;
  onMoveToToday: (itemId: string) => void;
  onLog: (itemId: string) => void;
}) {
  return (
    <aside className="w-80 border-l border-neutral-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-neutral-900">This Week Focus</h2>
      {props.thisWeekFocus.map((row) => (
        <div key={row.id} className="mt-2 flex items-center justify-between">
          <span className="truncate text-sm text-neutral-700">{row.title}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => props.onSchedule(row.id)} className="text-xs text-neutral-500">
              Schedule
            </button>
            <button onClick={() => props.onMoveToToday(row.id)} className="text-xs text-neutral-500">
              Move
            </button>
            <button onClick={() => props.onLog(row.id)} className="text-xs text-neutral-500">
              Log
            </button>
            <button onClick={() => props.onComplete(row.id)} className="text-xs text-neutral-500">
              Complete
            </button>
          </div>
        </div>
      ))}
    </aside>
  );
}
```

```ts
// lib/planning/snapshot.ts (ordering update inside buildPlanningSnapshot)
const impactRank: Record<ImpactTier, number> = { high: 0, medium: 1, low: 2 };

const thisWeekFocus = [...calendarItems]
  .filter((item) => item.impact_tier !== "low")
  .sort((a, b) => {
    const tierDiff = impactRank[a.impact_tier] - impactRank[b.impact_tier];
    if (tierDiff !== 0) return tierDiff;
    return a.start_datetime.localeCompare(b.start_datetime);
  })
  .slice(0, 8);
```

```tsx
// components/calendar/CalendarItem.tsx (core visual additions)
<span className="truncate">{item.title}</span>
<div className="mt-1 flex items-center gap-1">
  <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] uppercase text-neutral-700">
    {item.impact_tier}
  </span>
  {item.linked_goal_ids.slice(0, 2).map((goalId) => (
    <span key={goalId} className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] text-neutral-600">
      {goalId}
    </span>
  ))}
</div>
```

```tsx
// app/(app)/calendar/page.tsx (integration points)
const [activePulseFilter, setActivePulseFilter] = useState<
  "all" | "great_progress" | "steady" | "needs_a_touch"
>("all");

const pulseCounts = {
  great_progress: calendar.goalPulseBuckets?.great_progress.length ?? 0,
  steady: calendar.goalPulseBuckets?.steady.length ?? 0,
  needs_a_touch: calendar.goalPulseBuckets?.needs_a_touch.length ?? 0,
};

<GoalPulseStrip
  counts={pulseCounts}
  active={activePulseFilter}
  onSelect={setActivePulseFilter}
/>;

{calendar.error && (
  <div className="mx-4 mt-2 flex items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600">
    <span>{calendar.error}</span>
    <button onClick={calendar.refresh} className="text-xs font-medium text-neutral-900">
      Retry
    </button>
  </div>
)}

<PlanningRail
  thisWeekFocus={(calendar.planningRailGroups?.thisWeekFocus ?? []).map((item) => ({
    id: item.id,
    title: item.title,
  }))}
  quickWinsToday={(calendar.planningRailGroups?.quickWinsToday ?? []).map((item) => ({
    id: item.id,
    title: item.title,
  }))}
  readyToSchedule={(calendar.planningRailGroups?.readyToSchedule ?? []).map((habit) => ({
    id: habit.id,
    title: habit.title,
  }))}
  onSchedule={(id) => openScheduleDialog(id)}
  onMoveToToday={(id) => handleOptimisticMoveToToday(id)}
  onLog={(id) => openInlineLog(id)}
  onComplete={(id) => handleOptimisticComplete(id)}
/>;
```

- [ ] **Step 4: Run tests and lint**

Run: `npm run test -- lib/planning/snapshot.test.ts`
Expected: PASS.

Run: `npm run lint`
Expected: PASS with no new lint errors.

- [ ] **Step 5: Commit**

```bash
git add components/calendar/GoalPulseStrip.tsx components/calendar/PlanningRail.tsx components/calendar/CalendarItem.tsx components/calendar/WeekView.tsx components/calendar/DayView.tsx components/calendar/MonthView.tsx app/(app)/calendar/page.tsx lib/planning/snapshot.ts lib/planning/snapshot.test.ts
git commit -m "feat: add planning rail, pulse strip, and impact chips to calendar"
```

## Task 6: Replace Right Drawer with Day-First Planner Drawer + Weekly Review Card

**Files:**
- Create: `components/calendar/PlannerDrawer.tsx`
- Create: `components/calendar/WeeklyReviewCard.tsx`
- Modify: `app/(app)/calendar/page.tsx`
- Modify: `app/(app)/analytics/page.tsx`
- Modify: `lib/analytics.ts`
- Test: `lib/analytics.test.ts`

- [ ] **Step 1: Add failing analytics test for weekly review summary payload**

```ts
it("builds weekly review summary used by WeeklyReviewCard", () => {
  const snapshot = buildAnalyticsSnapshot({
    goals: [],
    habits: [],
    todos: [
      {
        id: "t1",
        title: "Done",
        start_datetime: "2026-04-20T09:00:00",
        end_datetime: "2026-04-20T09:30:00",
        all_day: false,
        status: "complete",
        source_type: "manual",
        requires_numeric_log: false,
        created_at: "",
        updated_at: "",
      },
    ],
    logs: [],
    asOf: "2026-04-20",
  });

  expect(snapshot.weeklyReview.plannedCount).toBeGreaterThanOrEqual(1);
  expect(snapshot.weeklyReview.completedCount).toBeGreaterThanOrEqual(1);
});
```

- [ ] **Step 2: Run tests to verify it fails**

Run: `npm run test -- lib/analytics.test.ts`
Expected: FAIL because `weeklyReview` is not defined yet.

- [ ] **Step 3: Implement PlannerDrawer + WeeklyReviewCard + analytics payload**

```tsx
// components/calendar/PlannerDrawer.tsx
export function PlannerDrawer(props: {
  mode: "day" | "item";
  dayItems: Array<{ id: string; title: string; status: string }>;
  item: { id: string; title: string; requires_numeric_log: boolean } | null;
  onComplete: (id: string) => void;
  onLog: (id: string, value: number, note?: string) => void;
}) {
  if (props.mode === "day") {
    return (
      <aside className="w-80 border-l border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Today plan</h2>
        {props.dayItems.map((item) => (
          <div key={item.id} className="mt-2 flex items-center justify-between">
            <span className="text-sm text-neutral-700">{item.title}</span>
            <button onClick={() => props.onComplete(item.id)} className="text-xs text-neutral-500">
              Complete
            </button>
          </div>
        ))}
      </aside>
    );
  }

  return (
    <aside className="w-80 border-l border-neutral-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-neutral-900">{props.item?.title}</h2>
    </aside>
  );
}
```

```tsx
// components/calendar/WeeklyReviewCard.tsx
export function WeeklyReviewCard(props: {
  plannedCount: number;
  completedCount: number;
  consistencyStreakDays: number;
  topGoalTitle?: string;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-neutral-900">Weekly momentum</h3>
      <p className="mt-2 text-sm text-neutral-600">
        Planned {props.plannedCount} · Completed {props.completedCount}
      </p>
      <p className="text-sm text-neutral-600">Consistency streak: {props.consistencyStreakDays} days</p>
      <p className="text-sm text-neutral-600">Top goal: {props.topGoalTitle ?? "No goal linked yet"}</p>
    </section>
  );
}
```

```tsx
// app/(app)/analytics/page.tsx (render card near goal snapshot)
<WeeklyReviewCard
  plannedCount={snapshot.weeklyReview.plannedCount}
  completedCount={snapshot.weeklyReview.completedCount}
  consistencyStreakDays={snapshot.weeklyReview.consistencyStreakDays}
  topGoalTitle={snapshot.weeklyReview.topGoalTitle}
/>
```

```ts
// lib/analytics.ts (addition)
const weeklyTodos = todos.filter((todo) => {
  const day = todo.start_datetime.slice(0, 10);
  return day >= startIso && day <= endIso;
});

const weeklyReview = {
  plannedCount: weeklyTodos.length,
  completedCount: weeklyTodos.filter((todo) => todo.status === "complete").length,
  consistencyStreakDays: dailyLogSeries.filter((d) => d.entries > 0).length,
  topGoalTitle: goalProgress[0]?.goal.title,
};

return {
  totals: {
    totalGoals: goals.length,
    totalHabits: habits.length,
    totalTodos: todos.length,
    onTrackGoals,
    todoCompletionRate,
    logsInWindow: logsInWindow.length,
  },
  goalProgress,
  dailyLogSeries,
  weeklyReview,
};
```

- [ ] **Step 4: Run focused tests + full suite**

Run: `npm run test -- lib/analytics.test.ts`
Expected: PASS for weekly review assertions.

Run: `npm run test`
Expected: PASS for full Vitest suite.

- [ ] **Step 5: Commit**

```bash
git add components/calendar/PlannerDrawer.tsx components/calendar/WeeklyReviewCard.tsx app/(app)/calendar/page.tsx app/(app)/analytics/page.tsx lib/analytics.ts lib/analytics.test.ts
git commit -m "feat: add day-first planner drawer and weekly momentum review"
```

## Task 7: Final Verification and Handoff

**Files:**
- Modify (if needed): `docs/superpowers/specs/2026-04-20-planning-first-friendly-ux-design.md` (only if acceptance criteria wording must be clarified)

- [ ] **Step 1: Run lint and full test suite on final branch state**

Run: `npm run lint && npm run test`
Expected: PASS for both commands.

- [ ] **Step 2: Manual UX verification checklist in dev server**

Run: `npm run dev`
Expected: App opens at `http://localhost:3000/calendar`.

Verify:
- GoalPulseStrip shows friendly buckets and filter toggles.
- PlanningRail displays all three sections with direct actions.
- Item chips show impact tier and goal chips.
- PlannerDrawer defaults to day context for planning.
- WeeklyReviewCard appears in analytics and reads sane data.

- [ ] **Step 3: Capture acceptance evidence in commit message body**

```bash
git add -A
git commit -m "chore: finalize planning-first friendly UX rollout" \
  -m "Acceptance: pulse strip, planning rail, planner drawer, and weekly review validated in local run"
```

- [ ] **Step 4: Share final implementation summary**

```md
Implemented planning-first friendly UX with:
- Goal pulse strip (friendly labels)
- Planning rail with one-step actions
- Impact chips across calendar views
- Day-first planner drawer
- Weekly momentum review summary
```
