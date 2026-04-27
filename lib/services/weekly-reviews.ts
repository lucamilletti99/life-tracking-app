import { supabase } from "@/supabase/client";
import { logError } from "@/lib/error-formatting";

import type { ServiceContext } from "@/lib/services/context";
import type { WeeklyReview } from "@/lib/types";

export const weeklyReviewsService = {
  list: async (ctx: ServiceContext): Promise<WeeklyReview[]> => {
    const { data, error } = await supabase
      .from("weekly_reviews")
      .select("*")
      .eq("user_id", ctx.userId)
      .order("week_start", { ascending: false });
    if (error) throw logError("[weekly-reviews] list failed", error, "Failed to load weekly reviews");
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

    if (error) throw logError("[weekly-reviews] create failed", error, "Failed to create weekly review");
    return row as WeeklyReview;
  },
};
