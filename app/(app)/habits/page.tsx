"use client";

import { useEffect, useMemo, useState } from "react";

import { HabitCard } from "@/components/habits/HabitCard";
import { HabitForm } from "@/components/habits/HabitForm";
import { TopBar } from "@/components/layout/TopBar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { groupHabitsByGoal } from "@/lib/habit-grouping";
import { goalsService } from "@/lib/services/goals";
import { habitsService } from "@/lib/services/habits";
import type { Goal, Habit, HabitGoalLink } from "@/lib/types";

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

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [links, setLinks] = useState<HabitGoalLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [habitRows, goalRows, linkRows] = await Promise.all([
          habitsService.list(),
          goalsService.list(),
          habitsService.listGoalLinks(),
        ]);

        if (!cancelled) {
          setHabits(habitRows);
          setGoals(goalRows);
          setLinks(linkRows);
        }
      } catch (error) {
        if (!cancelled) {
          setHabits([]);
          setGoals([]);
          setLinks([]);
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
    const [habitRows, linkRows] = await Promise.all([
      habitsService.list(),
      habitsService.listGoalLinks(),
    ]);
    setHabits(habitRows);
    setLinks(linkRows);
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

  const grouped = useMemo(
    () => groupHabitsByGoal({ goals, habits, links }),
    [goals, habits, links],
  );

  const editingHabit = editingHabitId ? habits.find((h) => h.id === editingHabitId) : undefined;

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
                  {section.habits.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      onEdit={(e) => { e.stopPropagation(); setEditingHabitId(habit.id); }}
                    />
                  ))}
                </div>
              </section>
            ))}

            {grouped.unlinked.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
                  Unlinked habits
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {grouped.unlinked.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      onEdit={(e) => { e.stopPropagation(); setEditingHabitId(habit.id); }}
                    />
                  ))}
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

      {/* Edit dialog */}
      <Dialog open={Boolean(editingHabitId)} onOpenChange={(o) => { if (!o) setEditingHabitId(null); }}>
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
    </>
  );
}
