# Calendar Planning Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add day load indicators to WeekView column headers, a day-mode RightDrawer for planning overview, and drag-and-drop rescheduling for todos.

**Architecture:** A `DrawerState` union type replaces `selectedItem` in the calendar page, allowing the RightDrawer to render either item detail (existing) or a day overview (new). Day load is computed via a pure utility function. Drag-and-drop uses `@dnd-kit/core` on the existing WeekView slot/chip structure.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, date-fns, @dnd-kit/core (new)

---

## File Map

| File | Change |
|---|---|
| `lib/utils.ts` | Add `getDayLoad` |
| `lib/utils.test.ts` | New — tests for `getDayLoad` |
| `lib/types.ts` | Add `DrawerState` type |
| `app/(app)/calendar/page.tsx` | Replace `selectedItem` state with `DrawerState`; wire `onDayClick` |
| `components/calendar/WeekView.tsx` | Add `onDayClick` prop; load indicators in headers; `DndContext` + drag/drop (Task 6–7) |
| `components/calendar/CalendarItem.tsx` | Accept `draggable` flag; apply `useDraggable` conditionally |
| `components/calendar/RightDrawer.tsx` | Accept new props interface; add day-mode render branch |

---

## Task 1: Add `getDayLoad` to `lib/utils.ts`

**Files:**
- Modify: `lib/utils.ts`
- Create: `lib/utils.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/utils.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getDayLoad } from "./utils";
import type { CalendarItem } from "./types";

function makeItem(date: string, hour: number): CalendarItem {
  return {
    id: `item-${date}-${hour}`,
    title: "Test",
    start_datetime: `${date}T0${hour}:00:00`,
    end_datetime: `${date}T0${hour}:30:00`,
    all_day: false,
    kind: "todo",
    status: "pending",
    requires_numeric_log: false,
    linked_goal_ids: [],
  };
}

const date = new Date("2026-04-20T00:00:00");

describe("getDayLoad", () => {
  it("returns 'empty' when there are no items", () => {
    expect(getDayLoad([], date)).toBe("empty");
  });

  it("returns 'light' for 1 item", () => {
    expect(getDayLoad([makeItem("2026-04-20", 9)], date)).toBe("light");
  });

  it("returns 'light' for 2 items", () => {
    const items = [makeItem("2026-04-20", 9), makeItem("2026-04-20", 10)];
    expect(getDayLoad(items, date)).toBe("light");
  });

  it("returns 'moderate' for 3 items", () => {
    const items = [1, 2, 3].map((h) => makeItem("2026-04-20", h));
    expect(getDayLoad(items, date)).toBe("moderate");
  });

  it("returns 'moderate' for 4 items", () => {
    const items = [1, 2, 3, 4].map((h) => makeItem("2026-04-20", h));
    expect(getDayLoad(items, date)).toBe("moderate");
  });

  it("returns 'busy' for 5+ items", () => {
    const items = [1, 2, 3, 4, 5].map((h) => makeItem("2026-04-20", h));
    expect(getDayLoad(items, date)).toBe("busy");
  });

  it("ignores all-day items", () => {
    const allDay: CalendarItem = { ...makeItem("2026-04-20", 0), all_day: true };
    expect(getDayLoad([allDay, allDay, allDay, allDay, allDay], date)).toBe("empty");
  });

  it("ignores items on other dates", () => {
    const other = makeItem("2026-04-21", 9);
    expect(getDayLoad([other, other, other, other, other], date)).toBe("empty");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/lucamilletti/Desktop/personal_projects/life-tracking-app && npm test lib/utils.test.ts
```

Expected: FAIL with `getDayLoad is not a function` or similar.

- [ ] **Step 3: Implement `getDayLoad` in `lib/utils.ts`**

Add these lines to `lib/utils.ts` (keep existing `cn` function):

```ts
import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

import type { CalendarItem } from "./types";

export type DayLoad = "empty" | "light" | "moderate" | "busy";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDayLoad(items: CalendarItem[], date: Date): DayLoad {
  const dateStr = format(date, "yyyy-MM-dd");
  const count = items.filter(
    (item) => !item.all_day && item.start_datetime.startsWith(dateStr),
  ).length;
  if (count === 0) return "empty";
  if (count <= 2) return "light";
  if (count <= 4) return "moderate";
  return "busy";
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test lib/utils.test.ts
```

