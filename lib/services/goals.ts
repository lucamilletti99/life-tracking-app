import { toast } from "sonner";

import { supabase } from "@/supabase/client";

import type { Goal } from "../types";
import type { ServiceContext } from "./context";

export const goalsService = {
  list: async (ctx?: ServiceContext): Promise<Goal[]> => {
    void ctx;

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("is_active", true)
      .order("created_at");
    if (error) throw error;
    return (data ?? []) as Goal[];
  },

  get: async (
    idOrCtx: string | ServiceContext,
    maybeId?: string,
  ): Promise<Goal | undefined> => {
    const id = typeof idOrCtx === "string" ? idOrCtx : maybeId;
    if (!id) throw new Error("Goal id is required");

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as Goal | undefined;
  },

  create: async (
    dataOrCtx: Omit<Goal, "id" | "created_at" | "updated_at"> | ServiceContext,
    maybeData?: Omit<Goal, "id" | "created_at" | "updated_at">,
  ): Promise<Goal> => {
    const data = "userId" in dataOrCtx ? maybeData : dataOrCtx;
    if (!data) throw new Error("Goal payload is required");

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

  update: async (
    idOrCtx: string | ServiceContext,
    dataOrId: Partial<Goal> | string,
    maybeData?: Partial<Goal>,
  ): Promise<Goal> => {
    const [id, data] =
      typeof idOrCtx === "string"
        ? [idOrCtx, dataOrId as Partial<Goal>]
        : [dataOrId as string, maybeData];

    if (!id || !data) throw new Error("Goal id and payload are required");

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

  delete: async (
    idOrCtx: string | ServiceContext,
    maybeId?: string,
  ): Promise<void> => {
    const id = typeof idOrCtx === "string" ? idOrCtx : maybeId;
    if (!id) throw new Error("Goal id is required");

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

  getLinkedHabitIds: async (
    goalIdOrCtx: string | ServiceContext,
    maybeGoalId?: string,
  ): Promise<string[]> => {
    const goalId = typeof goalIdOrCtx === "string" ? goalIdOrCtx : maybeGoalId;
    if (!goalId) throw new Error("Goal id is required");

    const { data, error } = await supabase
      .from("habit_goal_links")
      .select("habit_id")
      .eq("goal_id", goalId);
    if (error) throw error;
    return (data ?? []).map((r: { habit_id: string }) => r.habit_id);
  },

  getLinkedTodoIds: async (
    goalIdOrCtx: string | ServiceContext,
    maybeGoalId?: string,
  ): Promise<string[]> => {
    const goalId = typeof goalIdOrCtx === "string" ? goalIdOrCtx : maybeGoalId;
    if (!goalId) throw new Error("Goal id is required");

    const { data, error } = await supabase
      .from("todo_goal_links")
      .select("todo_id")
      .eq("goal_id", goalId);
    if (error) throw error;
    return (data ?? []).map((r: { todo_id: string }) => r.todo_id);
  },

  linkHabit: async (
    goalIdOrCtx: string | ServiceContext,
    habitIdOrGoalId: string,
    maybeHabitId?: string,
  ): Promise<void> => {
    const [goalId, habitId] =
      typeof goalIdOrCtx === "string"
        ? [goalIdOrCtx, habitIdOrGoalId]
        : [habitIdOrGoalId, maybeHabitId];

    if (!goalId || !habitId) throw new Error("Goal and habit ids are required");

    const { error } = await supabase
      .from("habit_goal_links")
      .upsert({ goal_id: goalId, habit_id: habitId });
    if (error) throw error;
  },

  unlinkHabit: async (
    goalIdOrCtx: string | ServiceContext,
    habitIdOrGoalId: string,
    maybeHabitId?: string,
  ): Promise<void> => {
    const [goalId, habitId] =
      typeof goalIdOrCtx === "string"
        ? [goalIdOrCtx, habitIdOrGoalId]
        : [habitIdOrGoalId, maybeHabitId];

    if (!goalId || !habitId) throw new Error("Goal and habit ids are required");

    const { error } = await supabase
      .from("habit_goal_links")
      .delete()
      .match({ goal_id: goalId, habit_id: habitId });
    if (error) throw error;
  },
};
