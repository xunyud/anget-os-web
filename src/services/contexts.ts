import type { SupabaseClient } from "@supabase/supabase-js";
import type { Context, ContextInsert, ContextUpdate } from "@/types/database";

// ---------------------------------------------------------------------------
// Context data access layer
// ---------------------------------------------------------------------------

/** Fetch all contexts, newest first. */
export async function getContexts(client: SupabaseClient): Promise<Context[]> {
  const { data, error } = await client
    .from("contexts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data as Context[];
}

/** Fetch a single context by ID. */
export async function getContext(
  client: SupabaseClient,
  id: string,
): Promise<Context | null> {
  const { data, error } = await client
    .from("contexts")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data as Context | null;
}

/** Create a new context document. */
export async function createContext(
  client: SupabaseClient,
  ctx: ContextInsert,
): Promise<Context> {
  const { data, error } = await client
    .from("contexts")
    .insert(ctx)
    .select()
    .single();

  if (error) throw error;
  return data as Context;
}

/** Update an existing context document. */
export async function updateContext(
  client: SupabaseClient,
  id: string,
  updates: ContextUpdate,
): Promise<Context> {
  const { data, error } = await client
    .from("contexts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Context;
}
