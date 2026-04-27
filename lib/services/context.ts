import { supabase } from "@/supabase/client";
import { logError } from "@/lib/error-formatting";

export interface ServiceContext {
  userId: string;
}

export async function getServiceContext(): Promise<ServiceContext> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw logError("[auth] get user failed", error, "Not authenticated");
  if (!user) throw new Error("Not authenticated");

  return {
    userId: user.id,
  };
}
