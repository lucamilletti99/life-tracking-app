import { evaluateHabitLogStatus } from "./habit-evaluation";
import type { Habit, LogEntry } from "./types";

export const SKIPPED_LOG_NOTE = "__habit_skipped__";
export type HabitLogStatus = "complete" | "skipped" | "failed";

export function habitStatusKey(habitId: string, entryDate: string): string {
  return `${habitId}|${entryDate}`;
}

function statusFromLog(
  log: LogEntry,
  habitsById?: Map<
    string,
    Pick<Habit, "tracking_type" | "default_target_value" | "target_direction">
  >,
): HabitLogStatus {
  const habit = log.source_id ? habitsById?.get(log.source_id) : undefined;
  return evaluateHabitLogStatus(habit, log);
}

export function getHabitOccurrenceStatusMap(
  logs: LogEntry[],
  habits?: Array<
    Pick<Habit, "id" | "tracking_type" | "default_target_value" | "target_direction">
  >,
): Map<string, HabitLogStatus> {
  const sorted = [...logs].sort((a, b) => b.entry_datetime.localeCompare(a.entry_datetime));
  const statusByOccurrence = new Map<string, HabitLogStatus>();
  const habitsById = habits
    ? new Map(habits.map((habit) => [habit.id, habit]))
    : undefined;

  for (const log of sorted) {
    if (log.source_type !== "habit" || !log.source_id) continue;

    const key = habitStatusKey(log.source_id, log.entry_date);
    if (!statusByOccurrence.has(key)) {
      statusByOccurrence.set(key, statusFromLog(log, habitsById));
    }
  }

  return statusByOccurrence;
}

export const getHabitLogStatusMap = getHabitOccurrenceStatusMap;
