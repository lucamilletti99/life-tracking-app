import { toast } from "sonner";

import { supabase } from "@/supabase/client";

import {
  MEASUREMENT_UNIT_REQUIRED_MESSAGE,
  prepareHabitCreatePayload,
  serializeHabitUpdatePayload,
} from "@/lib/habit-validation";
import { logError } from "@/lib/error-formatting";

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
    if (error) throw logError("[habits] list failed", error, "Failed to load habits");
    return (data ?? []) as Habit[];
  },

  get: async (ctx: ServiceContext, id: string): Promise<Habit | undefined> => {
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", ctx.userId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw logError("[habits] get failed", error, "Failed to load habit");
    return data as Habit | undefined;
  },

  create: async (
    ctx: ServiceContext,
    data: Omit<Habit, "id" | "created_at" | "updated_at">,
  ): Promise<Habit> => {

    try {
      const payload = prepareHabitCreatePayload(data);
      const { data: row, error } = await supabase
        .from("habits")
        .insert({ ...payload, user_id: ctx.userId })
        .select()
        .single();
      if (error) throw error;
      console.log("[habits] create succeeded", row);
      return row as Habit;
    } catch (err) {
      if (err instanceof Error && err.message === MEASUREMENT_UNIT_REQUIRED_MESSAGE) {
        toast.error(err.message);
      } else {
        toast.error("Failed to create habit");
      }
      throw logError("[habits] create failed", err, "Failed to create habit");
    }
  },

  update: async (ctx: ServiceContext, id: string, data: Partial<Habit>): Promise<Habit> => {
    try {
      const current = await habitsService.get(ctx, id);
      if (!current) {
        throw new Error("Habit not found");
      }
      const payload = serializeHabitUpdatePayload(current, data);
      const { data: row, error } = await supabase
        .from("habits")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("user_id", ctx.userId)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      console.log("[habits] update succeeded", row);
      return row as Habit;
    } catch (err) {
      if (err instanceof Error && err.message === MEASUREMENT_UNIT_REQUIRED_MESSAGE) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update habit");
      }
      throw logError("[habits] update failed", err, "Failed to update habit");
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
      throw logError("[habits] archive failed", err, "Failed to archive habit");
    }
  },

  getLinkedGoalIds: async (_ctx: ServiceContext, habitId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("habit_goal_links")
      .select("goal_id")
      .eq("habit_id", habitId);
    if (error) throw logError("[habits] get linked goals failed", error, "Failed to load habit links");
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
    if (error) throw logError("[habits] list goal links failed", error, "Failed to load habit links");
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
    if (error) throw logError("[habits] link goal failed", error, "Failed to link goal");
  },

  unlinkGoal: async (_ctx: ServiceContext, habitId: string, goalId: string): Promise<void> => {
    const { error } = await supabase
      .from("habit_goal_links")
      .delete()
      .match({ habit_id: habitId, goal_id: goalId });
    if (error) throw logError("[habits] unlink goal failed", error, "Failed to unlink goal");
  },
};
