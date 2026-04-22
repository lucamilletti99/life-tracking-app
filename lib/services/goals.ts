import { toast } from "sonner";

import { supabase } from "@/supabase/client";

import type { Goal } from "../types";
import type { ServiceContext } from "./context";

export const goalsService = {
  list: async (ctx: ServiceContext): Promise<Goal[]> => {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", ctx.userId)
      .eq("is_active", true)
      .order("created_at");
    if (error) throw error;
    return (data ?? []) as Goal[];
  },

  get: async (ctx: ServiceContext, id: string): Promise<Goal | undefined> => {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", ctx.userId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as Goal | undefined;
  },

  create: async (
    ctx: ServiceContext,
    data: Omit<Goal, "id" | "created_at" | "updated_at">,
  ): Promise<Goal> => {
    try {
      const { data: row, error } = await supabase
        .from("goals")
        .insert({ ...data, user_id: ctx.userId })
        .select()
        .single();
      if (error) throw error;
      console.log("[goals] create succeeded", row);
      return row as Goal;
    } catch (err) {
      toast.error("Failed to create goal");
      console.error("[goals] create failed", err);
      throw err;
    }
  },

  update: async (ctx: ServiceContext, id: string, data: Partial<Goal>): Promise<Goal> => {
    try {
      const { data: row, error } = await supabase
        .from("goals")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("user_id", ctx.userId)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      console.log("[goals] update succeeded", row);
      return row as Goal;
    } catch (err) {
      toast.error("Failed to update goal");
      console.error("[goals] update failed", err);
      throw err;
    }
  },

  delete: async (ctx: ServiceContext, id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("user_id", ctx.userId)
        .eq("id", id);
      if (error) throw error;
      console.log("[goals] delete succeeded", id);
    } catch (err) {
      toast.error("Failed to delete goal");
      console.error("[goals] delete failed", err);
      throw err;
    }
  },

  getLinkedHabitIds: async (_ctx: ServiceContext, goalId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("habit_goal_links")
      .select("habit_id")
      .eq("goal_id", goalId);
    if (error) throw error;
    return (data ?? []).map((r: { habit_id: string }) => r.habit_id);
  },

  getLinkedTodoIds: async (_ctx: ServiceContext, goalId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("todo_goal_links")
      .select("todo_id")
      .eq("goal_id", goalId);
    if (error) throw error;
    return (data ?? []).map((r: { todo_id: string }) => r.todo_id);
  },

  linkHabit: async (_ctx: ServiceContext, goalId: string, habitId: string): Promise<void> => {
    const { error } = await supabase
      .from("habit_goal_links")
      .upsert({ goal_id: goalId, habit_id: habitId });
    if (error) throw error;
  },

  unlinkHabit: async (_ctx: ServiceContext, goalId: string, habitId: string): Promise<void> => {
    const { error } = await supabase
      .from("habit_goal_links")
      .delete()
      .match({ goal_id: goalId, habit_id: habitId });
    if (error) throw error;
  },
};
