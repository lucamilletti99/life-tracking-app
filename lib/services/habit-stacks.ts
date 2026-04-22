import { supabase } from "@/supabase/client";

import type { HabitStack } from "@/lib/types";

export const habitStacksService = {
  list: async (): Promise<HabitStack[]> => {
    const { data, error } = await supabase
      .from("habit_stacks")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as HabitStack[];
  },

  create: async (input: {
    preceding_habit_id: string;
    following_habit_id: string;
    sort_order?: number;
  }): Promise<HabitStack> => {
    const { data, error } = await supabase
      .from("habit_stacks")
      .insert({
        preceding_habit_id: input.preceding_habit_id,
        following_habit_id: input.following_habit_id,
        sort_order: input.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data as HabitStack;
  },
};
