import type { LogEntry } from "../types";
import { mockLogs } from "../mock-data";

let logs = [...mockLogs];

export const logsService = {
  list: (): LogEntry[] => logs,
  forSource: (sourceId: string): LogEntry[] =>
    logs.filter((l) => l.source_id === sourceId),
  forDateRange: (start: string, end: string): LogEntry[] =>
    logs.filter((l) => l.entry_date >= start && l.entry_date <= end),
  create: (
    data: Omit<LogEntry, "id" | "created_at" | "updated_at">,
  ): LogEntry => {
    const entry: LogEntry = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    logs = [...logs, entry];
    return entry;
  },
  delete: (id: string): void => {
    logs = logs.filter((l) => l.id !== id);
  },
};
