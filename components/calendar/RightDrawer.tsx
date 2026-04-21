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

// --- Item Drawer (existing behavior) ---

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
