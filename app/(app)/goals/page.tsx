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
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [goalRows, logRows] = await Promise.all([
          goalsService.list(),
          logsService.list(),
        ]);
        if (!cancelled) {
          setGoals(goalRows);
          setLogs(logRows);
        }
      } catch (error) {
        if (!cancelled) {
          setGoals([]);
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

  const progressList = useMemo(
    () => goals.map((g) => calculateGoalProgress(g, logs)),
    [goals, logs],
  );

  async function handleCreate(
    data: Omit<Goal, "id" | "created_at" | "updated_at" | "current_value_cache">,
  ) {
    await goalsService.create(data);
    const refreshed = await goalsService.list();
    setGoals(refreshed);
    setOpen(false);
  }

  async function handleAutoSave(
    id: string,
    data: Omit<Goal, "id" | "created_at" | "updated_at" | "current_value_cache">,
  ) {
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
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Example goal ideas
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {goalExamples.map((example) => (
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
