import { toast } from "sonner";

import { supabase } from "@/supabase/client";

import type { Todo, TodoGoalLink } from "../types";
import type { ServiceContext } from "./context";

export const todosService = {
  list: async (ctx?: ServiceContext): Promise<Todo[]> => {
    void ctx;

    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .order("start_datetime");
    if (error) throw error;
    return (data ?? []) as Todo[];
  },

  get: async (
    idOrCtx: string | ServiceContext,
    maybeId?: string,
  ): Promise<Todo | undefined> => {
    const id = typeof idOrCtx === "string" ? idOrCtx : maybeId;
    if (!id) throw new Error("Todo id is required");

    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as Todo | undefined;
  },

  forDateRange: async (
    startOrCtx: string | ServiceContext,
    endOrStart: string,
    maybeEnd?: string,
  ): Promise<Todo[]> => {
    const [start, end] =
      typeof startOrCtx === "string"
        ? [startOrCtx, endOrStart]
        : [endOrStart, maybeEnd];

    if (!start || !end) throw new Error("Start and end dates are required");

    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .gte("start_datetime", start)
      .lt("start_datetime", end);
    if (error) throw error;
    return (data ?? []) as Todo[];
  },

  create: async (
    dataOrCtx: Omit<Todo, "id" | "created_at" | "updated_at"> | ServiceContext,
    maybeData?: Omit<Todo, "id" | "created_at" | "updated_at">,
  ): Promise<Todo> => {
    const data =
      "userId" in dataOrCtx ? maybeData : dataOrCtx;
    if (!data) throw new Error("Todo payload is required");

    try {
      const { data: row, error } = await supabase
        .from("todos")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      console.log("[todos] create succeeded", row);
      return row as Todo;
    } catch (err) {
      toast.error("Failed to create todo");
      console.error("[todos] create failed", err);
      throw err;
    }
  },

  update: async (
    idOrCtx: string | ServiceContext,
    dataOrId: Partial<Todo> | string,
    maybeData?: Partial<Todo>,
  ): Promise<Todo> => {
    const [id, data] =
      typeof idOrCtx === "string"
        ? [idOrCtx, dataOrId as Partial<Todo>]
        : [dataOrId as string, maybeData];

    if (!id || !data) throw new Error("Todo id and payload are required");

    try {
      const { data: row, error } = await supabase
        .from("todos")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      console.log("[todos] update succeeded", row);
      return row as Todo;
    } catch (err) {
      toast.error("Failed to update todo");
      console.error("[todos] update failed", err);
      throw err;
    }
  },

  listGoalLinks: async (): Promise<TodoGoalLink[]> => {
    const { data, error } = await supabase.from("todo_goal_links").select("*");
    if (error) throw error;
    return (data ?? []) as TodoGoalLink[];
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from("todos").delete().eq("id", id);
      if (error) throw error;
      console.log("[todos] delete succeeded", id);
    } catch (err) {
      toast.error("Failed to delete todo");
      console.error("[todos] delete failed", err);
      throw err;
    }
  },
};
