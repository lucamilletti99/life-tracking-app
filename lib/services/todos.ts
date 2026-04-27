import { toast } from "sonner";

import { supabase } from "@/supabase/client";
import { logError } from "@/lib/error-formatting";

import type { Todo, TodoGoalLink } from "../types";
import type { ServiceContext } from "./context";

export const todosService = {
  list: async (ctx: ServiceContext): Promise<Todo[]> => {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", ctx.userId)
      .order("start_datetime");
    if (error) throw logError("[todos] list failed", error, "Failed to load todos");
    return (data ?? []) as Todo[];
  },

  get: async (ctx: ServiceContext, id: string): Promise<Todo | undefined> => {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", ctx.userId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw logError("[todos] get failed", error, "Failed to load todo");
    return data as Todo | undefined;
  },

  forDateRange: async (
    ctx: ServiceContext,
    start: string,
    end: string,
  ): Promise<Todo[]> => {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", ctx.userId)
      .gte("start_datetime", start)
      .lte("start_datetime", end);
    if (error) throw logError("[todos] list by date range failed", error, "Failed to load todos");
    return (data ?? []) as Todo[];
  },

  listGoalLinksForIds: async (
    _ctx: ServiceContext,
    todoIds: string[],
  ): Promise<TodoGoalLink[]> => {
    if (todoIds.length === 0) return [];
    const { data, error } = await supabase
      .from("todo_goal_links")
      .select("*")
      .in("todo_id", todoIds);
    if (error) throw logError("[todos] list goal links failed", error, "Failed to load todo links");
    return (data ?? []) as TodoGoalLink[];
  },

  listGoalLinks: async (ctx: ServiceContext): Promise<TodoGoalLink[]> => {
    const todos = await todosService.list(ctx);
    return todosService.listGoalLinksForIds(
      ctx,
      todos.map((t) => t.id),
    );
  },

  create: async (
    ctx: ServiceContext,
    data: Omit<Todo, "id" | "created_at" | "updated_at">,
  ): Promise<Todo> => {

    try {
      const { data: row, error } = await supabase
        .from("todos")
        .insert({ ...data, user_id: ctx.userId })
        .select()
        .single();
      if (error) throw error;
      console.log("[todos] create succeeded", row);
      return row as Todo;
    } catch (err) {
      toast.error("Failed to create todo");
      throw logError("[todos] create failed", err, "Failed to create todo");
    }
  },

  update: async (ctx: ServiceContext, id: string, data: Partial<Todo>): Promise<Todo> => {
    try {
      const { data: row, error } = await supabase
        .from("todos")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("user_id", ctx.userId)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      console.log("[todos] update succeeded", row);
      return row as Todo;
    } catch (err) {
      toast.error("Failed to update todo");
      throw logError("[todos] update failed", err, "Failed to update todo");
    }
  },

  delete: async (ctx: ServiceContext, id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("todos")
        .delete()
        .eq("user_id", ctx.userId)
        .eq("id", id);
      if (error) throw error;
      console.log("[todos] delete succeeded", id);
    } catch (err) {
      toast.error("Failed to delete todo");
      throw logError("[todos] delete failed", err, "Failed to delete todo");
    }
  },
};
