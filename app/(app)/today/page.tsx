"use client";

import { useEffect, useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";

import { LogForm } from "@/components/logs/LogForm";
import { TopBar } from "@/components/layout/TopBar";
import { TodayGoalSnapshot } from "@/components/today/TodayGoalSnapshot";
import { TodayHabitList } from "@/components/today/TodayHabitList";
import { TodayHeader } from "@/components/today/TodayHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildTodaySnapshot } from "@/lib/today-snapshot";
import { getServiceContext } from "@/lib/services/context";
import { goalsService } from "@/lib/services/goals";
import { habitsService } from "@/lib/services/habits";
import { habitStacksService } from "@/lib/services/habit-stacks";
import { logsService } from "@/lib/services/logs";
import { todosService } from "@/lib/services/todos";
import type {
  Goal,
  Habit,
  HabitGoalLink,
  HabitStack,
  LogEntry,
  Todo,
  TodoGoalLink,
} from "@/lib/types";

export default function TodayPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [links, setLinks] = useState<HabitGoalLink[]>([]);
  const [todoLinks, setTodoLinks] = useState<TodoGoalLink[]>([]);
  const [habitStacks, setHabitStacks] = useState<HabitStack[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyHabitId, setBusyHabitId] = useState<string | null>(null);
  const [loggingHabitId, setLoggingHabitId] = useState<string | null>(null);

  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const ctx = await getServiceContext();
        const since = format(subDays(new Date(), 365), "yyyy-MM-dd");
        const [habitRows, todoRows, goalRows, linkRows, todoLinkRows, stackRows, logRows] = await Promise.all([
          habitsService.list(ctx),
          todosService.list(ctx),
          goalsService.list(ctx),
          habitsService.listGoalLinks(ctx),
          todosService.listGoalLinks(ctx),
          habitStacksService.list(ctx),
          logsService.list(ctx, { since }),
        ]);

        if (!cancelled) {
          setHabits(habitRows);
          setTodos(todoRows);
          setGoals(goalRows);
          setLinks(linkRows);
          setTodoLinks(todoLinkRows);
          setHabitStacks(stackRows);
          setLogs(logRows);
        }
      } catch (error) {
        if (!cancelled) {
          setHabits([]);
          setTodos([]);
          setGoals([]);
          setLinks([]);
          setTodoLinks([]);
          setHabitStacks([]);
          setLogs([]);
          console.error(error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshData() {
    const ctx = await getServiceContext();
    const since = format(subDays(new Date(), 365), "yyyy-MM-dd");
    const [habitRows, todoRows, linkRows, todoLinkRows, stackRows, logRows] = await Promise.all([
      habitsService.list(ctx),
      todosService.list(ctx),
      habitsService.listGoalLinks(ctx),
      todosService.listGoalLinks(ctx),
      habitStacksService.list(ctx),
      logsService.list(ctx, { since }),
    ]);

    setHabits(habitRows);
    setTodos(todoRows);
    setLinks(linkRows);
    setTodoLinks(todoLinkRows);
    setHabitStacks(stackRows);
    setLogs(logRows);
  }

  const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 100];

  async function handleQuickComplete(habitId: string) {
    const habit = habits.find((row) => row.id === habitId);
    if (!habit) return;

    // Capture streak before completing for milestone detection
    const allItems = [
      ...snapshot.habitGroups.morning,
      ...snapshot.habitGroups.afternoon,
      ...snapshot.habitGroups.evening,
      ...snapshot.habitGroups.anytime,
    ];
    const prevStreak = allItems.find((item) => item.habit.id === habitId)?.currentStreak ?? 0;

    setBusyHabitId(habitId);
    try {
      const ctx = await getServiceContext();
      await logsService.create(ctx, {
        entry_date: today,
        entry_datetime: new Date().toISOString(),
        source_type: "habit",
        source_id: habit.id,
        numeric_value: 1,
        unit: habit.unit,
        note: undefined,
      });
      await refreshData();

      const newStreak = prevStreak + 1;
      if (STREAK_MILESTONES.includes(newStreak)) {
        toast(`🔥 ${newStreak}-day streak!`, {
          description: habit.title,
          duration: 4000,
        });
      } else {
        toast.success(`${habit.title} logged`, { duration: 2000 });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to log habit");
    } finally {
      setBusyHabitId(null);
    }
  }

  async function handleQuickLog(value: number, note?: string) {
    const habit = habits.find((row) => row.id === loggingHabitId);
    if (!habit) return;

    setBusyHabitId(habit.id);
    try {
      const ctx = await getServiceContext();
      await logsService.create(ctx, {
        entry_date: today,
        entry_datetime: new Date().toISOString(),
        source_type: "habit",
        source_id: habit.id,
        numeric_value: value,
        unit: habit.unit,
        note,
      });
      await refreshData();
      setLoggingHabitId(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save log");
    } finally {
      setBusyHabitId(null);
    }
  }

  const snapshot = useMemo(
    () =>
      buildTodaySnapshot({
        habits,
        todos,
        goals,
        logs,
        habitGoalLinks: links,
        todoGoalLinks: todoLinks,
        habitStacks,
        today,
      }),
    [goals, habitStacks, habits, links, logs, today, todoLinks, todos],
  );

  const loggingHabit = loggingHabitId ? habits.find((habit) => habit.id === loggingHabitId) : undefined;
  if (loading) {
    return (
      <div className="flex-1 p-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="h-44 animate-pulse rounded-[28px] bg-surface" />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
            <div className="h-[28rem] animate-pulse rounded-[24px] bg-surface" />
            <div className="space-y-6">
              <div className="h-44 animate-pulse rounded-[24px] bg-surface" />
              <div className="h-52 animate-pulse rounded-[24px] bg-surface" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <TopBar
        title="Today"
        eyebrow="Overview"
        subtitle="Your rhythm, goals and the small wins that compound."
      />
      <div className="scroll-seamless flex-1">
        <div className="mx-auto max-w-5xl px-8 pb-24 pt-12">
          <TodayHeader
            today={today}
            totalHabits={snapshot.summary.totalHabits}
            completedHabits={snapshot.summary.completedHabits}
            habitsWithActiveStreak={snapshot.summary.habitsWithActiveStreak}
          />

          <div className="mt-14 grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
            <section className="surface-card-elevated p-6">
              <TodayHabitList
                groups={snapshot.habitGroups}
                busyHabitId={busyHabitId}
                onQuickComplete={(habitId) => void handleQuickComplete(habitId)}
                onQuickLog={setLoggingHabitId}
              />
            </section>

            <div className="space-y-6">
              <section className="surface-card p-5">
                <div className="mb-5 flex items-baseline justify-between">
                  <h3 className="text-display-sm text-[20px] text-ink">Todos</h3>
                  <span className="text-eyebrow">Today</span>
                </div>
                {snapshot.todosToday.length === 0 ? (
                  <p className="text-[13px] text-ink-subtle">Nothing on the list.</p>
                ) : (
                  <ul className="divide-y divide-hairline">
                    {snapshot.todosToday.map((todo) => (
                      <li
                        key={todo.id}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <p className="truncate text-[14px] text-ink">{todo.title}</p>
                        <span className="text-eyebrow">{todo.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="surface-card p-5">
                <TodayGoalSnapshot goalProgress={snapshot.goalProgress} />
              </section>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(loggingHabitId)} onOpenChange={(next) => { if (!next) setLoggingHabitId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick log</DialogTitle>
          </DialogHeader>
          {loggingHabit && (
            <LogForm
              trackingType={loggingHabit.tracking_type}
              unit={loggingHabit.unit}
              onSubmit={(value, note) => void handleQuickLog(value, note)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
