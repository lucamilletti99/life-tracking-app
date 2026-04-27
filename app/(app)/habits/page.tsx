"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { HabitCard } from "@/components/habits/HabitCard";
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
import { buildHabitStackCueMap } from "@/lib/habit-stack-insights";
import { groupHabitsByGoal } from "@/lib/habit-grouping";
import { getServiceContext } from "@/lib/services/context";
import { goalsService } from "@/lib/services/goals";
import { habitsService } from "@/lib/services/habits";
import { habitStacksService } from "@/lib/services/habit-stacks";
import { logsService } from "@/lib/services/logs";
import { computeStreak } from "@/lib/streak";
import type { Goal, Habit, HabitGoalLink, HabitStack, LogEntry } from "@/lib/types";

const habitExamples = [
  {
    title: "Morning weigh-in",
    details: "Track: Measure + unit (lbs) · Every day",
  },
  {
    title: "Read 30 pages",
    details: "Track: Measure + unit (pages) · Selected days",
  },
  {
    title: "Meditate",
    details: "Track: Time (min) · Every day",
  },
];

interface HabitInsight {
  status: HabitTodayState;
  currentStreak: number;
  missedYesterday: boolean;
  completionRate30d: number;
  linkedGoalTitles: string[];
  stackCueFromTitles: string[];
  heatmap: ReturnType<typeof buildHabitHeatmap>;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [links, setLinks] = useState<HabitGoalLink[]>([]);
  const [habitStacks, setHabitStacks] = useState<HabitStack[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [loggingHabitId, setLoggingHabitId] = useState<string | null>(null);
  const [quickActionHabitId, setQuickActionHabitId] = useState<string | null>(null);
  const [celebratingHabitId, setCelebratingHabitId] = useState<string | null>(null);
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const [loggingDate, setLoggingDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const celebrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const ctx = await getServiceContext();
        const [habitRows, goalRows, linkRows, stackRows, logRows] = await Promise.all([
          habitsService.list(ctx),
          goalsService.list(ctx),
          habitsService.listGoalLinks(ctx),
          habitStacksService.list(ctx),
          logsService.list(ctx),
        ]);

        if (!cancelled) {
          setHabits(habitRows);
          setGoals(goalRows);
          setLinks(linkRows);
          setHabitStacks(stackRows);
          setLogs(logRows);
        }
      } catch (error) {
        if (!cancelled) {
          setHabits([]);
          setGoals([]);
          setLinks([]);
          setHabitStacks([]);
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

  useEffect(
    () => () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
      }
    },
    [],
  );

  const refreshHabitsData = useCallback(async () => {
    const ctx = await getServiceContext();
    const [habitRows, linkRows, logRows] = await Promise.all([
      habitsService.list(ctx),
      habitsService.listGoalLinks(ctx),
      logsService.list(ctx),
    ]);
    setHabits(habitRows);
    setLinks(linkRows);
    setLogs(logRows);
  }, []);

  async function handleCreate(
    data: Omit<Habit, "id" | "created_at" | "updated_at">,
    goalIds: string[],
  ) {
    try {
      const ctx = await getServiceContext();
      const created = await habitsService.create(ctx, data);
      if (goalIds.length > 0) {
        await Promise.all(
          goalIds.map((goalId) => habitsService.linkGoal(ctx, created.id, goalId)),
        );
      }
      await refreshHabitsData();
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create habit");
    }
  }

  const handleGoalLinkChange = useCallback(
    async (goalId: string, linked: boolean) => {
      if (!editingHabitId) return;
      const ctx = await getServiceContext();
      if (linked) {
        await habitsService.linkGoal(ctx, editingHabitId, goalId);
      } else {
        await habitsService.unlinkGoal(ctx, editingHabitId, goalId);
      }
      await refreshHabitsData();
    },
    [editingHabitId, refreshHabitsData],
  );

  const handleAutoSaveHabit = useCallback(async (
    id: string,
    data: Omit<Habit, "id" | "created_at" | "updated_at">,
  ) => {
    const ctx = await getServiceContext();
    await habitsService.update(ctx, id, data);
    await refreshHabitsData();
  }, [refreshHabitsData]);

  const handleEditingHabitAutoSave = useCallback(
    async (data: Omit<Habit, "id" | "created_at" | "updated_at">) => {
      if (!editingHabitId) return;
      await handleAutoSaveHabit(editingHabitId, data);
    },
    [editingHabitId, handleAutoSaveHabit],
  );

  const triggerCelebration = useCallback((habitId: string) => {
    setCelebratingHabitId(habitId);

    if (celebrationTimeoutRef.current) {
      clearTimeout(celebrationTimeoutRef.current);
    }

    celebrationTimeoutRef.current = setTimeout(() => {
      setCelebratingHabitId((current) => (current === habitId ? null : current));
    }, 650);
  }, []);

  async function handleQuickComplete(habit: Habit) {
    setQuickActionHabitId(habit.id);
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
      await refreshHabitsData();
      triggerCelebration(habit.id);
    } catch (error) {
      console.error(error);
      toast.error("Failed to log habit");
    } finally {
      setQuickActionHabitId(null);
    }
  }

