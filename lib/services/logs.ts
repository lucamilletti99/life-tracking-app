import { toast } from "sonner";

import { supabase } from "@/supabase/client";

import type { LogEntry } from "../types";
import type { ServiceContext } from "./context";

export const logsService = {
  list: async (ctx: ServiceContext): Promise<LogEntry[]> => {
    const { data, error } = await supabase
      .from("log_entries")
      .select("*")
      .eq("user_id", ctx.userId)
      .order("entry_datetime", { ascending: false });
    if (error) throw error;
    return (data ?? []) as LogEntry[];
  },

  forSource: async (ctx: ServiceContext, sourceId: string): Promise<LogEntry[]> => {
    const { data, error } = await supabase
      .from("log_entries")
      .select("*")
      .eq("user_id", ctx.userId)
      .eq("source_id", sourceId);
    if (error) throw error;
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
    if (error) throw error;
    return (data ?? []) as LogEntry[];
  },

  create: async (
    ctx: ServiceContext,
    data: Omit<LogEntry, "id" | "created_at" | "updated_at" | "goal_ids"> & { goal_ids?: string[] },
  ): Promise<LogEntry> => {
    const data = "userId" in dataOrCtx ? maybeData : dataOrCtx;
    if (!data) throw new Error("Log payload is required");

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
      console.error("[logs] create failed", err);
      throw err;
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
      console.error("[logs] delete failed", err);
      throw err;
    }
  },
};
