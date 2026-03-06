import type { SupabaseClient } from "@supabase/supabase-js";
import type { TokenLedgerEntry, TokenLedgerInsert } from "@/types/database";

// ---------------------------------------------------------------------------
// Token Ledger data access layer (append-only)
// ---------------------------------------------------------------------------

/** Ledger entry enriched with mission title (from foreign-key join). */
export interface LedgerEntryWithMission {
  id: string;
  mission_id: string;
  agent_name: string;
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
  created_at: string;
  mission_title: string;
}

/** Raw shape from Supabase join: token_ledger + missions(title). */
interface RawLedgerJoin {
  id: string;
  mission_id: string;
  agent_name: string;
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
  created_at: string;
  missions: { title: string } | null;
}

/**
 * Record a token consumption entry.
 * Callers may supply their own `id` (UUID) for idempotency — the PK
 * constraint naturally deduplicates retries.
 */
export async function recordTokenUsage(
  client: SupabaseClient,
  entry: TokenLedgerInsert,
): Promise<TokenLedgerEntry> {
  const { data, error } = await client
    .from("token_ledger")
    .upsert(entry, { onConflict: "id" })
    .select()
    .single();

  if (error) throw error;
  return data as TokenLedgerEntry;
}

/** Fetch all ledger entries for a specific mission. */
export async function getLedgerByMission(
  client: SupabaseClient,
  missionId: string,
): Promise<TokenLedgerEntry[]> {
  const { data, error } = await client
    .from("token_ledger")
    .select("*")
    .eq("mission_id", missionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as TokenLedgerEntry[];
}

/** Fetch all ledger entries with mission title (for dashboard table). */
export async function getAllLedgerEntries(
  client: SupabaseClient,
): Promise<LedgerEntryWithMission[]> {
  const { data, error } = await client
    .from("token_ledger")
    .select("*, missions(title)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data as RawLedgerJoin[]).map((row) => ({
    id: row.id,
    mission_id: row.mission_id,
    agent_name: row.agent_name,
    input_tokens: row.input_tokens,
    output_tokens: row.output_tokens,
    total_cost: Number(row.total_cost),
    created_at: row.created_at,
    mission_title: row.missions?.title ?? "Unknown",
  }));
}

/** Get aggregated cost summary per agent. */
export async function getCostSummaryByAgent(
  client: SupabaseClient,
): Promise<{ agent_name: string; total_cost: number; entry_count: number }[]> {
  // Supabase JS doesn't support GROUP BY natively, use RPC or raw query.
  // For MVP, we fetch all and aggregate client-side.
  const { data, error } = await client
    .from("token_ledger")
    .select("agent_name, total_cost");

  if (error) throw error;

  const entries = data as { agent_name: string; total_cost: number }[];
  const map = new Map<string, { total_cost: number; entry_count: number }>();

  for (const entry of entries) {
    const existing = map.get(entry.agent_name);
    if (existing) {
      existing.total_cost += Number(entry.total_cost);
      existing.entry_count += 1;
    } else {
      map.set(entry.agent_name, {
        total_cost: Number(entry.total_cost),
        entry_count: 1,
      });
    }
  }

  return Array.from(map, ([agent_name, stats]) => ({
    agent_name,
    ...stats,
  }));
}
