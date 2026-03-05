"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getMissions,
  createMission,
  updateMissionStatus,
} from "@/services/missions";
import type { Mission, MissionInsert, MissionStatus } from "@/types/database";

/**
 * Server Actions for mission operations.
 * Uses admin client (service_role) — runs server-side only.
 * Once Auth is integrated, switch to per-user server client.
 */

export async function fetchMissions(): Promise<Mission[]> {
  const client = createAdminClient();
  return getMissions(client);
}

export async function addMission(insert: MissionInsert): Promise<Mission> {
  const client = createAdminClient();
  return createMission(client, insert);
}

export async function transitionMissionStatus(
  id: string,
  newStatus: MissionStatus,
  expectedVersion: number,
): Promise<{ mission: Mission | null; conflict: boolean }> {
  const client = createAdminClient();
  const result = await updateMissionStatus(
    client,
    id,
    newStatus,
    expectedVersion,
  );

  if (result === null) {
    return { mission: null, conflict: true };
  }
  return { mission: result, conflict: false };
}
