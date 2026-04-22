"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

import { LogForm } from "@/components/logs/LogForm";
import { TopBar } from "@/components/layout/TopBar";
import { TodayGoalSnapshot } from "@/components/today/TodayGoalSnapshot";
import { TodayHabitList } from "@/components/today/TodayHabitList";
import { TodayHeader } from "@/components/today/TodayHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildTodaySnapshot } from "@/lib/today-snapshot";
import { goalsService } from "@/lib/services/goals";
import { habitsService } from "@/lib/services/habits";
import { habitStacksService } from "@/lib/services/habit-stacks";
import { logsService } from "@/lib/services/logs";
import { todosService } from "@/lib/services/todos";
import type { CalendarItem, Goal, Habit, HabitGoalLink, HabitStack, LogEntry, Todo } from "@/lib/types";

export default function TodayPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [links, setLinks] = useState<HabitGoalLink[]>([]);
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
        const [habitRows, todoRows, goalRows, linkRows, stackRows, logRows] = await Promise.all([
          habitsService.list(),
          todosService.list(),
          goalsService.list(),
          habitsService.listGoalLinks(),
          habitStacksService.list(),
          logsService.list(),
        ]);

        if (!cancelled) {
          setHabits(habitRows);
          setTodos(todoRows);
          setGoals(goalRows);
          setLinks(linkRows);
          setHabitStacks(stackRows);
          setLogs(logRows);
        }
      } catch (error) {
        if (!cancelled) {
          setHabits([]);
          setTodos([]);
          setGoals([]);
          setLinks([]);
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
    const [habitRows, todoRows, linkRows, stackRows, logRows] = await Promise.all([
      habitsService.list(),
      todosService.list(),
      habitsService.listGoalLinks(),
      habitStacksService.list(),
      logsService.list(),
    ]);

    setHabits(habitRows);
    setTodos(todoRows);
    setLinks(linkRows);
    setHabitStacks(stackRows);
    setLogs(logRows);
  }

  async function handleQuickComplete(habitId: string) {
    const habit = habits.find((row) => row.id === habitId);
    if (!habit) return;

    setBusyHabitId(habitId);
    try {
      await logsService.create({
        entry_date: today,
        entry_datetime: new Date().toISOString(),
        source_type: "habit",
        source_id: habit.id,
        numeric_value: 1,
        unit: habit.unit,
        note: undefined,
      });
      await refreshData();
    } catch (error) {
      console.error(error);
    } finally {
      setBusyHabitId(null);
    }
  }

  async function handleQuickLog(value: number, note?: string) {
    const habit = habits.find((row) => row.id === loggingHabitId);
    if (!habit) return;

    setBusyHabitId(habit.id);
    try {
      await logsService.create({
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
        habitStacks,
        today,
      }),
    [goals, habitStacks, habits, links, logs, today, todos],
  );

  const loggingHabit = loggingHabitId ? habits.find((habit) => habit.id === loggingHabitId) : undefined;
  const logItem: CalendarItem | null = loggingHabit
    ? {
        id: `habit-${loggingHabit.id}-${today}`,
        title: loggingHabit.title,
        start_datetime: `${today}T08:00:00`,
        end_datetime: `${today}T08:30:00`,
        all_day: false,
        kind: "habit_occurrence",
        status: "pending",
        source_habit_id: loggingHabit.id,
        requires_numeric_log: true,
        linked_goal_ids: [],
      }
    : null;

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="h-24 animate-pulse rounded-xl bg-neutral-100" />
      </div>
    );
  }

  return (
    <>
      <TopBar title="Today" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <TodayHeader
            today={today}
            totalHabits={snapshot.summary.totalHabits}
            completedHabits={snapshot.summary.completedHabits}
            habitsWithActiveStreak={snapshot.summary.habitsWithActiveStreak}
          />

          <TodayHabitList
            groups={snapshot.habitGroups}
            busyHabitId={busyHabitId}
            onQuickComplete={(habitId) => void handleQuickComplete(habitId)}
            onQuickLog={setLoggingHabitId}
          />

          <section className="rounded-xl border border-neutral-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-neutral-900">Today todos</h3>
            {snapshot.todosToday.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-400">No todos scheduled for today.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {snapshot.todosToday.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-100 p-3"
                  >
                    <p className="text-sm text-neutral-800">{todo.title}</p>
                    <span className="text-xs capitalize text-neutral-500">{todo.status}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <TodayGoalSnapshot goalProgress={snapshot.goalProgress} />
        </div>
      </div>

      <Dialog open={Boolean(loggingHabitId)} onOpenChange={(next) => { if (!next) setLoggingHabitId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick log</DialogTitle>
          </DialogHeader>
          {logItem && loggingHabit && (
            <LogForm
              item={logItem}
              unit={loggingHabit.unit}
              onSubmit={(value, note) => void handleQuickLog(value, note)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
