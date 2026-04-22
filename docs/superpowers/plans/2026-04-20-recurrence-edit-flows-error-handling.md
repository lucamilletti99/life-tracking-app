# Recurrence Fix, Edit Flows & Error Handling — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix recurrence distribution, add edit flows for goals/habits, and add error toasts.

**Architecture:** Three independent changes — recurrence logic fix in `lib/recurrence.ts`, edit modal wiring in form components + pages, and sonner toast integration in the service layer.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase JS client, Vitest, sonner (new dep)

---

### Task 1: Fix recurrence distribution

**Files:**
- Modify: `lib/recurrence.ts:39-47`
- Modify: `lib/recurrence.test.ts:42-53`

- [ ] **Step 1: Update the test to assert even distribution**

Replace the `times_per_week` describe block in `lib/recurrence.test.ts`:

```ts
describe("times_per_week recurrence", () => {
  it("distributes N occurrences evenly across the week", () => {
    const habit: Habit = {
      ...base,
      recurrence_type: "times_per_week",
      recurrence_config: { times_per_period: 3 },
    };
    // 2026-04-14 (Tue) to 2026-04-20 (Mon) = 7 days
    const dates = getOccurrencesInRange(habit, "2026-04-14", "2026-04-20");
    expect(dates).toHaveLength(3);
    // Evenly spaced: indices 0, 2, 4 → Apr 14, Apr 16, Apr 18
    expect(dates[0]).toBe("2026-04-14");
    expect(dates[1]).toBe("2026-04-16");
    expect(dates[2]).toBe("2026-04-18");
  });
});

describe("times_per_month recurrence", () => {
  it("distributes N occurrences evenly across the month", () => {
    const habit: Habit = {
      ...base,
      recurrence_type: "times_per_month",
      recurrence_config: { times_per_period: 4 },
    };
    // April: 30 days, 4 occurrences → indices 0, 7, 15, 22
    const dates = getOccurrencesInRange(habit, "2026-04-01", "2026-04-30");
    expect(dates).toHaveLength(4);
    expect(dates[0]).toBe("2026-04-01");
    expect(dates[1]).toBe("2026-04-08");
    expect(dates[2]).toBe("2026-04-16");
    expect(dates[3]).toBe("2026-04-23");
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd /Users/lucamilletti/Desktop/personal_projects/life-tracking-app && npm test -- --reporter=verbose 2>&1 | grep -A5 "times_per"
```

Expected: FAIL — current impl uses `slice(0, n)`.

- [ ] **Step 3: Replace the two recurrence branches in `lib/recurrence.ts`**

Replace lines 39–47:

```ts
  if (habit.recurrence_type === "times_per_week") {
    const n = cfg.times_per_period ?? 1;
    const period = all.length;
    const indices = Array.from({ length: n }, (_, i) => Math.floor((i * period) / n));
    return indices.filter((idx) => idx < period).map((idx) => isoDate(all[idx]));
  }

  if (habit.recurrence_type === "times_per_month") {
    const n = cfg.times_per_period ?? 1;
    const period = all.length;
    const indices = Array.from({ length: n }, (_, i) => Math.floor((i * period) / n));
    return indices.filter((idx) => idx < period).map((idx) => isoDate(all[idx]));
  }
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
cd /Users/lucamilletti/Desktop/personal_projects/life-tracking-app && npm test 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/recurrence.ts lib/recurrence.test.ts
git commit -m "fix: distribute times_per_week and times_per_month evenly across period"
```

---

### Task 2: Install sonner and add Toaster to layout

**Files:**
- Modify: `app/(app)/layout.tsx`

- [ ] **Step 1: Install sonner**

```bash
cd /Users/lucamilletti/Desktop/personal_projects/life-tracking-app && npm install sonner
```

- [ ] **Step 2: Add Toaster to app layout**

Replace `app/(app)/layout.tsx` with:

