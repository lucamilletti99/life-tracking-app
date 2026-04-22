"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

import { HabitCard } from "@/components/habits/HabitCard";
import { HabitHeatmap } from "@/components/habits/HabitHeatmap";
import { HabitForm } from "@/components/habits/HabitForm";
import { LogForm } from "@/components/logs/LogForm";
import { TopBar } from "@/components/layout/TopBar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  buildHabitHeatmap,
  computeHabitCompletionRate,
  getHabitTodayState,
  type HabitTodayState,
} from "@/lib/habit-insights";
import { groupHabitsByGoal } from "@/lib/habit-grouping";
import { goalsService } from "@/lib/services/goals";
import { habitsService } from "@/lib/services/habits";
import { logsService } from "@/lib/services/logs";
import { computeStreak } from "@/lib/streak";
import type { CalendarItem, Goal, Habit, HabitGoalLink, LogEntry } from "@/lib/types";

const habitExamples = [
  {
    title: "Morning weigh-in",
    details: "Tracking: measurement (lbs) · Recurrence: daily",
  },
  {
    title: "Read 30 pages",
    details: "Tracking: numeric (pages) · Recurrence: weekdays",
  },
  {
    title: "Log spending",
    details: "Tracking: amount (USD) · Recurrence: daily",
  },
];

