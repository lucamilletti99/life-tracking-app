import { toast } from "sonner";

import { supabase } from "@/supabase/client";

import type { Habit, HabitGoalLink } from "../types";

export const habitsService = {
  list: async (): Promise<Habit[]> => {
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("is_active", true)
      .order("created_at");
    if (error) throw error;
    return (data ?? []) as Habit[];
  },

  get: async (id: string): Promise<Habit | undefined> => {
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as Habit | undefined;
  },

  create: async (
    data: Omit<Habit, "id" | "created_at" | "updated_at">,
  ): Promise<Habit> => {
    try {
      const { data: row, error } = await supabase
        .from("habits")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      console.log("[habits] create succeeded", row);
      return row as Habit;
    } catch (err) {
      toast.error("Failed to create habit");
      console.error("[habits] create failed", err);
      throw err;
    }
  },

  update: async (id: string, data: Partial<Habit>): Promise<Habit> => {
    try {
      const { data: row, error } = await supabase
        .from("habits")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      console.log("[habits] update succeeded", row);
      return row as Habit;
    } catch (err) {
      toast.error("Failed to update habit");
      console.error("[habits] update failed", err);
      throw err;
    }
  },

  archive: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("habits")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
      console.log("[habits] archive succeeded", id);
    } catch (err) {
      toast.error("Failed to archive habit");
      console.error("[habits] archive failed", err);
      throw err;
    }
  },

  getLinkedGoalIds: async (habitId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("habit_goal_links")
      .select("goal_id")
      .eq("habit_id", habitId);
    if (error) throw error;
    return (data ?? []).map((r: { goal_id: string }) => r.goal_id);
  },

  listGoalLinks: async (): Promise<HabitGoalLink[]> => {
    const { data, error } = await supabase.from("habit_goal_links").select("*");
    if (error) throw error;
    return (data ?? []) as HabitGoalLink[];
  },

  linkGoal: async (habitId: string, goalId: string): Promise<void> => {
    const { error } = await supabase
      .from("habit_goal_links")
      .upsert({ habit_id: habitId, goal_id: goalId });
    if (error) throw error;
  },

  unlinkGoal: async (habitId: string, goalId: string): Promise<void> => {
    const { error } = await supabase
      .from("habit_goal_links")
      .delete()
      .match({ habit_id: habitId, goal_id: goalId });
    if (error) throw error;
  },
};