```tsx
import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      <Toaster position="bottom-right" />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(app)/layout.tsx package.json package-lock.json
git commit -m "feat: add sonner toast provider to app layout"
```

---

### Task 3: Add error toasts to service layer

**Files:**
- Modify: `lib/services/goals.ts`
- Modify: `lib/services/habits.ts`
- Modify: `lib/services/todos.ts`
- Modify: `lib/services/logs.ts`

- [ ] **Step 1: Update `lib/services/goals.ts`**

Add `import { toast } from "sonner";` at top. Wrap `create`, `update`, `delete` with try/catch:

```ts
import { toast } from "sonner";
import { supabase } from "@/supabase/client";
import type { Goal } from "../types";

export const goalsService = {
  list: async (): Promise<Goal[]> => {
    const { data, error } = await supabase
      .from("goals").select("*").eq("is_active", true).order("created_at");
    if (error) throw error;
    return (data ?? []) as Goal[];
  },

  get: async (id: string): Promise<Goal | undefined> => {
    const { data, error } = await supabase
      .from("goals").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data as Goal | undefined;
  },

  create: async (data: Omit<Goal, "id" | "created_at" | "updated_at">): Promise<Goal> => {
    try {
      const { data: row, error } = await supabase.from("goals").insert(data).select().single();
      if (error) throw error;
      console.log("[goals] created", row);
      return row as Goal;
    } catch (err) {
      toast.error("Failed to create goal");
      console.error("[goals] create failed", err);
      throw err;
    }
  },

  update: async (id: string, data: Partial<Goal>): Promise<Goal> => {
    try {
      const { data: row, error } = await supabase
        .from("goals").update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id).select().single();
      if (error) throw error;
      console.log("[goals] updated", row);
      return row as Goal;
    } catch (err) {
      toast.error("Failed to update goal");
      console.error("[goals] update failed", err);
      throw err;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
      console.log("[goals] deleted", id);
    } catch (err) {
      toast.error("Failed to delete goal");
      console.error("[goals] delete failed", err);
      throw err;
    }
  },

  getLinkedHabitIds: async (goalId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("habit_goal_links").select("habit_id").eq("goal_id", goalId);
    if (error) throw error;
    return (data ?? []).map((r: { habit_id: string }) => r.habit_id);
  },

  getLinkedTodoIds: async (goalId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("todo_goal_links").select("todo_id").eq("goal_id", goalId);
    if (error) throw error;
    return (data ?? []).map((r: { todo_id: string }) => r.todo_id);
  },

  linkHabit: async (goalId: string, habitId: string): Promise<void> => {
    const { error } = await supabase
      .from("habit_goal_links").upsert({ goal_id: goalId, habit_id: habitId });
    if (error) throw error;
  },

  unlinkHabit: async (goalId: string, habitId: string): Promise<void> => {
    const { error } = await supabase
      .from("habit_goal_links").delete().match({ goal_id: goalId, habit_id: habitId });
    if (error) throw error;
  },
};
```

- [ ] **Step 2: Read `lib/services/habits.ts` then add toast to create, update, archive**

Read the file first, then wrap `create`, `update`, and `archive` in the same pattern:
```ts
// top of file
import { toast } from "sonner";

// around create:
try {
  // ... existing supabase call
  console.log("[habits] created", row);
  return row as Habit;
} catch (err) {
  toast.error("Failed to create habit");
  console.error("[habits] create failed", err);
  throw err;
}

// around update:
try {
  // ... existing supabase call
  console.log("[habits] updated", row);
  return row as Habit;
} catch (err) {
  toast.error("Failed to update habit");
  console.error("[habits] update failed", err);
  throw err;
}

// around archive:
try {
  // ... existing supabase call
  console.log("[habits] archived", id);
} catch (err) {
  toast.error("Failed to archive habit");
  console.error("[habits] archive failed", err);
  throw err;
}
```

- [ ] **Step 3: Read `lib/services/todos.ts` then add toast to create, update, delete**