  async function handleQuickLog(value: number, note?: string) {
    const habit = habits.find((row) => row.id === loggingHabitId);
    if (!habit) return;

    setQuickActionHabitId(habit.id);
    try {
      const ctx = await getServiceContext();
      // Use loggingDate (may be a past date for retroactive entries)
      const isToday = loggingDate === today;
      await logsService.create(ctx, {
        entry_date: loggingDate,
        entry_datetime: isToday
          ? new Date().toISOString()
          : `${loggingDate}T12:00:00.000Z`,
        source_type: "habit",
        source_id: habit.id,
        numeric_value: value,
        unit: habit.unit,
        note,
      });
      await refreshHabitsData();
      if (isToday) triggerCelebration(habit.id);
      setLoggingHabitId(null);
      setLoggingDate(today);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save log");
    } finally {
      setQuickActionHabitId(null);
    }
  }

  async function handleTogglePause(habit: Habit) {
    setQuickActionHabitId(habit.id);
    try {
      const ctx = await getServiceContext();
      await habitsService.update(ctx, habit.id, {
        is_paused: !habit.is_paused,
      });
      await refreshHabitsData();
    } catch (error) {
      console.error(error);
      toast.error(habit.is_paused ? "Failed to resume habit" : "Failed to pause habit");
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
    const stackCueByHabitId = buildHabitStackCueMap({
      habits,
      stacks: habitStacks,
      logs,
      today,
    });
    const habitById = new Map(habits.map((habit) => [habit.id, habit]));

    for (const link of links) {
      const current = goalIdsByHabitId.get(link.habit_id) ?? [];
      if (!current.includes(link.goal_id)) {
        goalIdsByHabitId.set(link.habit_id, [...current, link.goal_id]);
      }
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
        {
          trackingType: habit.tracking_type,
          defaultTargetValue: habit.default_target_value,
          targetDirection: habit.target_direction,
        },
      );
      const completionRate30d = computeHabitCompletionRate(habit, logs, today, 30);
      const linkedGoalTitles = (goalIdsByHabitId.get(habit.id) ?? [])
        .map((goalId) => goalTitleById.get(goalId))
        .filter((title): title is string => Boolean(title));
      const stackCueFromTitles = (stackCueByHabitId.get(habit.id) ?? [])
        .map((precedingHabitId) => habitById.get(precedingHabitId)?.title)
        .filter((title): title is string => Boolean(title));

      insights.set(habit.id, {
        status,
        currentStreak: streak.current,
        missedYesterday: streak.missedYesterday,
        completionRate30d,
        linkedGoalTitles,
        stackCueFromTitles,
        heatmap: buildHabitHeatmap(habit.id, logs, today, 84, habit),
      });
    }

    return insights;
  }, [goalTitleById, habitStacks, habits, links, logs, today]);

  const editingHabit = editingHabitId ? habits.find((h) => h.id === editingHabitId) : undefined;
  const loggingHabit = loggingHabitId ? habits.find((h) => h.id === loggingHabitId) : undefined;

  function renderHabitTile(habit: Habit) {
    const insight = habitInsights.get(habit.id);
    if (!insight) return null;

    return (
      <HabitCard
        key={habit.id}
        habit={habit}
        status={insight.status}
        currentStreak={insight.currentStreak}
        missedYesterday={insight.missedYesterday}
        completionRate30d={insight.completionRate30d}
        linkedGoalTitles={insight.linkedGoalTitles}
        stackCueFromTitles={insight.stackCueFromTitles}
        heatmap={insight.heatmap}
        celebrate={celebratingHabitId === habit.id}
        busy={quickActionHabitId === habit.id}
        onEdit={(e) => { e.stopPropagation(); setEditingHabitId(habit.id); }}
        onQuickComplete={() => void handleQuickComplete(habit)}
        onQuickLog={() => { setLoggingDate(today); setLoggingHabitId(habit.id); }}
        onTogglePause={() => void handleTogglePause(habit)}
        onLogDate={(date) => { setLoggingDate(date); setLoggingHabitId(habit.id); }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="mx-auto w-full max-w-[1220px]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <TopBar
        eyebrow="Systems"
        title="Habits"
        subtitle="The quiet repetitions that compound."
        onQuickAdd={() => setOpen(true)}
      />
      <div className="flex-1 overflow-y-auto scroll-seamless">
        <div className="mx-auto w-full max-w-[1220px] px-5 py-6 sm:px-6 lg:px-8">
          {habits.length === 0 ? (
            <div className="surface-card flex flex-col items-center justify-center gap-6 py-12 text-center sm:py-16">
              <p className="text-sm text-ink-subtle">No habits yet.</p>
              <div className="surface-operator w-full max-w-3xl p-5 text-left">
                <p className="text-eyebrow mb-3">Example habit ideas</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {habitExamples.map((example) => (
                    <div
                      key={example.title}
                      className="rounded-lg border border-hairline bg-background p-3"
                    >
                      <p className="text-[13px] font-medium text-ink">{example.title}</p>
                      <p className="mt-1 text-[11px] text-ink-subtle">{example.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {grouped.sections.map((section) => (
                <section key={section.goal.id} className="space-y-4">
                  <div className="flex items-baseline justify-between border-b border-hairline pb-3">
                    <h2 className="text-eyebrow">{section.goal.title}</h2>
                    <span className="text-metric text-[11px] text-ink-subtle">
                      {section.habits.length} habit{section.habits.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {section.habits.map((habit) => renderHabitTile(habit))}
                  </div>
                </section>
              ))}

              {grouped.unlinked.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-baseline justify-between border-b border-hairline pb-3">
                    <h2 className="text-eyebrow">Unlinked habits</h2>
                    <span className="text-metric text-[11px] text-ink-subtle">
                      {grouped.unlinked.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {grouped.unlinked.map((habit) => renderHabitTile(habit))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New habit</DialogTitle>
          </DialogHeader>
          <HabitForm
            goals={goals}
            onSubmit={handleCreate}
            onCancel={() => setOpen(false)}
          />
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
              initialLinkedGoalIds={
                links
                  .filter((l) => l.habit_id === editingHabit.id)
                  .map((l) => l.goal_id)
              }
              goals={goals}
              onAutoSave={handleEditingHabitAutoSave}
              onGoalLinkChange={handleGoalLinkChange}
              onCancel={() => setEditingHabitId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(loggingHabitId)}
        onOpenChange={(next) => {
          if (!next) {
            setLoggingHabitId(null);
            setLoggingDate(today);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {loggingDate !== today ? `Log for ${loggingDate}` : "Log"}
            </DialogTitle>
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