Expected: all 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/utils.ts lib/utils.test.ts
git commit -m "feat: add getDayLoad utility"
```

---

## Task 2: Add `DrawerState` type to `lib/types.ts`

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add the type**

Append to the end of `lib/types.ts`:

```ts
export type DrawerState =
  | { mode: "item"; item: CalendarItem }
  | { mode: "day"; date: Date }
  | null;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add DrawerState union type"
```

---

## Task 3: Update calendar page to use `DrawerState`

**Files:**
- Modify: `app/(app)/calendar/page.tsx`

- [ ] **Step 1: Replace `selectedItem` state and wire `DrawerState`**

Replace the entire contents of `app/(app)/calendar/page.tsx` with:

```tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { DayView } from "@/components/calendar/DayView";
import { MonthView } from "@/components/calendar/MonthView";
import { RightDrawer } from "@/components/calendar/RightDrawer";
import { WeekView } from "@/components/calendar/WeekView";
import { TodoForm } from "@/components/todos/TodoForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCalendarWeek } from "@/hooks/useCalendarWeek";
import { getServiceContext } from "@/lib/services/context";
import { todosService } from "@/lib/services/todos";
import type { CalendarItem, DrawerState, Todo } from "@/lib/types";

export default function CalendarPage() {
  const [view, setView] = useState<"week" | "day" | "month">("week");
  const calendar = useCalendarWeek(view);
  const [drawerState, setDrawerState] = useState<DrawerState>(null);
  const [newTodoSlot, setNewTodoSlot] = useState<{ date: Date; hour: number } | null>(null);

  function handleSlotClick(date: Date, hour: number) {
    setNewTodoSlot({ date, hour });
  }

  function handleItemClick(item: CalendarItem) {
    setDrawerState({ mode: "item", item });
  }

  function handleDayClick(date: Date) {
    setDrawerState({ mode: "day", date });
  }

  async function handleCreateTodo(data: Omit<Todo, "id" | "created_at" | "updated_at">) {
    const ctx = await getServiceContext();
    await todosService.create(ctx, data);
    setNewTodoSlot(null);
    calendar.refresh();
  }

  const dateLabel =
    view === "week"
      ? `${format(calendar.weekStart, "MMM d")} - ${format(calendar.weekEnd, "MMM d, yyyy")}`
      : view === "day"
        ? format(calendar.currentDate, "EEEE, MMM d, yyyy")
        : format(calendar.currentDate, "MMMM yyyy");

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={calendar.goToPrevPeriod}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={calendar.goToNextPeriod}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={calendar.goToToday}>
            Today
          </Button>
          <span className="ml-2 text-sm font-semibold text-neutral-700">{dateLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-neutral-200">
            {(["week", "day", "month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs capitalize transition-colors ${
                  view === v
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:bg-neutral-50"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            onClick={() => setNewTodoSlot({ date: calendar.currentDate, hour: 9 })}
          >
            + New
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {calendar.loading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
            Loading calendar...
          </div>
        ) : (
          <>
            {view === "week" && (
              <WeekView
                days={calendar.days}
                items={calendar.items}
                onItemClick={handleItemClick}
                onSlotClick={handleSlotClick}
                onDayClick={handleDayClick}
              />
            )}
            {view === "day" && (
              <DayView
                date={calendar.currentDate}
                items={calendar.items}
                onItemClick={handleItemClick}
              />
            )}
            {view === "month" && (
              <MonthView
                currentDate={calendar.currentDate}
                items={calendar.items}
                onItemClick={handleItemClick}
                onDateClick={(date) => {
                  calendar.setCurrentDate(date);
                  setView("day");
                }}
              />
            )}
          </>
        )}

        <RightDrawer
          drawerState={drawerState}
          allItems={calendar.items}
          onClose={() => setDrawerState(null)}
          onRefresh={calendar.refresh}
          onItemSelect={(item) => setDrawerState({ mode: "item", item })}
        />
      </div>

      <Dialog open={!!newTodoSlot} onOpenChange={(open) => !open && setNewTodoSlot(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New todo</DialogTitle>
          </DialogHeader>
          {newTodoSlot && (
            <TodoForm
              initial={newTodoSlot}
              onSubmit={handleCreateTodo}
              onCancel={() => setNewTodoSlot(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: errors on `RightDrawer` and `WeekView` (props not yet updated) — that's fine, they'll be fixed in Tasks 4 and 5.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/calendar/page.tsx
git commit -m "feat: replace selectedItem with DrawerState in calendar page"
```

---

## Task 4: Add load indicators and `onDayClick` to WeekView

**Files:**
- Modify: `components/calendar/WeekView.tsx`

- [ ] **Step 1: Replace the file contents**

Replace `components/calendar/WeekView.tsx` with:

```tsx
"use client";

import { format, isSameDay, parseISO } from "date-fns";

import { getDayLoad } from "@/lib/utils";
import type { CalendarItem } from "@/lib/types";

import { CalendarItemChip } from "./CalendarItem";
import { TimeColumn } from "./TimeColumn";

const HOUR_HEIGHT = 56;

const LOAD_DOT: Record<string, string> = {
  empty: "",
  light: "bg-sky-400",
  moderate: "bg-amber-400",
  busy: "bg-rose-400",
};

function timeToOffset(datetime: string): number {
  const d = parseISO(datetime);
  return (d.getHours() + d.getMinutes() / 60) * HOUR_HEIGHT;
}

function durationToHeight(start: string, end: string): number {
  const s = parseISO(start);
  const e = parseISO(end);
  const minutes = (e.getTime() - s.getTime()) / 60000;
  return Math.max((minutes / 60) * HOUR_HEIGHT, 20);
}

interface WeekViewProps {
  days: Date[];
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
  onSlotClick: (date: Date, hour: number) => void;
  onDayClick: (date: Date) => void;
}

export function WeekView({ days, items, onItemClick, onSlotClick, onDayClick }: WeekViewProps) {
  const today = new Date();

  return (
    <div className="flex flex-1 overflow-hidden">
      <TimeColumn />
      <div className="flex flex-1 overflow-x-auto">
        <div
          className="grid flex-1 overflow-y-auto"
          style={{ gridTemplateColumns: `repeat(${days.length}, minmax(120px, 1fr))` }}
        >
          {days.map((day) => {
            const load = getDayLoad(items, day);
            const dotClass = LOAD_DOT[load];

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onDayClick(day)}
                className="sticky top-0 z-10 flex h-10 w-full flex-col items-center justify-center border-b border-r border-neutral-200 bg-white hover:bg-neutral-50"
              >
                <span className="text-[10px] uppercase tracking-wide text-neutral-400">
                  {format(day, "EEE")}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    isSameDay(day, today)
                      ? "flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white"
                      : "text-neutral-700"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {dotClass && (
                  <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${dotClass}`} />
                )}
              </button>
            );
          })}

          {days.map((day) => {
            const dayItems = items.filter((item) => {
              const itemDate = parseISO(item.start_datetime);
              return isSameDay(itemDate, day) && !item.all_day;
            });

            return (
              <div
                key={`col-${day.toISOString()}`}
                className="relative border-r border-neutral-100"
                style={{ height: `${24 * HOUR_HEIGHT}px` }}
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <div
                    key={h}
                    className="absolute w-full border-t border-neutral-100"
                    style={{ top: h * HOUR_HEIGHT }}
                  />
                ))}

                {Array.from({ length: 24 }, (_, h) => (
                  <div
                    key={h}
                    className="absolute w-full cursor-pointer hover:bg-neutral-50/60"
                    style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    onClick={() => onSlotClick(day, h)}
                  />
                ))}

                {dayItems.map((item) => (
                  <CalendarItemChip
                    key={item.id}
                    item={item}
                    onClick={onItemClick}
                    style={{
                      top: timeToOffset(item.start_datetime),
                      height: durationToHeight(item.start_datetime, item.end_datetime),
                    }}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: only RightDrawer errors remain (will be fixed in Task 5).

- [ ] **Step 3: Commit**

```bash
git add components/calendar/WeekView.tsx
git commit -m "feat: add day load indicators and onDayClick to WeekView"
```

---

## Task 5: Add day-mode branch to RightDrawer

**Files:**
- Modify: `components/calendar/RightDrawer.tsx`

- [ ] **Step 1: Replace the file contents**

Replace `components/calendar/RightDrawer.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { CheckCircle, SkipForward, X } from "lucide-react";

import { LogForm } from "@/components/logs/LogForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SKIPPED_LOG_NOTE } from "@/lib/habit-status";
import { habitsService } from "@/lib/services/habits";
import { goalsService } from "@/lib/services/goals";
import { getServiceContext } from "@/lib/services/context";
import { logsService } from "@/lib/services/logs";
import { todosService } from "@/lib/services/todos";
import { calculateGoalProgress } from "@/lib/goal-calculations";
import type { CalendarItem, DrawerState, Goal, Habit, LogEntry } from "@/lib/types";

interface RightDrawerProps {
  drawerState: DrawerState;
  allItems: CalendarItem[];
  onClose: () => void;
  onRefresh: () => void;
  onItemSelect: (item: CalendarItem) => void;
}

export function RightDrawer({
  drawerState,
  allItems,
  onClose,
  onRefresh,
  onItemSelect,
}: RightDrawerProps) {
  if (!drawerState) return null;

  if (drawerState.mode === "day") {
    return (
      <DayDrawer
        date={drawerState.date}
        allItems={allItems}
        onClose={onClose}
        onRefresh={onRefresh}
        onItemSelect={onItemSelect}
      />
    );
  }

  return (
    <ItemDrawer
      item={drawerState.item}
      onClose={onClose}
      onRefresh={onRefresh}
    />
  );
}

// --- Day Drawer ---

interface DayDrawerProps {
  date: Date;
  allItems: CalendarItem[];
  onClose: () => void;
  onRefresh: () => void;
  onItemSelect: (item: CalendarItem) => void;
}

function DayDrawer({ date, allItems, onClose, onRefresh, onItemSelect }: DayDrawerProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const dayItems = allItems
    .filter((item) => !item.all_day && isSameDay(parseISO(item.start_datetime), date))
    .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));

  const completedCount = dayItems.filter((i) => i.status === "complete").length;
  const dateStr = format(date, "yyyy-MM-dd");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const ctx = await getServiceContext();
        const [goalRows, logRows] = await Promise.all([
          goalsService.list(ctx),
          logsService.forDateRange(ctx, dateStr, dateStr),
        ]);
        if (!cancelled) {
          setGoals(goalRows);
          setLogs(logRows);
        }
      } catch {
        // non-critical, leave empty
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [dateStr]);

  async function handleComplete(item: CalendarItem) {
    setSubmitting(item.id);
    try {
      const ctx = await getServiceContext();
      if (item.kind === "todo") {
        await todosService.update(ctx, item.id, { status: "complete" });
      } else if (item.source_habit_id) {
        await logsService.create(ctx, {
          entry_date: dateStr,
          entry_datetime: new Date().toISOString(),
          source_type: "habit",
          source_id: item.source_habit_id,
          numeric_value: 1,
          unit: undefined,
          note: undefined,
        });
      }
      onRefresh();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(null);
    }
  }

  async function handleSkip(item: CalendarItem) {
    setSubmitting(item.id);
    try {
      const ctx = await getServiceContext();
      if (item.kind === "todo") {
        await todosService.update(ctx, item.id, { status: "skipped" });
      } else if (item.source_habit_id) {
        await logsService.create(ctx, {
          entry_date: dateStr,
          entry_datetime: new Date().toISOString(),
          source_type: "habit",
          source_id: item.source_habit_id,
          numeric_value: 0,
          unit: undefined,
          note: SKIPPED_LOG_NOTE,
        });
      }
      onRefresh();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <aside className="flex h-full w-80 flex-col border-l border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">
            {format(date, "EEEE, MMM d")}
          </p>
          {dayItems.length > 0 && (
            <p className="text-xs text-neutral-400">
              {completedCount} / {dayItems.length} done
            </p>
          )}
        </div>
        <button onClick={onClose} className="rounded p-1 hover:bg-neutral-100">
          <X className="h-4 w-4 text-neutral-500" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {dayItems.length === 0 ? (
          <p className="text-sm text-neutral-400">
            Nothing scheduled — click a time slot to add.
          </p>
        ) : (
          <div className="space-y-2">
            {dayItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-neutral-100 bg-neutral-50 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    className="text-left text-sm font-medium text-neutral-800 hover:underline"
                    onClick={() => onItemSelect(item)}
                  >
                    {item.title}
                  </button>
                  <Badge
                    variant={
                      item.status === "complete"
                        ? "default"
                        : item.status === "skipped"
                          ? "secondary"
                          : "outline"
                    }
                    className="shrink-0 text-[10px]"
                  >
                    {item.status}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-neutral-400">
                  {format(parseISO(item.start_datetime), "h:mm a")}
                </p>
                {item.status === "pending" && (
                  <div className="mt-2 flex gap-1.5">
                    {item.requires_numeric_log ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={() => onItemSelect(item)}
                      >
                        Log
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          className="h-6 gap-1 px-2 text-xs"
                          onClick={() => handleComplete(item)}
                          disabled={submitting === item.id}
                        >
                          <CheckCircle className="h-3 w-3" />
                          {submitting === item.id ? "..." : "Done"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 gap-1 px-2 text-xs"
                          onClick={() => handleSkip(item)}
                          disabled={submitting === item.id}
                        >
                          <SkipForward className="h-3 w-3" />
                          Skip
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {goals.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
              Active goals
            </p>
            <div className="space-y-2">
              {goals.map((goal) => {
                const progress = calculateGoalProgress(goal, logs);
                return (
                  <div key={goal.id} className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-neutral-700">{goal.title}</p>
                    <span
                      className={`shrink-0 text-xs font-medium ${
                        progress.is_on_track ? "text-emerald-600" : "text-rose-500"
                      }`}
                    >
                      {progress.percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// --- Item Drawer (existing behavior, unchanged logic) ---

interface ItemDrawerProps {
  item: CalendarItem;
  onClose: () => void;
  onRefresh: () => void;
}

function ItemDrawer({ item, onClose, onRefresh }: ItemDrawerProps) {
  const [habit, setHabit] = useState<Habit | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!item.source_habit_id) {
        setHabit(undefined);
        return;
      }
      try {
        const ctx = await getServiceContext();
        const h = await habitsService.get(ctx, item.source_habit_id);
        if (!cancelled) setHabit(h);
      } catch (error) {
        if (!cancelled) {
          setHabit(undefined);
          console.error(error);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [item.source_habit_id]);

  const selectedDate = format(parseISO(item.start_datetime), "yyyy-MM-dd");

  async function handleComplete() {
    setSubmitting(true);
    try {
      const ctx = await getServiceContext();
      if (item.kind === "todo") {
        await todosService.update(ctx, item.id, { status: "complete" });
      } else if (item.source_habit_id) {
        await logsService.create(ctx, {
          entry_date: selectedDate,
          entry_datetime: new Date().toISOString(),
          source_type: "habit",
          source_id: item.source_habit_id,
          numeric_value: 1,
          unit: habit?.unit,
          note: undefined,
        });
      }
      onRefresh();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    setSubmitting(true);
    try {
      const ctx = await getServiceContext();
      if (item.kind === "todo") {
        await todosService.update(ctx, item.id, { status: "skipped" });
      } else if (item.source_habit_id) {
        await logsService.create(ctx, {
          entry_date: selectedDate,
          entry_datetime: new Date().toISOString(),
          source_type: "habit",
          source_id: item.source_habit_id,
          numeric_value: 0,
          unit: habit?.unit,
          note: SKIPPED_LOG_NOTE,
        });
      }
      onRefresh();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLog(value: number, note?: string) {
    setSubmitting(true);
    try {
      const ctx = await getServiceContext();
      await logsService.create(ctx, {
        entry_date: selectedDate,
        entry_datetime: new Date().toISOString(),
        source_type: item.kind === "habit_occurrence" ? "habit" : "todo",
        source_id: item.source_habit_id ?? item.id,
        numeric_value: value,
        unit: habit?.unit,
        note,
      });
      if (item.kind === "todo") {
        await todosService.update(ctx, item.id, { status: "complete" });
      }
      onRefresh();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <aside className="flex h-full w-80 flex-col border-l border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <span className="text-sm font-semibold text-neutral-900">{item.title}</span>
        <button onClick={onClose} className="rounded p-1 hover:bg-neutral-100">
          <X className="h-4 w-4 text-neutral-500" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="flex items-center gap-2">
          <Badge variant={item.kind === "habit_occurrence" ? "secondary" : "outline"}>
            {item.kind === "habit_occurrence" ? "Habit" : "Todo"}
          </Badge>
          <span className="text-xs text-neutral-400">
            {format(parseISO(item.start_datetime), "h:mm a")} -{" "}
            {format(parseISO(item.end_datetime), "h:mm a")}
          </span>
        </div>

        {item.requires_numeric_log && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
              Log value
            </p>
            <LogForm unit={habit?.unit} onSubmit={handleLog} />
          </div>
        )}

        {!item.requires_numeric_log && item.status === "pending" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              onClick={handleComplete}
              disabled={submitting}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              {submitting ? "Saving..." : "Complete"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 gap-1.5"
              onClick={handleSkip}
              disabled={submitting}
            >
              <SkipForward className="h-3.5 w-3.5" /> Skip
            </Button>
          </div>
        )}

        {item.status === "complete" && (
          <p className="text-sm text-emerald-600">Completed</p>
        )}
        {item.status === "skipped" && (
          <p className="text-sm text-neutral-500">Skipped</p>
        )}
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles with no errors**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Run tests to ensure nothing broke**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Manual smoke test**

```bash
npm run dev
```

1. Open http://localhost:3000/calendar
2. Click a day column header → RightDrawer opens showing day overview
3. Confirm completion summary shows correct counts
4. Confirm colored dot appears for days with items (sky=1-2, amber=3-4, rose=5+)
5. Confirm empty days show no dot
6. Click an item title in day drawer → switches to item detail mode
7. Click a calendar chip directly → item detail mode still works (no regression)

- [ ] **Step 5: Commit**

```bash
git add components/calendar/RightDrawer.tsx
git commit -m "feat: add day-mode drawer with item list and goal progress"
```

---

## Task 6 (Stretch B): Install `@dnd-kit/core`

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install the package**

```bash
npm install @dnd-kit/core
```

Expected: `@dnd-kit/core` appears in `package.json` dependencies.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @dnd-kit/core for drag-and-drop"
```

---

## Task 7 (Stretch B): Add drag-and-drop to WeekView (todos only)

**Files:**
- Modify: `components/calendar/WeekView.tsx`
- Modify: `components/calendar/CalendarItem.tsx`
- Modify: `app/(app)/calendar/page.tsx`

- [ ] **Step 1: Make `CalendarItemChip` conditionally draggable**

Replace `components/calendar/CalendarItem.tsx` with:

```tsx
import type { CSSProperties } from "react";
import { useDraggable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";
import type { CalendarItem as CalendarItemType } from "@/lib/types";

interface CalendarItemProps {
  item: CalendarItemType;
  onClick: (item: CalendarItemType) => void;
  style?: CSSProperties;
  draggable?: boolean;
}

export function CalendarItemChip({ item, onClick, style, draggable = false }: CalendarItemProps) {
  const isHabit = item.kind === "habit_occurrence";
  const isDone = item.status === "complete";
  const isSkipped = item.status === "skipped";

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled: !draggable,
    data: { item },
  });

  const dragStyle: CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {};

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onClick(item)}
      style={{ ...style, ...dragStyle, opacity: isDragging ? 0.4 : 1 }}
      className={cn(
        "absolute left-0.5 right-0.5 overflow-hidden rounded-md px-2 py-1 text-left text-xs font-medium transition-colors",
        isHabit
          ? "border border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100"
          : "border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",
        isDone && "line-through opacity-50",
        isSkipped && "border-dashed opacity-60",
        draggable && !isHabit && "cursor-grab active:cursor-grabbing",
      )}
      {...(draggable ? { ...attributes, ...listeners } : {})}
    >
      <span className="truncate">{item.title}</span>
    </button>
  );
}
```

- [ ] **Step 2: Update WeekView with `DndContext`, `useDroppable` slots, and `DragOverlay`**

Replace `components/calendar/WeekView.tsx` with:

```tsx
"use client";

import { format, isSameDay, parseISO } from "date-fns";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";

import { getDayLoad } from "@/lib/utils";
import type { CalendarItem } from "@/lib/types";

import { CalendarItemChip } from "./CalendarItem";
import { TimeColumn } from "./TimeColumn";

const HOUR_HEIGHT = 56;

const LOAD_DOT: Record<string, string> = {
  empty: "",
  light: "bg-sky-400",
  moderate: "bg-amber-400",
  busy: "bg-rose-400",
};

function timeToOffset(datetime: string): number {
  const d = parseISO(datetime);
  return (d.getHours() + d.getMinutes() / 60) * HOUR_HEIGHT;
}

function durationToHeight(start: string, end: string): number {
  const s = parseISO(start);
  const e = parseISO(end);
  const minutes = (e.getTime() - s.getTime()) / 60000;
  return Math.max((minutes / 60) * HOUR_HEIGHT, 20);
}

function slotId(date: Date, hour: number): string {
  return `slot-${format(date, "yyyy-MM-dd")}-${hour}`;
}

interface SlotProps {
  date: Date;
  hour: number;
  onClick: () => void;
}

function DroppableSlot({ date, hour, onClick }: SlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id: slotId(date, hour) });
  return (
    <div
      ref={setNodeRef}
      className={`absolute w-full cursor-pointer ${isOver ? "bg-blue-50/80" : "hover:bg-neutral-50/60"}`}
      style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
      onClick={onClick}
    />
  );
}

interface WeekViewProps {
  days: Date[];
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
  onSlotClick: (date: Date, hour: number) => void;
  onDayClick: (date: Date) => void;
  onReschedule: (itemId: string, newStart: string, newEnd: string) => void;
}

export function WeekView({
  days,
  items,
  onItemClick,
  onSlotClick,
  onDayClick,
  onReschedule,
}: WeekViewProps) {
  const today = new Date();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const draggedItem = items.find((i) => i.id === active.id);
    if (!draggedItem || draggedItem.kind !== "todo") return;

    const overId = String(over.id);
    const match = overId.match(/^slot-(\d{4}-\d{2}-\d{2})-(\d+)$/);
    if (!match) return;

    const [, dateStr, hourStr] = match;
    const newHour = parseInt(hourStr, 10);

    const originalStart = parseISO(draggedItem.start_datetime);
    const originalEnd = parseISO(draggedItem.end_datetime);
    const durationMs = originalEnd.getTime() - originalStart.getTime();

    const newStart = new Date(`${dateStr}T${String(newHour).padStart(2, "0")}:00:00`);
    const newEnd = new Date(newStart.getTime() + durationMs);

    onReschedule(
      draggedItem.id,
      newStart.toISOString(),
      newEnd.toISOString(),
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-1 overflow-hidden">
        <TimeColumn />
        <div className="flex flex-1 overflow-x-auto">
          <div
            className="grid flex-1 overflow-y-auto"
            style={{ gridTemplateColumns: `repeat(${days.length}, minmax(120px, 1fr))` }}
          >
            {days.map((day) => {
              const load = getDayLoad(items, day);
              const dotClass = LOAD_DOT[load];

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => onDayClick(day)}
                  className="sticky top-0 z-10 flex h-10 w-full flex-col items-center justify-center border-b border-r border-neutral-200 bg-white hover:bg-neutral-50"
                >
                  <span className="text-[10px] uppercase tracking-wide text-neutral-400">
                    {format(day, "EEE")}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      isSameDay(day, today)
                        ? "flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white"
                        : "text-neutral-700"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {dotClass && (
                    <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${dotClass}`} />
                  )}
                </button>
              );
            })}

            {days.map((day) => {
              const dayItems = items.filter((item) => {
                const itemDate = parseISO(item.start_datetime);
                return isSameDay(itemDate, day) && !item.all_day;
              });

              return (
                <div
                  key={`col-${day.toISOString()}`}
                  className="relative border-r border-neutral-100"
                  style={{ height: `${24 * HOUR_HEIGHT}px` }}
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <div
                      key={h}
                      className="absolute w-full border-t border-neutral-100"
                      style={{ top: h * HOUR_HEIGHT }}
                    />
                  ))}

                  {Array.from({ length: 24 }, (_, h) => (
                    <DroppableSlot
                      key={h}
                      date={day}
                      hour={h}
                      onClick={() => onSlotClick(day, h)}
                    />
                  ))}

                  {dayItems.map((item) => (
                    <CalendarItemChip
                      key={item.id}
                      item={item}
                      onClick={onItemClick}
                      draggable={item.kind === "todo"}
                      style={{
                        top: timeToOffset(item.start_datetime),
                        height: durationToHeight(item.start_datetime, item.end_datetime),
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <DragOverlay>
        {/* Ghost chip is rendered by @dnd-kit automatically via the draggable transform */}
      </DragOverlay>
    </DndContext>
  );
}
```

- [ ] **Step 3: Add `onReschedule` handler to calendar page**

In `app/(app)/calendar/page.tsx`, add the `handleReschedule` function and pass it to `WeekView`.

Add this function inside `CalendarPage`, after `handleDayClick`:

```tsx
async function handleReschedule(itemId: string, newStart: string, newEnd: string) {
  const ctx = await getServiceContext();
  await todosService.update(ctx, itemId, {
    start_datetime: newStart,
    end_datetime: newEnd,
  });
  calendar.refresh();
}
```

Update the `WeekView` JSX to include the new prop:

```tsx
{view === "week" && (
  <WeekView
    days={calendar.days}
    items={calendar.items}
    onItemClick={handleItemClick}
    onSlotClick={handleSlotClick}
    onDayClick={handleDayClick}
    onReschedule={handleReschedule}
  />
)}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Manual smoke test**

```bash
npm run dev
```

1. Open http://localhost:3000/calendar
2. Create a todo in any slot
3. Drag the todo chip to a different day or time slot
4. Verify it moves to the new position and the calendar refreshes
5. Confirm habit chips cannot be dragged (cursor stays default)
6. Confirm day header click still works during/after drag

- [ ] **Step 6: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add components/calendar/WeekView.tsx components/calendar/CalendarItem.tsx app/\(app\)/calendar/page.tsx
git commit -m "feat: add drag-and-drop rescheduling for todos"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Day load indicators: Task 4 adds `getDayLoad` (Task 1) + dot rendering in WeekView header
- ✅ `DrawerState` union: Task 2 adds type, Task 3 wires it in page
- ✅ `onDayClick` on column header: Task 4
- ✅ Day-mode drawer: Task 5 — item list, completion summary, active goals panel, empty state
- ✅ Item list click → switches to item mode: `onItemSelect` in DayDrawer
- ✅ Inline complete/skip for non-log items: Task 5 `handleComplete`/`handleSkip`
- ✅ "Log" button → switches to item mode for log-required items: Task 5
- ✅ Drag-and-drop todos only: Tasks 6–7
- ✅ Habit chips non-draggable: `draggable={item.kind === "todo"}` in Task 7

**Placeholder scan:** No TBDs, TODOs, or vague steps found.

**Type consistency:**
- `DrawerState` defined in `lib/types.ts` (Task 2), used in `page.tsx` (Task 3) and `RightDrawer.tsx` (Task 5) ✅
- `getDayLoad` signature: `(items: CalendarItem[], date: Date) => DayLoad` — consistent across Tasks 1 and 4 ✅
- `onReschedule: (itemId: string, newStart: string, newEnd: string) => void` — consistent between Task 7 WeekView props and page handler ✅
- `slotId` format `slot-{yyyy-MM-dd}-{h}` — regex in `handleDragEnd` matches this format ✅
