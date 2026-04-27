import { SKIPPED_LOG_NOTE } from "./habit-status";
import type { Habit, HabitTargetDirection, LogEntry } from "./types";

function resolveTargetDirection(
  habit?: { target_direction?: HabitTargetDirection },
): HabitTargetDirection {
  return habit?.target_direction ?? "at_least";
}

type HabitWithThreshold = Pick<Habit, "tracking_type" | "target_direction"> & {
  default_target_value: number;
};

function hasThreshold(
  habit?: Pick<Habit, "tracking_type" | "default_target_value" | "target_direction">,
): habit is HabitWithThreshold {
  return (
    habit != null &&
    habit.tracking_type !== "boolean" &&
    habit.default_target_value != null
  );
}

export function evaluateHabitLogStatus(
  habit: Pick<Habit, "tracking_type" | "default_target_value" | "target_direction"> | undefined,
  log: LogEntry,
): "complete" | "skipped" | "failed" {
  if (log.note === SKIPPED_LOG_NOTE) return "skipped";

  if (!hasThreshold(habit)) return "complete";
  if (log.numeric_value == null) return "complete";

  const direction = resolveTargetDirection(habit);
  if (direction === "at_most") {
    return log.numeric_value <= habit.default_target_value ? "complete" : "failed";
  }

  return log.numeric_value >= habit.default_target_value ? "complete" : "failed";
}
