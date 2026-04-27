"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { GoalCard } from "@/components/goals/GoalCard";
import { GoalForm } from "@/components/goals/GoalForm";
import { TopBar } from "@/components/layout/TopBar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildGoalHabitExecutionMap } from "@/lib/goal-habit-execution";
import { calculateGoalProgress } from "@/lib/goal-calculations";
import { getServiceContext } from "@/lib/services/context";
import { goalsService } from "@/lib/services/goals";
import { habitsService } from "@/lib/services/habits";
import { logsService } from "@/lib/services/logs";
import { todosService } from "@/lib/services/todos";
import type { Goal, Habit, HabitGoalLink, LogEntry, TodoGoalLink } from "@/lib/types";

const goalExamples = [
  {
    title: "Lose 5 lbs by June",
    details: "Type: Target · Unit: lbs · Baseline: 178 · Target: 173",
  },
  {
    title: "Read 500 pages this month",
    details: "Type: Accumulation · Unit: pages · Target: 500",
  },
  {
    title: "Keep weekly spending under $600",
    details: "Type: Limit · Unit: USD · Target: 600",
  },
];

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [habitGoalLinks, setHabitGoalLinks] = useState<HabitGoalLink[]>([]);
  const [todoGoalLinks, setTodoGoalLinks] = useState<TodoGoalLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const ctx = await getServiceContext();
        const [goalRows, habitRows, logRows, habitLinks, todoLinks] = await Promise.all([
          goalsService.list(ctx),
          habitsService.list(ctx),
          logsService.list(ctx),
          habitsService.listGoalLinks(ctx),
          todosService.listGoalLinks(ctx),
        ]);
        if (!cancelled) {
          setGoals(goalRows);
          setHabits(habitRows);
          setLogs(logRows);
          setHabitGoalLinks(habitLinks);
          setTodoGoalLinks(todoLinks);
        }
      } catch (error) {
        if (!cancelled) {
          setGoals([]);
          setHabits([]);
          setLogs([]);
          setHabitGoalLinks([]);
          setTodoGoalLinks([]);
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

  const progressList = useMemo(() => {
    const goalSourceMap = new Map<string, string[]>();
    for (const link of habitGoalLinks) {
      const ids = goalSourceMap.get(link.goal_id) ?? [];
      ids.push(link.habit_id);
      goalSourceMap.set(link.goal_id, ids);
    }
    for (const link of todoGoalLinks) {
      const ids = goalSourceMap.get(link.goal_id) ?? [];
      ids.push(link.todo_id);
      goalSourceMap.set(link.goal_id, ids);
    }
    return goals.map((g) => calculateGoalProgress(g, logs, goalSourceMap.get(g.id)));
  }, [goals, logs, habitGoalLinks, todoGoalLinks]);

  const goalHabitExecution = useMemo(
    () =>
      buildGoalHabitExecutionMap({
        goals,
        habits,
        habitGoalLinks,
        logs,
        today: format(new Date(), "yyyy-MM-dd"),
      }),
    [goals, habits, habitGoalLinks, logs],
  );

  useEffect(() => {
    for (const goal of goals.slice(0, 6)) {
      router.prefetch(`/goals/${goal.id}`);
    }
  }, [goals, router]);

  const refreshGoals = useCallback(async () => {
    const ctx = await getServiceContext();
    const refreshed = await goalsService.list(ctx);
    setGoals(refreshed);
  }, []);

  async function handleCreate(
    data: Omit<Goal, "id" | "created_at" | "updated_at" | "current_value_cache">,
  ) {
    try {
      const ctx = await getServiceContext();
      await goalsService.create(ctx, data);
      await refreshGoals();
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create goal");
    }
  }

  const handleAutoSave = useCallback(async (
    id: string,
    data: Omit<Goal, "id" | "created_at" | "updated_at" | "current_value_cache">,
  ) => {
    try {
      const ctx = await getServiceContext();
      await goalsService.update(ctx, id, data);
      await refreshGoals();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save goal");
    }
  }, [refreshGoals]);

  const handleEditingGoalAutoSave = useCallback(
    async (data: Omit<Goal, "id" | "created_at" | "updated_at" | "current_value_cache">) => {
      if (!editingGoalId) return;
      await handleAutoSave(editingGoalId, data);
    },
    [editingGoalId, handleAutoSave],
  );

  const editingGoal = editingGoalId ? goals.find((g) => g.id === editingGoalId) : undefined;

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
        eyebrow="Direction"
        title="Goals"
        subtitle="What you're moving toward. Quietly tracked, not nagged."
        onQuickAdd={() => setOpen(true)}
      />
      <div className="flex-1 overflow-y-auto scroll-seamless">
        <div className="mx-auto max-w-5xl px-8 py-8">
          {goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
              <p className="text-sm text-ink-subtle">No goals yet. Create your first.</p>
              <div className="w-full max-w-3xl rounded-xl border border-hairline bg-surface p-5 text-left">
                <p className="text-eyebrow mb-3">Example goal ideas</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {goalExamples.map((example) => (
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {progressList.map((p) => (
                <GoalCard
                  key={p.goal.id}
                  progress={p}
                  onClick={() => router.push(`/goals/${p.goal.id}`)}
                  onHover={() => router.prefetch(`/goals/${p.goal.id}`)}
                  executionSummary={goalHabitExecution.get(p.goal.id)}
                  onEdit={(e) => { e.stopPropagation(); setEditingGoalId(p.goal.id); }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New goal</DialogTitle>
          </DialogHeader>
          <GoalForm onSubmit={handleCreate} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={Boolean(editingGoalId)} onOpenChange={(o) => { if (!o) setEditingGoalId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit goal</DialogTitle>
          </DialogHeader>
          {editingGoal && (
            <GoalForm
              goalId={editingGoal.id}
              initial={editingGoal}
              onAutoSave={handleEditingGoalAutoSave}
              onCancel={() => setEditingGoalId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
