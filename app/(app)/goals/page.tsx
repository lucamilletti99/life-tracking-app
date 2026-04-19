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

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

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
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="text-sm text-neutral-400">No goals yet. Create your first goal.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {progressList.map((p) => (
              <GoalCard
                key={p.goal.id}
                progress={p}
                onClick={() => router.push(`/goals/${p.goal.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New goal</DialogTitle>
          </DialogHeader>
          <GoalForm onSubmit={handleCreate} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
