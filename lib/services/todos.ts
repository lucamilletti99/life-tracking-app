import { supabase } from "@/supabase/client";

import type { Todo } from "../types";

export const todosService = {
  list: async (): Promise<Todo[]> => {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .order("start_datetime");
    if (error) throw error;
    return (data ?? []) as Todo[];
  },

  get: async (id: string): Promise<Todo | undefined> => {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as Todo | undefined;
  },

  forDateRange: async (start: string, end: string): Promise<Todo[]> => {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .gte("start_datetime", start)
      .lt("start_datetime", end);
    if (error) throw error;
    return (data ?? []) as Todo[];
  },

  create: async (
    data: Omit<Todo, "id" | "created_at" | "updated_at">,
  ): Promise<Todo> => {
    const { data: row, error } = await supabase
      .from("todos")
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return row as Todo;
  },

  update: async (id: string, data: Partial<Todo>): Promise<Todo> => {
    const { data: row, error } = await supabase
      .from("todos")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return row as Todo;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) throw error;
  },
};
