import { supabase } from "@/supabase/client";

import type { WeeklyReview } from "@/lib/types";

export const weeklyReviewsService = {
  list: async (): Promise<WeeklyReview[]> => {
    const { data, error } = await supabase
      .from("weekly_reviews")
      .select("*")
      .order("week_start", { ascending: false });
    if (error) throw error;
    return (data ?? []) as WeeklyReview[];
  },

  create: async (
    data: Omit<WeeklyReview, "id" | "created_at">,
  ): Promise<WeeklyReview> => {
    const { data: row, error } = await supabase
      .from("weekly_reviews")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return row as WeeklyReview;
  },
};