Same pattern as habits. Error messages: `"Failed to create todo"`, `"Failed to update todo"`, `"Failed to delete todo"`. Log prefix: `[todos]`.

- [ ] **Step 4: Read `lib/services/logs.ts` then add toast to create, delete**

Same pattern. Error messages: `"Failed to save log"`, `"Failed to delete log"`. Log prefix: `[logs]`.

- [ ] **Step 5: Build check**

```bash
cd /Users/lucamilletti/Desktop/personal_projects/life-tracking-app && npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add lib/services/
git commit -m "feat: add error toasts and success logging to service layer"
```

---

### Task 4: Add edit button to GoalCard

**Files:**
- Modify: `components/goals/GoalCard.tsx`

- [ ] **Step 1: Add `onEdit` prop and pencil button**

Replace `components/goals/GoalCard.tsx` with:

```tsx
import { format, parseISO } from "date-fns";
import { Pencil } from "lucide-react";

import type { GoalProgress } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

import { GoalProgressBar } from "./GoalProgressBar";

interface GoalCardProps {
  progress: GoalProgress;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
}

const typeLabel: Record<string, string> = {
  target: "Target",
  accumulation: "Accumulate",
  limit: "Limit",
};

export function GoalCard({ progress, onClick, onEdit }: GoalCardProps) {
  const { goal, current_value, percentage, is_on_track } = progress;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-neutral-900">{goal.title}</p>
          <p className="mt-0.5 text-xs text-neutral-400">
            {format(parseISO(goal.start_date), "MMM d")} -{" "}
            {format(parseISO(goal.end_date), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <Pencil size={14} />
          </button>
          <Badge variant={is_on_track ? "default" : "secondary"} className="shrink-0 text-xs">
            {is_on_track ? "On track" : "Off track"}
          </Badge>
        </div>
      </div>

      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="text-neutral-600">
          {current_value.toLocaleString()} {goal.unit}
        </span>
        <span className="text-xs text-neutral-400">
          {typeLabel[goal.goal_type]} - {goal.target_value.toLocaleString()} {goal.unit}
        </span>
      </div>

      <GoalProgressBar
        percentage={percentage}
        isOnTrack={is_on_track}
        goalType={goal.goal_type}
      />
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/goals/GoalCard.tsx
git commit -m "feat: add edit button to GoalCard"
```

---

### Task 5: Wire goal edit flow in GoalForm and goals page

**Files:**
- Modify: `components/goals/GoalForm.tsx`
- Modify: `app/(app)/goals/page.tsx`

- [ ] **Step 1: Add `goalId` and auto-save to `GoalForm`**

