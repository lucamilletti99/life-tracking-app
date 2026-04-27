"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatErrorDetails } from "@/lib/error-formatting";
import { TRACKING_MODE_OPTIONS, toTrackingMode, type TrackingMode } from "@/lib/habit-tracking";
import type {
  Goal,
  Habit,
  HabitTargetDirection,
  RecurrenceConfig,
  RecurrenceType,
} from "@/lib/types";

import { RecurrenceBuilder } from "./RecurrenceBuilder";

const trackingTypeLabels: Record<TrackingMode, string> = {
  boolean: "Yes / No",
  measurement: "Measure + unit",
  duration: "Time",
};

function normalizeTimeValue(value?: string): string {
  if (!value) return "";
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

interface HabitFormProps {
  habitId?: string;
  initial?: Partial<Habit>;
  initialLinkedGoalIds?: string[];
  goals?: Goal[];
  onSubmit?: (
    data: Omit<Habit, "id" | "created_at" | "updated_at">,
    goalIds: string[],
  ) => void;
  onAutoSave?: (data: Omit<Habit, "id" | "created_at" | "updated_at">) => Promise<void> | void;
  onGoalLinkChange?: (goalId: string, linked: boolean) => Promise<void> | void;
  onCancel: () => void;
}

export function HabitForm({
  habitId,
  initial,
  initialLinkedGoalIds,
  goals,
  onSubmit,
  onAutoSave,
  onGoalLinkChange,
  onCancel,
}: HabitFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [cueTime, setCueTime] = useState(normalizeTimeValue(initial?.cue_time));
  const [durationMinutes, setDurationMinutes] = useState(
    String(initial?.recurrence_config?.duration_minutes ?? 30),
  );
  const [cueLocation, setCueLocation] = useState(initial?.cue_location ?? "");
  const [cueContext, setCueContext] = useState(initial?.cue_context ?? "");
  const [implementationIntention] = useState(initial?.implementation_intention ?? "");
  const [identityStatement] = useState(initial?.identity_statement ?? "");
  const [temptationBundle] = useState(initial?.temptation_bundle ?? "");
  const [minimumVersion] = useState(initial?.minimum_version ?? "");
  const [environmentSetup] = useState(initial?.environment_setup ?? "");
  const [trackingType, setTrackingType] = useState<TrackingMode>(
    toTrackingMode(initial?.tracking_type ?? "measurement"),
  );
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [targetDirection, setTargetDirection] = useState<HabitTargetDirection>(
    initial?.target_direction ?? "at_least",
  );
  const [targetValue, setTargetValue] = useState(
    initial?.default_target_value != null ? String(initial.default_target_value) : "",
  );
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    initial?.recurrence_type ?? "daily",
  );
  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig>(
    initial?.recurrence_config ?? {},
  );
  const [autoCreate, setAutoCreate] = useState(
    initial?.auto_create_calendar_instances ?? true,
  );
  // Captured once at mount so buildPayload's dep array never re-triggers from
  // a parent refresh that happens to produce a new `initial` object reference.
  const [isActive] = useState(initial?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  // Collapsible section — expand by default if the habit already has schedule/location data.
  const [timePlaceExpanded, setTimePlaceExpanded] = useState(
    Boolean(initial?.cue_time || initial?.cue_location),
  );

  // Goal linking
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>(
    initialLinkedGoalIds ?? [],
  );
  const [linkedGoalsExpanded, setLinkedGoalsExpanded] = useState(false);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const scrollAnchorRef = useRef<HTMLFormElement>(null);
  const isEditMode = Boolean(habitId);
  // Always-current ref so the unmount flush can call the latest flushAutoSave
  // without it being in the dependency array of the mount/unmount effect.
  const flushAutoSaveRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // Scroll dialog to top on mount
  useEffect(() => {
    const el = scrollAnchorRef.current;
    if (!el) return;
    let parent = el.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (["auto", "scroll"].includes(style.overflow) || ["auto", "scroll"].includes(style.overflowY)) {
        parent.scrollTop = 0;
        break;
      }
      parent = parent.parentElement;
    }
  }, []);

  const buildPayload = useCallback(
    (): Omit<Habit, "id" | "created_at" | "updated_at"> => {
      const normalizedUnit = unit.trim();
      const parsedDuration = Number.parseInt(durationMinutes, 10);
      const parsedTarget = Number.parseFloat(targetValue);
      const resolvedDuration = Number.isFinite(parsedDuration) && parsedDuration > 0
        ? parsedDuration
        : 30;
      const resolvedTarget =
        trackingType === "boolean" || !Number.isFinite(parsedTarget)
          ? undefined
          : parsedTarget;

      return {
        title,
        tracking_type: trackingType,
        unit:
          trackingType === "boolean"
            ? undefined
            : normalizedUnit || (trackingType === "duration" ? "min" : undefined),
        recurrence_type: recurrenceType,
        recurrence_config: {
          ...recurrenceConfig,
          duration_minutes: resolvedDuration,
        },
        default_target_value: resolvedTarget,
        target_direction: targetDirection,
        auto_create_calendar_instances: autoCreate,
        is_active: isActive,
        // Atomic Habits fields
        cue_time: cueTime || undefined,
        cue_location: cueLocation || undefined,
        cue_context: cueContext || undefined,
        implementation_intention: implementationIntention || undefined,
        identity_statement: identityStatement || undefined,
        temptation_bundle: temptationBundle || undefined,
        minimum_version: minimumVersion || undefined,
        environment_setup: environmentSetup || undefined,
      };
    },
    [
      title,
      trackingType,
      unit,
      targetDirection,
      targetValue,
      durationMinutes,
      recurrenceType,
      recurrenceConfig,
      autoCreate,
      isActive,
      cueTime,
      cueLocation,
      cueContext,
      implementationIntention,
      identityStatement,
      temptationBundle,
      minimumVersion,
      environmentSetup,
    ],
  );

  const isComplete = useCallback(
    (payload: Omit<Habit, "id" | "created_at" | "updated_at">) =>
      Boolean(payload.title.trim()) &&
      (payload.tracking_type !== "measurement" || Boolean(payload.unit?.trim())),
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

  // Keep the ref in sync so the unmount effect always calls the latest version.
  useEffect(() => {
    flushAutoSaveRef.current = flushAutoSave;
  }, [flushAutoSave]);

  // ── Unmount flush ──────────────────────────────────────────────────────────
  // When the dialog is closed without pressing "Done" (backdrop click, Escape,
  // programmatic close) React unmounts this form and the debounce effect's
  // cleanup fires, which *cancels* the pending 600 ms timer — silently
  // discarding the last change.  This dedicated mount/unmount effect catches
  // that case: on unmount it cancels the stale timer and calls flush directly,
  // so every change is always persisted regardless of how the dialog closes.
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      void flushAutoSaveRef.current().catch((error) => {
        console.error("[habit-form] unmount flush failed", formatErrorDetails(error));
      });
    };
  }, []); // intentionally empty — mount/unmount only

  useEffect(() => {
    if (!isEditMode || !onAutoSave) return;

    const payload = buildPayload();
    const snapshot = JSON.stringify(payload);

    // ── Baseline initialization (must run before isComplete check) ──────────
    // When the form opens with an already-invalid state (e.g. tracking_type =
    // "measurement" but unit = ""), isComplete returns false and the old code
    // bailed out here every render — lastSavedSnapshotRef stayed null forever.
    // The first valid change (e.g. switching to "Yes / No") then hit the null
    // check and was stored as the "already saved" baseline, so the change was
    // silently discarded.  Fix: always initialize the baseline on the very
    // first run, regardless of whether the payload is complete.
    if (lastSavedSnapshotRef.current === null) {
      lastSavedSnapshotRef.current = snapshot;
      return;
    }

    if (!isComplete(payload)) return;
    if (snapshot === lastSavedSnapshotRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void flushAutoSave().catch((error) => {
        console.error("[habit-form] autosave failed", formatErrorDetails(error));
      });
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [buildPayload, flushAutoSave, isComplete, isEditMode, onAutoSave]);

  async function toggleGoal(goalId: string) {
    const isLinked = selectedGoalIds.includes(goalId);
    setSelectedGoalIds((prev) =>
      isLinked ? prev.filter((id) => id !== goalId) : [...prev, goalId],
    );
    if (isEditMode && onGoalLinkChange) {
      await onGoalLinkChange(goalId, !isLinked);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEditMode) {
      void flushAutoSave().catch((error) => {
        console.error("[habit-form] submit failed", formatErrorDetails(error));
      });
      return;
    }

    onSubmit?.({ ...buildPayload(), is_active: true }, selectedGoalIds);
  }

  async function handleDone() {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    setSaving(true);
    try {
      await flushAutoSave();
      onCancel();
    } catch (error) {
      console.error("[habit-form] done failed", formatErrorDetails(error));
    } finally {
      setSaving(false);
    }
  }

  const goalTitleById = new Map((goals ?? []).map((goal) => [goal.id, goal.title]));
  const linkedGoalLead = selectedGoalIds.length > 0
    ? (goalTitleById.get(selectedGoalIds[0]) ?? "Goal")
    : null;
  const linkedGoalSummary =
    selectedGoalIds.length === 0
      ? "No linked goal"
      : selectedGoalIds.length === 1
        ? `Linked: ${linkedGoalLead}`
        : `Linked: ${linkedGoalLead} (+${selectedGoalIds.length - 1})`;

  return (
    <form ref={scrollAnchorRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label>Habit name</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Morning weigh-in"
        />
      </div>

      {/* Tracking type */}
      <div className="space-y-1.5">
        <Label>How to track it</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {TRACKING_MODE_OPTIONS.map((typeValue) => (
            <button
              key={typeValue}
              type="button"
              onClick={() => setTrackingType(typeValue)}
              className={`inline-flex h-8 items-center rounded-lg border px-3 text-xs transition-colors ${
                trackingType === typeValue
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
              }`}
            >
              {trackingTypeLabels[typeValue]}
            </button>
          ))}
        </div>
      </div>

      {/* Target */}
      {trackingType !== "boolean" && (
        <div className="space-y-1.5">
          <Label>Target</Label>
          <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
            <div className="inline-flex h-8 shrink-0 rounded-lg border border-neutral-200 p-0.5">
              <button
                type="button"
                onClick={() => setTargetDirection("at_least")}
                className={`inline-flex h-full items-center rounded-md px-2.5 text-xs transition-colors ${
                  targetDirection === "at_least"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                At least
              </button>
              <button
                type="button"
                onClick={() => setTargetDirection("at_most")}
                className={`inline-flex h-full items-center rounded-md px-2.5 text-xs transition-colors ${
                  targetDirection === "at_most"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                At most
              </button>
            </div>
            <Input
              type="number"
              step="any"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="Value"
              className="h-8 min-w-[5.25rem] w-[5.25rem] shrink-0"
            />
            <Input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Unit"
              required={trackingType === "measurement"}
              className="h-8 min-w-[5.5rem] w-24 shrink-0"
            />
          </div>
        </div>
      )}

      {/* Recurrence */}
      <RecurrenceBuilder
        type={recurrenceType}
        config={recurrenceConfig}
        onTypeChange={setRecurrenceType}
        onConfigChange={setRecurrenceConfig}
      />

      {/* Goal linking */}
      {goals && goals.length > 0 && (
        <div className="rounded-lg border border-neutral-200">
          <button
            type="button"
            aria-expanded={linkedGoalsExpanded}
            onClick={() => setLinkedGoalsExpanded((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-left"
          >
            <div className="space-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Linked goal
              </p>
              <p className="text-xs text-neutral-600">{linkedGoalSummary}</p>
            </div>
            {linkedGoalsExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
            )}
          </button>
          {linkedGoalsExpanded && (
            <div className="border-t border-neutral-100 p-3">
              <div className="flex flex-wrap gap-2">
                {goals.map((goal) => {
                  const linked = selectedGoalIds.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => void toggleGoal(goal.id)}
                      className={`inline-flex h-8 items-center rounded-lg border px-3 text-xs transition-colors ${
                        linked
                          ? "border-ember bg-ember/10 text-ember"
                          : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                      }`}
                    >
                      {goal.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Advanced options */}
      <div className="rounded-lg border border-neutral-200">
        <button
          type="button"
          aria-expanded={advancedExpanded}
          onClick={() => setAdvancedExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2.5 text-left"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            More options
          </p>
          {advancedExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
          )}
        </button>
        {advancedExpanded && (
          <div className="space-y-3 border-t border-neutral-100 p-3">
            {/* Time & place — optional */}
            <div className="rounded-lg border border-neutral-200">
              <button
                type="button"
                aria-expanded={timePlaceExpanded}
                onClick={() => setTimePlaceExpanded((v) => !v)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Time &amp; place
                </p>
                {timePlaceExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                )}
              </button>
              {timePlaceExpanded && (
                <div className="grid grid-cols-1 gap-4 border-t border-neutral-100 p-3">
                  <div className="space-y-1.5">
                    <Label>Start time</Label>
                    <Input type="time" value={cueTime} onChange={(e) => setCueTime(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      min={5}
                      step={5}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Place</Label>
                    <Input
                      value={cueLocation}
                      onChange={(e) => setCueLocation(e.target.value)}
                      placeholder="Home gym, office desk..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Context (optional)</Label>
                    <Input
                      value={cueContext}
                      onChange={(e) => setCueContext(e.target.value)}
                      placeholder="After morning coffee..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Calendar toggle */}
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={autoCreate}
                onChange={(e) => setAutoCreate(e.target.checked)}
              />
              Show on calendar automatically
            </label>
          </div>
        )}
      </div>

      {!isEditMode && (
        <div className="flex justify-end gap-2 pt-3">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save habit</Button>
        </div>
      )}

      {isEditMode && (
        <div className="flex justify-end pt-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => void handleDone()}
            disabled={saving}
          >
            {saving ? "Saving..." : "Done"}
          </Button>
        </div>
      )}
    </form>
  );
}
