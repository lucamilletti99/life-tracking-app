"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Goal, GoalType } from "@/lib/types";

interface GoalFormProps {
  goalId?: string;
  initial?: Partial<Goal>;
  onSubmit?: (
    data: Omit<Goal, "id" | "created_at" | "updated_at" | "current_value_cache">,
  ) => void;
  onAutoSave?: (
    data: Omit<Goal, "id" | "created_at" | "updated_at" | "current_value_cache">,
  ) => Promise<void> | void;
  onCancel: () => void;
}

export function GoalForm({ goalId, initial, onSubmit, onAutoSave, onCancel }: GoalFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [goalType, setGoalType] = useState<GoalType>(
    initial?.goal_type ?? "accumulation",
  );
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [targetValue, setTargetValue] = useState(String(initial?.target_value ?? ""));
  const [baselineValue, setBaselineValue] = useState(
    String(initial?.baseline_value ?? ""),
  );
  const [startDate, setStartDate] = useState(initial?.start_date ?? "");
  const [endDate, setEndDate] = useState(initial?.end_date ?? "");
  const [saving, setSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const isEditMode = Boolean(goalId);

  const buildPayload = useCallback(
    (): Omit<Goal, "id" | "created_at" | "updated_at" | "current_value_cache"> => ({
      title,
      goal_type: goalType,
      unit,
      target_value: parseFloat(targetValue),
      baseline_value: baselineValue ? parseFloat(baselineValue) : undefined,
      start_date: startDate,
      end_date: endDate,
      is_active: initial?.is_active ?? true,
    }),
    [title, goalType, unit, targetValue, baselineValue, startDate, endDate, initial?.is_active],
  );

  const isComplete = useCallback(
    (payload: Omit<Goal, "id" | "created_at" | "updated_at" | "current_value_cache">) =>
      Boolean(
        payload.title.trim() &&
          payload.unit.trim() &&
          Number.isFinite(payload.target_value) &&
          payload.start_date &&
          payload.end_date,
      ),
    [],
  );

  const flushAutoSave = useCallback(async () => {
    if (!isEditMode || !onAutoSave) return;

    const payload = buildPayload();
    if (!isComplete(payload)) return;

    const snapshot = JSON.stringify(payload);
    if (lastSavedSnapshotRef.current === snapshot) return;

    await onAutoSave(payload);
    lastSavedSnapshotRef.current = snapshot;
  }, [buildPayload, isComplete, isEditMode, onAutoSave]);

  useEffect(() => {
    if (!isEditMode || !onAutoSave) return;

    const payload = buildPayload();
    if (!isComplete(payload)) return;

    const snapshot = JSON.stringify(payload);
    if (lastSavedSnapshotRef.current === null) {
      lastSavedSnapshotRef.current = snapshot;
      return;
    }
    if (snapshot === lastSavedSnapshotRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void flushAutoSave().catch((error) => {
        console.error(error);
      });
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [buildPayload, flushAutoSave, isComplete, isEditMode, onAutoSave]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEditMode) {
      void flushAutoSave().catch((error) => {
        console.error(error);
      });
      return;
    }

    onSubmit?.({
      ...buildPayload(),
      is_active: true,
    });
  }

  async function handleDone() {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    setSaving(true);
    try {
      await flushAutoSave();
      onCancel();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Read 500 pages"
        />
      </div>

      <div>
        <Label>Type</Label>
        <div className="mt-1 flex gap-2">
          {(["target", "accumulation", "limit"] as GoalType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setGoalType(t)}
              className={`rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors ${
                goalType === t
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <Label>Target value</Label>
          <Input
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            required
          />
        </div>
        <div className="flex-1">
          <Label>Unit</Label>
          <Input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            required
            placeholder="lbs, pages, USD..."
          />
        </div>
      </div>

      {goalType === "target" && (
        <div>
          <Label>Baseline value</Label>
          <Input
            type="number"
            value={baselineValue}
            onChange={(e) => setBaselineValue(e.target.value)}
            placeholder="Starting value"
          />
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1">
          <Label>Start date</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="flex-1">
          <Label>End date</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      {!isEditMode && (
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save goal</Button>
        </div>
      )}

      {isEditMode && (
        <div className="flex justify-end pt-2">
          <Button type="button" variant="ghost" onClick={() => void handleDone()} disabled={saving}>
            {saving ? "Saving..." : "Done"}
          </Button>
        </div>
      )}
    </form>
  );
}