Replace `components/goals/GoalForm.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Goal, GoalType } from "@/lib/types";

interface GoalFormProps {
  goalId?: string;
  initial?: Partial<Goal>;
  onSubmit: (
    data: Omit<Goal, "id" | "created_at" | "updated_at" | "current_value_cache">,
  ) => void;
  onAutoSave?: (
    data: Omit<Goal, "id" | "created_at" | "updated_at" | "current_value_cache">,
  ) => void;
  onCancel: () => void;
}

export function GoalForm({ goalId, initial, onSubmit, onAutoSave, onCancel }: GoalFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [goalType, setGoalType] = useState<GoalType>(initial?.goal_type ?? "accumulation");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [targetValue, setTargetValue] = useState(String(initial?.target_value ?? ""));
  const [baselineValue, setBaselineValue] = useState(String(initial?.baseline_value ?? ""));
  const [startDate, setStartDate] = useState(initial?.start_date ?? "");
  const [endDate, setEndDate] = useState(initial?.end_date ?? "");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEditMode = Boolean(goalId);

  useEffect(() => {
    if (!isEditMode || !onAutoSave) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onAutoSave({
        title,
        goal_type: goalType,
        unit,
        target_value: parseFloat(targetValue) || 0,
        baseline_value: baselineValue ? parseFloat(baselineValue) : undefined,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
      });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title, goalType, unit, targetValue, baselineValue, startDate, endDate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      title,
      goal_type: goalType,
      unit,
      target_value: parseFloat(targetValue),
      baseline_value: baselineValue ? parseFloat(baselineValue) : undefined,
      start_date: startDate,
      end_date: endDate,
      is_active: true,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Read 500 pages" />
      </div>

      <div>
        <Label>Type</Label>
        <div className="mt-1 flex gap-2">
          {(["target", "accumulation", "limit"] as GoalType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setGoalType(t)}
              className={`rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors ${
                goalType === t
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <Label>Target value</Label>
          <Input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} required />
        </div>
        <div className="flex-1">
          <Label>Unit</Label>
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} required placeholder="lbs, pages, USD..." />
        </div>
      </div>

      {goalType === "target" && (
        <div>
          <Label>Baseline value</Label>
          <Input type="number" value={baselineValue} onChange={(e) => setBaselineValue(e.target.value)} placeholder="Starting value" />
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1">
          <Label>Start date</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div className="flex-1">
          <Label>End date</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
      </div>

      {!isEditMode && (
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save goal</Button>
        </div>
      )}

      {isEditMode && (
        <div className="flex justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Done</Button>
        </div>
      )}
    </form>
  );
}
```

- [ ] **Step 2: Wire `editingGoalId` state and handlers in `app/(app)/goals/page.tsx`**

Add `editingGoalId` state and update the page. Key changes only (full file):

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { GoalCard } from "@/components/goals/GoalCard";
import { GoalForm } from "@/components/goals/GoalForm";
import { TopBar } from "@/components/layout/TopBar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { calculateGoalProgress } from "@/lib/goal-calculations";
import { goalsService } from "@/lib/services/goals";
import { logsService } from "@/lib/services/logs";
import type { Goal, LogEntry } from "@/lib/types";

const goalExamples = [
  { title: "Lose 5 lbs by June", details: "Type: Target · Unit: lbs · Baseline: 178 · Target: 173" },
  { title: "Read 500 pages this month", details: "Type: Accumulation · Unit: pages · Target: 500" },
  { title: "Keep weekly spending under $600", details: "Type: Limit · Unit: USD · Target: 600" },
];

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [goalRows, logRows] = await Promise.all([goalsService.list(), logsService.list()]);
        if (!cancelled) { setGoals(goalRows); setLogs(logRows); }
      } catch (error) {
        if (!cancelled) { setGoals([]); setLogs([]); console.error(error); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const progressList = useMemo(() => goals.map((g) => calculateGoalProgress(g, logs)), [goals, logs]);

  async function handleCreate(data: Omit<Goal, "id" | "created_at" | "updated_at" | "current_value_cache">) {
    await goalsService.create(data);
    const refreshed = await goalsService.list();
    setGoals(refreshed);
    setOpen(false);
  }

  async function handleAutoSave(id: string, data: Omit<Goal, "id" | "created_at" | "updated_at" | "current_value_cache">) {
    await goalsService.update(id, data);
    const refreshed = await goalsService.list();
    setGoals(refreshed);
  }

  const editingGoal = editingGoalId ? goals.find((g) => g.id === editingGoalId) : undefined;

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-neutral-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <TopBar title="Goals" onQuickAdd={() => setOpen(true)} />
      <div className="flex-1 overflow-y-auto p-6">
        {goals.length === 0 ? (
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-5 py-16 text-center">
            <p className="text-sm text-neutral-400">No goals yet. Create your first goal.</p>
            <div className="w-full rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Example goal ideas</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {goalExamples.map((example) => (
                  <div key={example.title} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-sm font-medium text-neutral-900">{example.title}</p>
                    <p className="mt-1 text-xs text-neutral-500">{example.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {progressList.map((p) => (
              <GoalCard
                key={p.goal.id}
                progress={p}
                onClick={() => router.push(`/goals/${p.goal.id}`)}
                onEdit={(e) => { e.stopPropagation(); setEditingGoalId(p.goal.id); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New goal</DialogTitle></DialogHeader>
          <GoalForm onSubmit={handleCreate} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={Boolean(editingGoalId)} onOpenChange={(o) => { if (!o) setEditingGoalId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit goal</DialogTitle></DialogHeader>
          {editingGoal && (
            <GoalForm
              goalId={editingGoal.id}
              initial={editingGoal}
              onSubmit={() => setEditingGoalId(null)}
              onAutoSave={(data) => handleAutoSave(editingGoal.id, data)}
              onCancel={() => setEditingGoalId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 3: Build check**

```bash
cd /Users/lucamilletti/Desktop/personal_projects/life-tracking-app && npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add components/goals/GoalForm.tsx app/(app)/goals/page.tsx
git commit -m "feat: add edit flow for goals with auto-save"
```

---

### Task 6: Add edit button to HabitCard

**Files:**
- Modify: `components/habits/HabitCard.tsx`

- [ ] **Step 1: Add `onEdit` prop and pencil button**

Replace `components/habits/HabitCard.tsx`:

```tsx
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Habit } from "@/lib/types";

