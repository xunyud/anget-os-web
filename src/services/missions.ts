import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Mission,
  MissionInsert,
  MissionStatus,
} from "@/types/database";

// ---------------------------------------------------------------------------
// Mission data access layer
// All Supabase interactions for the missions table live here.
// Components should NEVER call Supabase directly.
// ---------------------------------------------------------------------------

/** Fetch all missions, ordered by priority (desc) then created_at (asc). */
export async function getMissions(client: SupabaseClient): Promise<Mission[]> {
  const { data, error } = await client
    .from("missions")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Mission[];
}

/** Fetch a single mission by ID. */
export async function getMission(
  client: SupabaseClient,
  id: string,
): Promise<Mission | null> {
  const { data, error } = await client
    .from("missions")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data as Mission | null;
}

/** Create a new mission. */
export async function createMission(
  client: SupabaseClient,
  mission: MissionInsert,
): Promise<Mission> {
  const { data, error } = await client
    .from("missions")
    .insert(mission)
    .select()
    .single();

  if (error) throw error;
  return data as Mission;
}

/**
 * Update mission status with optimistic-lock version check.
 * Returns the updated mission, or null if version conflict (caller should 409).
 */
export async function updateMissionStatus(
  client: SupabaseClient,
  id: string,
  status: MissionStatus,
  expectedVersion: number,
): Promise<Mission | null> {
  const { data, error } = await client
    .from("missions")
    .update({
      status,
      version: expectedVersion + 1,
    })
    .eq("id", id)
    .eq("version", expectedVersion)
    .select()
    .single();

  // PGRST116 = no rows returned → version mismatch (conflict)
  if (error && error.code === "PGRST116") return null;
  if (error) throw error;
  return data as Mission;
}

/** Fetch missions filtered by status. */
export async function getMissionsByStatus(
  client: SupabaseClient,
  status: MissionStatus,
): Promise<Mission[]> {
  const { data, error } = await client
    .from("missions")
    .select("*")
    .eq("status", status)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Mission[];
}
