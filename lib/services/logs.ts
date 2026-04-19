import { supabase } from "@/supabase/client";

import type { LogEntry } from "../types";

export const logsService = {
  list: async (): Promise<LogEntry[]> => {
    const { data, error } = await supabase
      .from("log_entries")
      .select("*")
      .order("entry_datetime", { ascending: false });
    if (error) throw error;
    return (data ?? []) as LogEntry[];
  },

  forSource: async (sourceId: string): Promise<LogEntry[]> => {
    const { data, error } = await supabase
      .from("log_entries")
      .select("*")
      .eq("source_id", sourceId);
    if (error) throw error;
    return (data ?? []) as LogEntry[];
  },

  forDateRange: async (start: string, end: string): Promise<LogEntry[]> => {
    const { data, error } = await supabase
      .from("log_entries")
      .select("*")
      .gte("entry_date", start)
      .lte("entry_date", end);
    if (error) throw error;
    return (data ?? []) as LogEntry[];
  },

  create: async (
    data: Omit<LogEntry, "id" | "created_at" | "updated_at">,
  ): Promise<LogEntry> => {
    const { data: row, error } = await supabase
      .from("log_entries")
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return row as LogEntry;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from("log_entries").delete().eq("id", id);
    if (error) throw error;
  },
};
