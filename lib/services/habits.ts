import { toast } from "sonner";

import { supabase } from "@/supabase/client";

import type { Habit, HabitGoalLink } from "../types";
import type { ServiceContext } from "./context";

export const habitsService = {
  list: async (ctx?: ServiceContext): Promise<Habit[]> => {
    void ctx;

    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("is_active", true)
      .order("created_at");
    if (error) throw error;
    return (data ?? []) as Habit[];
  },

  get: async (
    idOrCtx: string | ServiceContext,
    maybeId?: string,
  ): Promise<Habit | undefined> => {
    const id = typeof idOrCtx === "string" ? idOrCtx : maybeId;
    if (!id) throw new Error("Habit id is required");

    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as Habit | undefined;
  },

  create: async (
    dataOrCtx: Omit<Habit, "id" | "created_at" | "updated_at"> | ServiceContext,
    maybeData?: Omit<Habit, "id" | "created_at" | "updated_at">,
  ): Promise<Habit> => {
    const data = "userId" in dataOrCtx ? maybeData : dataOrCtx;
    if (!data) throw new Error("Habit payload is required");

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

  update: async (
    idOrCtx: string | ServiceContext,
    dataOrId: Partial<Habit> | string,
    maybeData?: Partial<Habit>,
  ): Promise<Habit> => {
    const [id, data] =
      typeof idOrCtx === "string"
        ? [idOrCtx, dataOrId as Partial<Habit>]
        : [dataOrId as string, maybeData];

    if (!id || !data) throw new Error("Habit id and payload are required");

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

  archive: async (
    idOrCtx: string | ServiceContext,
    maybeId?: string,
  ): Promise<void> => {
    const id = typeof idOrCtx === "string" ? idOrCtx : maybeId;
    if (!id) throw new Error("Habit id is required");

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

  getLinkedGoalIds: async (
    habitIdOrCtx: string | ServiceContext,
    maybeHabitId?: string,
  ): Promise<string[]> => {
    const habitId = typeof habitIdOrCtx === "string" ? habitIdOrCtx : maybeHabitId;
    if (!habitId) throw new Error("Habit id is required");

    const { data, error } = await supabase
      .from("habit_goal_links")
      .select("goal_id")
      .eq("habit_id", habitId);
    if (error) throw error;
    return (data ?? []).map((r: { goal_id: string }) => r.goal_id);
  },

  listGoalLinks: async (ctx?: ServiceContext): Promise<HabitGoalLink[]> => {
    void ctx;

    const { data, error } = await supabase.from("habit_goal_links").select("*");
    if (error) throw error;
    return (data ?? []) as HabitGoalLink[];
  },

  linkGoal: async (
    habitIdOrCtx: string | ServiceContext,
    goalIdOrHabitId: string,
    maybeGoalId?: string,
  ): Promise<void> => {
    const [habitId, goalId] =
      typeof habitIdOrCtx === "string"
        ? [habitIdOrCtx, goalIdOrHabitId]
        : [goalIdOrHabitId, maybeGoalId];

    if (!habitId || !goalId) throw new Error("Habit and goal ids are required");

    const { error } = await supabase
      .from("habit_goal_links")
      .upsert({ habit_id: habitId, goal_id: goalId });
    if (error) throw error;
  },

  unlinkGoal: async (
    habitIdOrCtx: string | ServiceContext,
    goalIdOrHabitId: string,
    maybeGoalId?: string,
  ): Promise<void> => {
    const [habitId, goalId] =
      typeof habitIdOrCtx === "string"
        ? [habitIdOrCtx, goalIdOrHabitId]
        : [goalIdOrHabitId, maybeGoalId];

    if (!habitId || !goalId) throw new Error("Habit and goal ids are required");

    const { error } = await supabase
      .from("habit_goal_links")
      .delete()
      .match({ habit_id: habitId, goal_id: goalId });
    if (error) throw error;
  },
};