const recurrenceLabel: Record<string, string> = {
  daily: "Every day",
  weekdays: "Selected days",
  times_per_week: "X/week",
  times_per_month: "X/month",
  day_of_month: "Day of month",
};

interface HabitCardProps {
  habit: Habit;
  onClick?: () => void;
  onEdit?: (e: React.MouseEvent) => void;
}

export function HabitCard({ habit, onClick, onEdit }: HabitCardProps) {
  const content = (
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="font-medium text-neutral-900">{habit.title}</p>
        <p className="mt-0.5 text-xs text-neutral-400">
          {recurrenceLabel[habit.recurrence_type]} - {habit.tracking_type}
          {habit.unit ? ` (${habit.unit})` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <Pencil size={14} />
          </button>
        )}
        <Badge variant="secondary" className="text-xs capitalize">{habit.tracking_type}</Badge>
      </div>
    </div>
  );

  if (!onClick) {
    return <div className="w-full rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition-all hover:border-neutral-300 hover:shadow-md"
    >
      {content}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/habits/HabitCard.tsx
git commit -m "feat: add edit button to HabitCard"
```

---

### Task 7: Wire habit edit flow in HabitForm and habits page

**Files:**
- Modify: `components/habits/HabitForm.tsx`
- Modify: `app/(app)/habits/page.tsx`

- [ ] **Step 1: Add `habitId` and auto-save to `HabitForm`**

Replace `components/habits/HabitForm.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Habit, RecurrenceConfig, RecurrenceType, TrackingType } from "@/lib/types";

import { RecurrenceBuilder } from "./RecurrenceBuilder";

interface HabitFormProps {
  habitId?: string;
  initial?: Partial<Habit>;
  onSubmit: (data: Omit<Habit, "id" | "created_at" | "updated_at">) => void;
  onAutoSave?: (data: Omit<Habit, "id" | "created_at" | "updated_at">) => void;
  onCancel: () => void;
}

