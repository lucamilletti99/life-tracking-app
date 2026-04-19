"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { GoalCard } from "@/components/goals/GoalCard";
import { GoalForm } from "@/components/goals/GoalForm";
import { TopBar } from "@/components/layout/TopBar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { calculateGoalProgress } from "@/lib/goal-calculations";
import { goalsService } from "@/lib/services/goals";
import { logsService } from "@/lib/services/logs";
import type { Goal } from "@/lib/types";

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState(() => goalsService.list());
  const [open, setOpen] = useState(false);

  const allLogs = logsService.list();
  const progressList = goals.map((g) => calculateGoalProgress(g, allLogs));

  function handleCreate(
    data: Omit<Goal, "id" | "created_at" | "updated_at" | "current_value_cache">,
  ) {
    goalsService.create(data);
    setGoals(goalsService.list());
    setOpen(false);
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