interface HabitInsight {
  status: HabitTodayState;
  currentStreak: number;
  completionRate30d: number;
  linkedGoalTitles: string[];
  heatmap: ReturnType<typeof buildHabitHeatmap>;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [links, setLinks] = useState<HabitGoalLink[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [loggingHabitId, setLoggingHabitId] = useState<string | null>(null);
  const [quickActionHabitId, setQuickActionHabitId] = useState<string | null>(null);
  const [expandedHeatmapByHabitId, setExpandedHeatmapByHabitId] = useState<Record<string, boolean>>({});

  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [habitRows, goalRows, linkRows, logRows] = await Promise.all([
          habitsService.list(),
          goalsService.list(),
          habitsService.listGoalLinks(),
          logsService.list(),
        ]);

        if (!cancelled) {
          setHabits(habitRows);
          setGoals(goalRows);
          setLinks(linkRows);
          setLogs(logRows);
        }
      } catch (error) {
        if (!cancelled) {
          setHabits([]);
          setGoals([]);
          setLinks([]);
          setLogs([]);
          console.error(error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshHabitsData() {
    const [habitRows, linkRows, logRows] = await Promise.all([
      habitsService.list(),
      habitsService.listGoalLinks(),
      logsService.list(),
    ]);
    setHabits(habitRows);
    setLinks(linkRows);
    setLogs(logRows);
  }

  async function handleCreate(data: Omit<Habit, "id" | "created_at" | "updated_at">) {
    await habitsService.create(data);
    await refreshHabitsData();
    setOpen(false);
  }

  async function handleAutoSaveHabit(id: string, data: Omit<Habit, "id" | "created_at" | "updated_at">) {
    await habitsService.update(id, data);
    await refreshHabitsData();
  }

  async function handleQuickComplete(habit: Habit) {
    setQuickActionHabitId(habit.id);
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
      await refreshHabitsData();
    } catch (error) {
      console.error(error);
    } finally {
      setQuickActionHabitId(null);
    }
  }

  async function handleQuickLog(value: number, note?: string) {
    const habit = habits.find((row) => row.id === loggingHabitId);
    if (!habit) return;

    setQuickActionHabitId(habit.id);
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
      await refreshHabitsData();
      setLoggingHabitId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setQuickActionHabitId(null);
    }
  }

  async function handleTogglePause(habit: Habit) {
    setQuickActionHabitId(habit.id);
    try {
      await habitsService.update(habit.id, {
        is_paused: !habit.is_paused,
      });
      await refreshHabitsData();
    } catch (error) {
      console.error(error);
    } finally {
      setQuickActionHabitId(null);
    }
  }

  const grouped = useMemo(
    () => groupHabitsByGoal({ goals, habits, links }),
    [goals, habits, links],
  );

  const goalTitleById = useMemo(
    () => new Map(goals.map((goal) => [goal.id, goal.title])),
    [goals],
  );

  const habitInsights = useMemo(() => {
    const goalIdsByHabitId = new Map<string, string[]>();

    for (const link of links) {
      const current = goalIdsByHabitId.get(link.habit_id) ?? [];
      goalIdsByHabitId.set(link.habit_id, [...current, link.goal_id]);
    }

    const insights = new Map<string, HabitInsight>();

    for (const habit of habits) {
      const status = getHabitTodayState(habit, logs, today);
      const streak = computeStreak(
        habit.id,
        habit.recurrence_type,
        habit.recurrence_config,
        logs,
        today,
      );
      const completionRate30d = computeHabitCompletionRate(habit, logs, today, 30);
      const linkedGoalTitles = (goalIdsByHabitId.get(habit.id) ?? [])
        .map((goalId) => goalTitleById.get(goalId))
        .filter((title): title is string => Boolean(title));

      insights.set(habit.id, {
        status,
        currentStreak: streak.current,
        completionRate30d,
        linkedGoalTitles,
        heatmap: buildHabitHeatmap(habit.id, logs, today),
      });
    }

    return insights;
  }, [goalTitleById, habits, links, logs, today]);

  const editingHabit = editingHabitId ? habits.find((h) => h.id === editingHabitId) : undefined;
  const loggingHabit = loggingHabitId ? habits.find((h) => h.id === loggingHabitId) : undefined;

  const logFormItem: CalendarItem | null = loggingHabit
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

  function toggleHeatmap(habitId: string) {
    setExpandedHeatmapByHabitId((current) => ({
      ...current,
      [habitId]: !current[habitId],
    }));
  }

  function renderHabitTile(habit: Habit) {
    const insight = habitInsights.get(habit.id);
    if (!insight) return null;

    const expanded = Boolean(expandedHeatmapByHabitId[habit.id]);

    return (
      <div key={habit.id}>
        <HabitCard
          habit={habit}
          status={insight.status}
          currentStreak={insight.currentStreak}
          completionRate30d={insight.completionRate30d}
          linkedGoalTitles={insight.linkedGoalTitles}
          busy={quickActionHabitId === habit.id}
          onEdit={(e) => { e.stopPropagation(); setEditingHabitId(habit.id); }}
          onQuickComplete={() => void handleQuickComplete(habit)}
          onQuickLog={() => setLoggingHabitId(habit.id)}
          onTogglePause={() => void handleTogglePause(habit)}
        />
        <button
          type="button"
          className="mt-2 text-xs font-medium text-neutral-500 hover:text-neutral-800"
          onClick={() => toggleHeatmap(habit.id)}
        >
          {expanded ? "Hide heatmap" : "Show heatmap"}
        </button>
        {expanded && <HabitHeatmap cells={insight.heatmap} />}
      </div>
    );
  }

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
      <TopBar title="Habits" onQuickAdd={() => setOpen(true)} />
      <div className="flex-1 overflow-y-auto p-6">
        {habits.length === 0 ? (
          <div className="mx-auto flex max-w-3xl flex-col gap-5 py-16 text-center">
            <p className="text-sm text-neutral-400">No habits yet.</p>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Example habit ideas
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {habitExamples.map((example) => (
                  <div
                    key={example.title}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                  >
                    <p className="text-sm font-medium text-neutral-900">{example.title}</p>
                    <p className="mt-1 text-xs text-neutral-500">{example.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.sections.map((section) => (
              <section key={section.goal.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
                    {section.goal.title}
                  </h2>
                  <span className="text-xs text-neutral-400">
                    {section.habits.length} habit{section.habits.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {section.habits.map((habit) => renderHabitTile(habit))}
                </div>
              </section>
            ))}

            {grouped.unlinked.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
                  Unlinked habits
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {grouped.unlinked.map((habit) => renderHabitTile(habit))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New habit</DialogTitle>
          </DialogHeader>
          <HabitForm onSubmit={handleCreate} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingHabitId)} onOpenChange={(next) => { if (!next) setEditingHabitId(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit habit</DialogTitle>
          </DialogHeader>
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

      <Dialog open={Boolean(loggingHabitId)} onOpenChange={(next) => { if (!next) setLoggingHabitId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick log</DialogTitle>
          </DialogHeader>
          {logFormItem && loggingHabit && (
            <LogForm
              item={logFormItem}
              unit={loggingHabit.unit}
              onSubmit={(value, note) => void handleQuickLog(value, note)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
