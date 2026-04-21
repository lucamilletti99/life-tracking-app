"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  onSubmit: (data: Omit<Habit, "id" | "created_at" | "updated_at">) => void;
  onAutoSave?: (data: Omit<Habit, "id" | "created_at" | "updated_at">) => void;
  onCancel: () => void;
}

export function HabitForm({ habitId, initial, onSubmit, onAutoSave, onCancel }: HabitFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [cueTime, setCueTime] = useState(initial?.cue_time ?? "");
  const [cueLocation, setCueLocation] = useState(initial?.cue_location ?? "");
  const [cueContext, setCueContext] = useState(initial?.cue_context ?? "");
  const [implementationIntention, setImplementationIntention] = useState(
    initial?.implementation_intention ?? "",
  );
  const [identityStatement, setIdentityStatement] = useState(initial?.identity_statement ?? "");
  const [temptationBundle, setTemptationBundle] = useState(initial?.temptation_bundle ?? "");
  const [minimumVersion, setMinimumVersion] = useState(initial?.minimum_version ?? "");
  const [environmentSetup, setEnvironmentSetup] = useState(initial?.environment_setup ?? "");
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

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEditMode = Boolean(habitId);

  const payload = useMemo(
    () => ({
      title,
      cue_time: cueTime || undefined,
      cue_location: cueLocation || undefined,
      cue_context: cueContext || undefined,
      implementation_intention: implementationIntention || undefined,
      identity_statement: identityStatement || undefined,
      temptation_bundle: temptationBundle || undefined,
      minimum_version: minimumVersion || undefined,
      environment_setup: environmentSetup || undefined,
      tracking_type: trackingType,
      unit: unit || undefined,
      recurrence_type: recurrenceType,
      recurrence_config: recurrenceConfig,
      auto_create_calendar_instances: autoCreate,
      is_active: true,
    }),
    [
      title,
      cueTime,
      cueLocation,
      cueContext,
      implementationIntention,
      identityStatement,
      temptationBundle,
      minimumVersion,
      environmentSetup,
      trackingType,
      unit,
      recurrenceType,
      recurrenceConfig,
      autoCreate,
    ],
  );

  useEffect(() => {
    if (!isEditMode || !onAutoSave) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onAutoSave(payload);
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isEditMode, onAutoSave, payload]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(payload);
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
          ).map((typeValue) => (
            <button
              key={typeValue}
              type="button"
              onClick={() => setTrackingType(typeValue)}
              className={`rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors ${
                trackingType === typeValue
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
              }`}
            >
              {typeValue}
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

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-neutral-200 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Cue & identity
        </p>
        <div>
          <Label>Preferred cue time</Label>
          <Input type="time" value={cueTime} onChange={(e) => setCueTime(e.target.value)} />
        </div>
        <div>
          <Label>Cue location</Label>
          <Input
            value={cueLocation}
            onChange={(e) => setCueLocation(e.target.value)}
            placeholder="Home gym, office desk..."
          />
        </div>
        <div>
          <Label>Cue context</Label>
          <Input
            value={cueContext}
            onChange={(e) => setCueContext(e.target.value)}
            placeholder="After morning coffee..."
          />
        </div>
        <div>
          <Label>Implementation intention</Label>
          <Input
            value={implementationIntention}
            onChange={(e) => setImplementationIntention(e.target.value)}
            placeholder="When/where/how statement"
          />
        </div>
        <div>
          <Label>Identity statement</Label>
          <Input
            value={identityStatement}
            onChange={(e) => setIdentityStatement(e.target.value)}
            placeholder="I am someone who..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-neutral-200 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Friction reduction
        </p>
        <div>
          <Label>2-minute version</Label>
          <Input
            value={minimumVersion}
            onChange={(e) => setMinimumVersion(e.target.value)}
            placeholder="Smallest version of this habit"
          />
        </div>
        <div>
          <Label>Environment setup</Label>
          <Input
            value={environmentSetup}
            onChange={(e) => setEnvironmentSetup(e.target.value)}
            placeholder="Night-before prep step"
          />
        </div>
        <div>
          <Label>Temptation bundle</Label>
          <Input
            value={temptationBundle}
            onChange={(e) => setTemptationBundle(e.target.value)}
            placeholder="Enjoyable thing paired with this habit"
          />
        </div>
      </div>

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
          <Button type="button" variant="ghost" onClick={onCancel}>
            Done
          </Button>
        </div>
      )}
    </form>
  );
}
