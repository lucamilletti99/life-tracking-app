import { toast } from "sonner";

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
    try {
      const { data: row, error } = await supabase
        .from("log_entries")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      console.log("[logs] create succeeded", row);
      return row as LogEntry;
    } catch (err) {
      toast.error("Failed to save log");
      console.error("[logs] create failed", err);
      throw err;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from("log_entries").delete().eq("id", id);
      if (error) throw error;
      console.log("[logs] delete succeeded", id);
    } catch (err) {
      toast.error("Failed to delete log");
      console.error("[logs] delete failed", err);
      throw err;
    }
  },
};
