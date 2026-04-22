import { toast } from "sonner";

import { supabase } from "@/supabase/client";

import type { LogEntry } from "../types";
import type { ServiceContext } from "./context";

export const logsService = {
  list: async (ctx?: ServiceContext): Promise<LogEntry[]> => {
    void ctx;

    const { data, error } = await supabase
      .from("log_entries")
      .select("*")
      .order("entry_datetime", { ascending: false });
    if (error) throw error;
    return (data ?? []) as LogEntry[];
  },

  forSource: async (
    sourceIdOrCtx: string | ServiceContext,
    maybeSourceId?: string,
  ): Promise<LogEntry[]> => {
    const sourceId = typeof sourceIdOrCtx === "string" ? sourceIdOrCtx : maybeSourceId;
    if (!sourceId) throw new Error("Source id is required");

    const { data, error } = await supabase
      .from("log_entries")
      .select("*")
      .eq("source_id", sourceId);
    if (error) throw error;
    return (data ?? []) as LogEntry[];
  },

  forDateRange: async (
    startOrCtx: string | ServiceContext,
    endOrStart: string,
    maybeEnd?: string,
  ): Promise<LogEntry[]> => {
    const [start, end] =
      typeof startOrCtx === "string"
        ? [startOrCtx, endOrStart]
        : [endOrStart, maybeEnd];

    if (!start || !end) throw new Error("Start and end dates are required");

    const { data, error } = await supabase
      .from("log_entries")
      .select("*")
      .gte("entry_date", start)
      .lte("entry_date", end);
    if (error) throw error;
    return (data ?? []) as LogEntry[];
  },

  create: async (
    dataOrCtx: Omit<LogEntry, "id" | "created_at" | "updated_at"> | ServiceContext,
    maybeData?: Omit<LogEntry, "id" | "created_at" | "updated_at">,
  ): Promise<LogEntry> => {
    const data = "userId" in dataOrCtx ? maybeData : dataOrCtx;
    if (!data) throw new Error("Log payload is required");

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

  delete: async (
    idOrCtx: string | ServiceContext,
    maybeId?: string,
  ): Promise<void> => {
    const id = typeof idOrCtx === "string" ? idOrCtx : maybeId;
    if (!id) throw new Error("Log id is required");

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
