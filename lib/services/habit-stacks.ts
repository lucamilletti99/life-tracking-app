import { supabase } from "@/supabase/client";
import { logError } from "@/lib/error-formatting";

import type { ServiceContext } from "@/lib/services/context";
import type { HabitStack } from "@/lib/types";

export const habitStacksService = {
  list: async (ctx: ServiceContext): Promise<HabitStack[]> => {
    const { data, error } = await supabase
      .from("habit_stacks")
      .select("*")
      .eq("user_id", ctx.userId)
      .order("sort_order");
    if (error) throw logError("[habit-stacks] list failed", error, "Failed to load habit stacks");
    return (data ?? []) as HabitStack[];
  },

  create: async (ctx: ServiceContext, input: {
    preceding_habit_id: string;
    following_habit_id: string;
    sort_order?: number;
  }): Promise<HabitStack> => {
    const { data, error } = await supabase
      .from("habit_stacks")
      .insert({
        user_id: ctx.userId,
        preceding_habit_id: input.preceding_habit_id,
        following_habit_id: input.following_habit_id,
        sort_order: input.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) throw logError("[habit-stacks] create failed", error, "Failed to create habit stack");
    return data as HabitStack;
  },
};
