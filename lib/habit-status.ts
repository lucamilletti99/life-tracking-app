import type { LogEntry, TodoStatus } from "./types";

export const SKIPPED_LOG_NOTE = "__habit_skipped__";

export type HabitLogStatus = "complete" | "skipped";

export function habitStatusKey(habitId: string, entryDate: string): string {
  return `${habitId}|${entryDate}`;
}

function statusFromLog(log: LogEntry): HabitLogStatus {
  return log.note === SKIPPED_LOG_NOTE ? "skipped" : "complete";
}

export function getHabitLogStatusMap(logs: LogEntry[]): Map<string, HabitLogStatus> {
  const sorted = [...logs].sort((a, b) => b.entry_datetime.localeCompare(a.entry_datetime));
  const statusByOccurrence = new Map<string, HabitLogStatus>();

  for (const log of sorted) {
    if (log.source_type !== "habit" || !log.source_id) continue;

    const key = habitStatusKey(log.source_id, log.entry_date);
    if (!statusByOccurrence.has(key)) {
      statusByOccurrence.set(key, statusFromLog(log));
    }
  }

  return statusByOccurrence;
}

export function getHabitOccurrenceStatusMap(logs: LogEntry[]): Map<string, TodoStatus> {
  const map = new Map<string, TodoStatus>();
  const logMap = getHabitLogStatusMap(logs);

  for (const [key, status] of logMap.entries()) {
    map.set(key, status === "complete" ? "complete" : "skipped");
  }

  return map;
}
