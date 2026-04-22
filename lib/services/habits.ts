import { toast } from "sonner";

import { supabase } from "@/supabase/client";

import type { Habit, HabitGoalLink } from "../types";
import type { ServiceContext } from "./context";

export const habitsService = {
  list: async (ctx: ServiceContext): Promise<Habit[]> => {
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", ctx.userId)
      .eq("is_active", true)
      .order("created_at");
    if (error) throw error;
    return (data ?? []) as Habit[];
  },

  get: async (ctx: ServiceContext, id: string): Promise<Habit | undefined> => {
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", ctx.userId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as Habit | undefined;
  },

  create: async (
    ctx: ServiceContext,
    data: Omit<Habit, "id" | "created_at" | "updated_at">,
  ): Promise<Habit> => {
    try {
      const { data: row, error } = await supabase
        .from("habits")
        .insert({ ...data, user_id: ctx.userId })
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

  update: async (ctx: ServiceContext, id: string, data: Partial<Habit>): Promise<Habit> => {
    try {
      const { data: row, error } = await supabase
        .from("habits")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("user_id", ctx.userId)
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

  archive: async (ctx: ServiceContext, id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("habits")
        .update({ is_active: false })
        .eq("user_id", ctx.userId)
        .eq("id", id);
      if (error) throw error;
      console.log("[habits] archive succeeded", id);
    } catch (err) {
      toast.error("Failed to archive habit");
      console.error("[habits] archive failed", err);
      throw err;
    }
  },

  getLinkedGoalIds: async (_ctx: ServiceContext, habitId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("habit_goal_links")
      .select("goal_id")
      .eq("habit_id", habitId);
    if (error) throw error;
    return (data ?? []).map((r: { goal_id: string }) => r.goal_id);
  },

  listGoalLinksForHabitIds: async (
    _ctx: ServiceContext,
    habitIds: string[],
  ): Promise<HabitGoalLink[]> => {
    if (habitIds.length === 0) return [];
    const { data, error } = await supabase
      .from("habit_goal_links")
      .select("*")
      .in("habit_id", habitIds);
    if (error) throw error;
    return (data ?? []) as HabitGoalLink[];
  },

  listGoalLinks: async (ctx: ServiceContext): Promise<HabitGoalLink[]> => {
    const habitRows = await habitsService.list(ctx);
    if (habitRows.length === 0) return [];
    return habitsService.listGoalLinksForHabitIds(
      ctx,
      habitRows.map((h) => h.id),
    );
  },

  linkGoal: async (_ctx: ServiceContext, habitId: string, goalId: string): Promise<void> => {
    const { error } = await supabase
      .from("habit_goal_links")
      .upsert({ habit_id: habitId, goal_id: goalId });
    if (error) throw error;
  },

  unlinkGoal: async (_ctx: ServiceContext, habitId: string, goalId: string): Promise<void> => {
    const { error } = await supabase
      .from("habit_goal_links")
      .delete()
      .match({ habit_id: habitId, goal_id: goalId });
    if (error) throw error;
  },
};
