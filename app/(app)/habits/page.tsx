"use client";

import { useState } from "react";

import { HabitCard } from "@/components/habits/HabitCard";
import { HabitForm } from "@/components/habits/HabitForm";
import { TopBar } from "@/components/layout/TopBar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { habitsService } from "@/lib/services/habits";
import type { Habit } from "@/lib/types";

export default function HabitsPage() {
  const [habits, setHabits] = useState(() => habitsService.list());
  const [open, setOpen] = useState(false);

  function handleCreate(data: Omit<Habit, "id" | "created_at" | "updated_at">) {
    habitsService.create(data);
    setHabits(habitsService.list());
    setOpen(false);
  }

  return (
    <>
      <TopBar title="Habits" onQuickAdd={() => setOpen(true)} />
      <div className="flex-1 overflow-y-auto p-6">
        {habits.length === 0 ? (
          <p className="py-24 text-center text-sm text-neutral-400">No habits yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {habits.map((h) => (
              <HabitCard key={h.id} habit={h} onClick={() => {}} />
            ))}
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
    </>
  );
}
