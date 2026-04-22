import type { LogEntry, TodoStatus } from "./types";

export const SKIPPED_LOG_NOTE = "__habit_skipped__";

export function habitStatusKey(habitId: string, entryDate: string): string {
  return `${habitId}|${entryDate}`;
}

function statusFromLog(log: LogEntry): TodoStatus {
  return log.note === SKIPPED_LOG_NOTE ? "skipped" : "complete";
}

export function getHabitOccurrenceStatusMap(logs: LogEntry[]): Map<string, TodoStatus> {
  const sorted = [...logs].sort((a, b) => b.entry_datetime.localeCompare(a.entry_datetime));
  const statusByOccurrence = new Map<string, TodoStatus>();

  for (const log of sorted) {
    if (log.source_type !== "habit" || !log.source_id) continue;

    const key = habitStatusKey(log.source_id, log.entry_date);
    if (!statusByOccurrence.has(key)) {
      statusByOccurrence.set(key, statusFromLog(log));
    }
  }

  return statusByOccurrence;
}
