"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toTrackingMode } from "@/lib/habit-tracking";
import type { TrackingType } from "@/lib/types";

interface GoalOption {
  id: string;
  title: string;
}

interface LogFormProps {
  trackingType: TrackingType;
  unit?: string;
  goals?: GoalOption[];
  onSubmit: (value: number, note?: string, goalIds?: string[]) => void;
}

export function LogForm({ trackingType, unit, goals, onSubmit }: LogFormProps) {
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const trackingMode = toTrackingMode(trackingType);
  const resolvedUnit =
    trackingMode === "duration" ? unit?.trim() || "min" : unit?.trim();
  const valueLabel = trackingMode === "duration" ? "Time" : "Value";
  const submitLabel =
    trackingMode === "boolean"
      ? "Mark complete"
      : trackingMode === "duration"
        ? "Log time"
        : "Log value";

  function toggleGoal(id: string) {
    setSelectedGoalIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const numericValue = trackingMode === "boolean" ? 1 : Number.parseFloat(value);
        if (!Number.isFinite(numericValue)) return;
        onSubmit(numericValue, note || undefined, selectedGoalIds.length > 0 ? selectedGoalIds : undefined);
      }}
      className="flex flex-col gap-4"
    >
      {trackingMode !== "boolean" && (
        <div className="space-y-1.5">
          <Label>{valueLabel}{resolvedUnit ? ` (${resolvedUnit})` : ""}</Label>
          <Input
            type="number"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            autoFocus
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Note (optional)</Label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note"
          autoFocus={trackingMode === "boolean"}
        />
      </div>

      {goals && goals.length > 0 && (
        <div className="space-y-1.5">
          <Label>Link to goals (optional)</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {goals.map((goal) => {
              const selected = selectedGoalIds.includes(goal.id);
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  className={`inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-medium transition-chrome ${
                    selected
                      ? "bg-ink text-background"
                      : "border border-hairline bg-background text-ink-muted hover:bg-muted"
                  }`}
                >
                  {goal.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Button type="submit" size="sm" className="mt-1">
        {submitLabel}
      </Button>
    </form>
  );
}