export function HabitForm({ habitId, initial, onSubmit, onAutoSave, onCancel }: HabitFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [trackingType, setTrackingType] = useState<TrackingType>(initial?.tracking_type ?? "numeric");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(initial?.recurrence_type ?? "daily");
  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig>(initial?.recurrence_config ?? {});
  const [autoCreate, setAutoCreate] = useState(initial?.auto_create_calendar_instances ?? true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEditMode = Boolean(habitId);

  useEffect(() => {
    if (!isEditMode || !onAutoSave) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onAutoSave({
        title,
        tracking_type: trackingType,
        unit: unit || undefined,
        recurrence_type: recurrenceType,
        recurrence_config: recurrenceConfig,
        auto_create_calendar_instances: autoCreate,
        is_active: true,
      });
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [title, trackingType, unit, recurrenceType, recurrenceConfig, autoCreate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      title,
      tracking_type: trackingType,
      unit: unit || undefined,
      recurrence_type: recurrenceType,
      recurrence_config: recurrenceConfig,
      auto_create_calendar_instances: autoCreate,
      is_active: true,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Morning weigh-in" />
      </div>

      <div>
        <Label>Tracking type</Label>
        <div className="mt-1 flex flex-wrap gap-2">
          {(["boolean", "numeric", "amount", "duration", "measurement"] as TrackingType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTrackingType(t)}
              className={`rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors ${
                trackingType === t
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {trackingType !== "boolean" && (
        <div>
          <Label>Unit</Label>
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="lbs, pages, USD, min..." />
        </div>
      )}

      <RecurrenceBuilder
        type={recurrenceType}
        config={recurrenceConfig}
        onTypeChange={setRecurrenceType}
        onConfigChange={setRecurrenceConfig}
      />

      <label className="flex items-center gap-2 text-sm text-neutral-600">
        <input type="checkbox" checked={autoCreate} onChange={(e) => setAutoCreate(e.target.checked)} />
        Show on calendar automatically
      </label>

      {!isEditMode && (
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save habit</Button>
        </div>
      )}

      {isEditMode && (
        <div className="flex justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Done</Button>
        </div>
      )}
    </form>
  );
}
```

- [ ] **Step 2: Wire `editingHabitId` in `app/(app)/habits/page.tsx`**

Add `editingHabitId` state. Key additions to the existing page:

```tsx
// Add to imports
import { habitsService } from "@/lib/services/habits";

// Add state
const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

// Add handler
async function handleAutoSaveHabit(id: string, data: Omit<Habit, "id" | "created_at" | "updated_at">) {
  await habitsService.update(id, data);
  await refreshHabitsData();
}

// editingHabit derived value
const editingHabit = editingHabitId ? habits.find((h) => h.id === editingHabitId) : undefined;
```

Pass `onEdit` to all `<HabitCard>` usages:
```tsx
<HabitCard
  key={habit.id}
  habit={habit}
  onEdit={(e) => { e.stopPropagation(); setEditingHabitId(habit.id); }}
/>
```

Add edit dialog before closing `</>`:
```tsx
<Dialog open={Boolean(editingHabitId)} onOpenChange={(o) => { if (!o) setEditingHabitId(null); }}>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader><DialogTitle>Edit habit</DialogTitle></DialogHeader>
    {editingHabit && (
      <HabitForm
        habitId={editingHabit.id}
        initial={editingHabit}
        onSubmit={() => setEditingHabitId(null)}
        onAutoSave={(data) => handleAutoSaveHabit(editingHabit.id, data)}
        onCancel={() => setEditingHabitId(null)}
      />
    )}
  </DialogContent>
</Dialog>
```

- [ ] **Step 3: Build check**

```bash
cd /Users/lucamilletti/Desktop/personal_projects/life-tracking-app && npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors.

- [ ] **Step 4: Run all tests**

```bash
cd /Users/lucamilletti/Desktop/personal_projects/life-tracking-app && npm test 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/habits/HabitForm.tsx app/(app)/habits/page.tsx
git commit -m "feat: add edit flow for habits with auto-save"
```

---

## Self-Review

- **Spec coverage:** Recurrence fix ✓, edit flows for goals + habits ✓, error toasts on all service mutations ✓, successes logged not toasted ✓
- **Placeholders:** None
- **Type consistency:** `onAutoSave` signature matches `onSubmit` minus id/timestamps throughout; `editingGoalId`/`editingHabitId` naming consistent; `handleAutoSave`/`handleAutoSaveHabit` both accept `(id, data)`
- **Execution order:** Tasks 1, 2, 3 are independent. Tasks 4+5 depend on each other (GoalCard → goals page). Tasks 6+7 depend on each other (HabitCard → habits page). Tasks 4–5 and 6–7 are independent of each other.
