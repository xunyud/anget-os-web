// =============================================================================
// Database type definitions — mirrors supabase/migrations/00001_init_schema.sql
// =============================================================================

export type AssigneeType =
  | "none"
  | "human"
  | "agent_claude"
  | "agent_cursor"
  | "agent_script";

export type MissionStatus =
  | "todo"
  | "in_progress"
  | "reviewing"
  | "completed"
  | "failed";

export type CreatorType =
  | "human"
  | "agent_claude"
  | "agent_cursor"
  | "agent_script";

// ---------------------------------------------------------------------------
// Row types (what Supabase returns from SELECT)
// ---------------------------------------------------------------------------

export interface Mission {
  id: string;
  goal_id: string | null;
  title: string;
  description: string;
  priority: number;
  assignee_type: AssigneeType;
  status: MissionStatus;
  input_context_id: string | null;
  output_context_id: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Context {
  id: string;
  title: string;
  content: string;
  created_by_type: CreatorType;
  created_at: string;
  updated_at: string;
}

export interface TokenLedgerEntry {
  id: string;
  mission_id: string;
  agent_name: string;
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Insert types (what we send to Supabase for INSERT)
// ---------------------------------------------------------------------------

export interface MissionInsert {
  title: string;
  description?: string;
  goal_id?: string | null;
  priority?: number;
  assignee_type?: AssigneeType;
  status?: MissionStatus;
  input_context_id?: string | null;
  output_context_id?: string | null;
}

export interface ContextInsert {
  title: string;
  content?: string;
  created_by_type?: CreatorType;
}

export interface TokenLedgerInsert {
  id?: string; // caller-supplied UUID for idempotency
  mission_id: string;
  agent_name: string;
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
}

// ---------------------------------------------------------------------------
// Update types (partial, for PATCH operations)
// ---------------------------------------------------------------------------

export interface MissionUpdate {
  title?: string;
  description?: string;
  goal_id?: string | null;
  priority?: number;
  assignee_type?: AssigneeType;
  status?: MissionStatus;
  input_context_id?: string | null;
  output_context_id?: string | null;
  version?: number; // set by API layer, not by caller
}

export interface ContextUpdate {
  title?: string;
  content?: string;
  created_by_type?: CreatorType;
}
