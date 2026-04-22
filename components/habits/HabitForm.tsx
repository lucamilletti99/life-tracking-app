"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  Habit,
  RecurrenceConfig,
  RecurrenceType,
  TrackingType,
} from "@/lib/types";

import { RecurrenceBuilder } from "./RecurrenceBuilder";

interface HabitFormProps {
  habitId?: string;
  initial?: Partial<Habit>;
  onSubmit?: (data: Omit<Habit, "id" | "created_at" | "updated_at">) => void;
  onAutoSave?: (data: Omit<Habit, "id" | "created_at" | "updated_at">) => Promise<void> | void;
  onCancel: () => void;
}

export function HabitForm({ habitId, initial, onSubmit, onAutoSave, onCancel }: HabitFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [trackingType, setTrackingType] = useState<TrackingType>(
    initial?.tracking_type ?? "numeric",
  );
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    initial?.recurrence_type ?? "daily",
  );
  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig>(
    initial?.recurrence_config ?? {},
  );
  const [autoCreate, setAutoCreate] = useState(
    initial?.auto_create_calendar_instances ?? true,
  );
  const [saving, setSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const isEditMode = Boolean(habitId);

  const buildPayload = useCallback(
    (): Omit<Habit, "id" | "created_at" | "updated_at"> => ({
      title,
      tracking_type: trackingType,
      unit: unit || undefined,
      recurrence_type: recurrenceType,
      recurrence_config: recurrenceConfig,
      auto_create_calendar_instances: autoCreate,
      is_active: initial?.is_active ?? true,
    }),
    [
      title,
      trackingType,
      unit,
      recurrenceType,
      recurrenceConfig,
      autoCreate,
      initial?.is_active,
    ],
  );

  const isComplete = useCallback(
    (payload: Omit<Habit, "id" | "created_at" | "updated_at">) =>
      Boolean(payload.title.trim()),
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
          placeholder="e.g. Morning weigh-in"
        />
      </div>

      <div>
        <Label>Tracking type</Label>
        <div className="mt-1 flex flex-wrap gap-2">
          {(
            ["boolean", "numeric", "amount", "duration", "measurement"] as TrackingType[]
          ).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTrackingType(t)}
              className={`rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors ${
                trackingType === t
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {trackingType !== "boolean" && (
        <div>
          <Label>Unit</Label>
          <Input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="lbs, pages, USD, min..."
          />
        </div>
      )}

      <RecurrenceBuilder
        type={recurrenceType}
        config={recurrenceConfig}
        onTypeChange={setRecurrenceType}
        onConfigChange={setRecurrenceConfig}
      />

      <label className="flex items-center gap-2 text-sm text-neutral-600">
        <input
          type="checkbox"
          checked={autoCreate}
          onChange={(e) => setAutoCreate(e.target.checked)}
        />
        Show on calendar automatically
      </label>

      {!isEditMode && (
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save habit</Button>
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
