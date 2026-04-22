import { supabase } from "@/supabase/client";

export interface ServiceContext {
  userId: string;
}

export async function getServiceContext(): Promise<ServiceContext> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Not authenticated");

  return {
    userId: user.id,
  };
}
