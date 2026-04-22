"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GoalOption {
  id: string;
  title: string;
}

interface LogFormProps {
  unit?: string;
  goals?: GoalOption[];
  onSubmit: (value: number, note?: string, goalIds?: string[]) => void;
}

export function LogForm({ unit, goals, onSubmit }: LogFormProps) {
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);

  function toggleGoal(id: string) {
    setSelectedGoalIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(parseFloat(value), note || undefined, selectedGoalIds.length > 0 ? selectedGoalIds : undefined);
      }}
      className="flex flex-col gap-3"
    >
      <div>
        <Label>Value{unit ? ` (${unit})` : ""}</Label>
        <Input
          type="number"
          step="any"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div>
        <Label>Note (optional)</Label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note"
        />
      </div>

      {goals && goals.length > 0 && (
        <div>
          <Label>Link to goals (optional)</Label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {goals.map((goal) => {
              const selected = selectedGoalIds.includes(goal.id);
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    selected
                      ? "bg-neutral-900 text-white"
                      : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {goal.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Button type="submit" size="sm">
        Log value
      </Button>
    </form>
  );
}
