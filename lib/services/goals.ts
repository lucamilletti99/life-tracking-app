import { toast } from "sonner";

import { supabase } from "@/supabase/client";

import type { Goal } from "../types";

export const goalsService = {
  list: async (): Promise<Goal[]> => {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("is_active", true)
      .order("created_at");
    if (error) throw error;
    return (data ?? []) as Goal[];
  },

  get: async (id: string): Promise<Goal | undefined> => {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as Goal | undefined;
  },

  create: async (
    data: Omit<Goal, "id" | "created_at" | "updated_at">,
  ): Promise<Goal> => {
    try {
      const { data: row, error } = await supabase
        .from("goals")
        .insert(data)
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

  update: async (id: string, data: Partial<Goal>): Promise<Goal> => {
    try {
      const { data: row, error } = await supabase
        .from("goals")
        .update({ ...data, updated_at: new Date().toISOString() })
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

  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
      console.log("[goals] delete succeeded", id);
    } catch (err) {
      toast.error("Failed to delete goal");
      console.error("[goals] delete failed", err);
      throw err;
    }
  },

  getLinkedHabitIds: async (goalId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("habit_goal_links")
      .select("habit_id")
      .eq("goal_id", goalId);
    if (error) throw error;
    return (data ?? []).map((r: { habit_id: string }) => r.habit_id);
  },

  getLinkedTodoIds: async (goalId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("todo_goal_links")
      .select("todo_id")
      .eq("goal_id", goalId);
    if (error) throw error;
    return (data ?? []).map((r: { todo_id: string }) => r.todo_id);
  },

  linkHabit: async (goalId: string, habitId: string): Promise<void> => {
    const { error } = await supabase
      .from("habit_goal_links")
      .upsert({ goal_id: goalId, habit_id: habitId });
    if (error) throw error;
  },

  unlinkHabit: async (goalId: string, habitId: string): Promise<void> => {
    const { error } = await supabase
      .from("habit_goal_links")
      .delete()
      .match({ goal_id: goalId, habit_id: habitId });
    if (error) throw error;
  },
};
