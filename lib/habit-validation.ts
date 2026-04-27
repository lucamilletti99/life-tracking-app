import type { Habit, HabitTargetDirection, TrackingType } from "./types";

export const MEASUREMENT_UNIT_REQUIRED_MESSAGE =
  "Measured habits require a unit.";

const CLEARABLE_HABIT_FIELDS = [
  "description",
  "cue_time",
  "cue_location",
  "cue_context",
  "implementation_intention",
  "minimum_version",
  "environment_setup",
  "identity_statement",
  "temptation_bundle",
  "unit",
  "default_target_value",
  "paused_until",
  "difficulty_rating",
  "category",
  "color_tag",
] as const;

export function normalizeHabitUnit(unit?: string): string | undefined {
  const normalized = unit?.trim();
  return normalized ? normalized : undefined;
}

function normalizeTargetDirection(direction?: HabitTargetDirection): HabitTargetDirection {
  return direction === "at_most" ? "at_most" : "at_least";
}

function normalizeTargetValue(value?: number): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function assertMeasurementUnit(
  trackingType: TrackingType,
  unit?: string,
): void {
  if (trackingType === "measurement" && !normalizeHabitUnit(unit)) {
    throw new Error(MEASUREMENT_UNIT_REQUIRED_MESSAGE);
  }
}

export function prepareHabitCreatePayload(
  data: Omit<Habit, "id" | "created_at" | "updated_at">,
): Omit<Habit, "id" | "created_at" | "updated_at"> {
  const normalizedTargetValue =
    data.tracking_type === "boolean"
      ? undefined
      : normalizeTargetValue(data.default_target_value);
  const payload = {
    ...data,
    unit: normalizeHabitUnit(data.unit),
    target_direction: normalizeTargetDirection(data.target_direction),
    default_target_value: normalizedTargetValue,
  };
  assertMeasurementUnit(payload.tracking_type, payload.unit);
  return payload;
}

export function prepareHabitUpdatePayload(
  current: Habit,
  updates: Partial<Habit>,
): Partial<Habit> {
  const payload: Partial<Habit> = { ...updates };

  if ("unit" in updates) {
    payload.unit = normalizeHabitUnit(updates.unit);
  }

  if ("target_direction" in updates) {
    payload.target_direction = normalizeTargetDirection(updates.target_direction);
  }

  if ("default_target_value" in updates) {
    payload.default_target_value = normalizeTargetValue(updates.default_target_value);
  }

  const nextTrackingType = payload.tracking_type ?? current.tracking_type;
  const nextUnit = "unit" in payload ? payload.unit : normalizeHabitUnit(current.unit);

  assertMeasurementUnit(nextTrackingType, nextUnit);

  if (nextTrackingType === "boolean") {
    payload.default_target_value = undefined;
  }

  if (!("target_direction" in payload) && current.target_direction != null) {
    payload.target_direction = normalizeTargetDirection(current.target_direction);
  }

  return payload;
}

export function serializeHabitUpdatePayload(
  current: Habit,
  updates: Partial<Habit>,
): Record<string, unknown> {
  const payload = prepareHabitUpdatePayload(current, updates);
  const serialized: Record<string, unknown> = {};
  const payloadRecord = payload as Record<string, unknown>;

  for (const [key, value] of Object.entries(payloadRecord)) {
    if (value !== undefined) {
      serialized[key] = value;
    }
  }

  for (const field of CLEARABLE_HABIT_FIELDS) {
    if (field in payloadRecord && payloadRecord[field] === undefined) {
      serialized[field] = null;
    }
  }

  return serialized;
}
