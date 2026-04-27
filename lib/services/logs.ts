import { toast } from "sonner";

import { supabase } from "@/supabase/client";
import { logError } from "@/lib/error-formatting";

import type { LogEntry } from "../types";
import type { ServiceContext } from "./context";

export const logsService = {
  list: async (
    ctx: ServiceContext,
    options?: { since?: string },
  ): Promise<LogEntry[]> => {
    let query = supabase
      .from("log_entries")
      .select("*")
      .eq("user_id", ctx.userId)
      .order("entry_datetime", { ascending: false });
    if (options?.since) {
      query = query.gte("entry_date", options.since);
    }
    const { data, error } = await query;
    if (error) throw logError("[logs] list failed", error, "Failed to load logs");
    return (data ?? []) as LogEntry[];
  },

  forSource: async (ctx: ServiceContext, sourceId: string): Promise<LogEntry[]> => {
    const { data, error } = await supabase
      .from("log_entries")
      .select("*")
      .eq("user_id", ctx.userId)
      .eq("source_id", sourceId);
    if (error) throw logError("[logs] list by source failed", error, "Failed to load logs");
    return (data ?? []) as LogEntry[];
  },

  forDateRange: async (
    ctx: ServiceContext,
    start: string,
    end: string,
  ): Promise<LogEntry[]> => {
    const { data, error } = await supabase
      .from("log_entries")
      .select("*")
      .eq("user_id", ctx.userId)
      .gte("entry_date", start)
      .lte("entry_date", end);
    if (error) throw logError("[logs] list by date range failed", error, "Failed to load logs");
    return (data ?? []) as LogEntry[];
  },

  create: async (
    ctx: ServiceContext,
    data: Omit<LogEntry, "id" | "created_at" | "updated_at" | "goal_ids"> & { goal_ids?: string[] },
  ): Promise<LogEntry> => {

    try {
      const { data: row, error } = await supabase
        .from("log_entries")
        .insert({ ...data, goal_ids: data.goal_ids ?? [], user_id: ctx.userId })
        .select()
        .single();
      if (error) throw error;
      console.log("[logs] create succeeded", row);
      return row as LogEntry;
    } catch (err) {
      toast.error("Failed to save log");
      throw logError("[logs] create failed", err, "Failed to save log");
    }
  },

  delete: async (ctx: ServiceContext, id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("log_entries")
        .delete()
        .eq("user_id", ctx.userId)
        .eq("id", id);
      if (error) throw error;
      console.log("[logs] delete succeeded", id);
    } catch (err) {
      toast.error("Failed to delete log");
      throw logError("[logs] delete failed", err, "Failed to delete log");
    }
  },
};
