-- =============================================================================
-- AgentOS - Mission Control Schema
-- Migration: 00001_init_schema
-- Description: Core tables for Mission scheduling, Context sharing, Token ledger
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enum Types
-- ---------------------------------------------------------------------------

create type public.assignee_type as enum (
  'none',
  'human',
  'agent_claude',
  'agent_cursor',
  'agent_script'
);

create type public.mission_status as enum (
  'todo',
  'in_progress',
  'reviewing',
  'completed',
  'failed'
);

create type public.creator_type as enum (
  'human',
  'agent_claude',
  'agent_cursor',
  'agent_script'
);

-- ---------------------------------------------------------------------------
-- 2. Helper: auto-update updated_at trigger function
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Table: contexts (must be created before missions due to FK)
--    Agent memory & consensus repository. Each record is a Markdown document
--    that can serve as input_context (pre-task briefing) or output_context
--    (post-task deliverable) for missions.
-- ---------------------------------------------------------------------------

create table public.contexts (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  content     text        not null default '',
  created_by_type public.creator_type not null default 'human',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table  public.contexts is 'Shared knowledge base — Markdown documents that flow between missions as input/output context.';
comment on column public.contexts.content is 'Markdown-formatted body. Serves as Agent prompt context or deliverable artifact.';
comment on column public.contexts.created_by_type is 'Provenance: who created or last meaningfully edited this context.';

create trigger contexts_set_updated_at
  before update on public.contexts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Table: missions
--    Core task unit. Agents or humans claim missions, read input_context,
--    execute, then write output_context.
-- ---------------------------------------------------------------------------

create table public.missions (
  id                uuid            primary key default gen_random_uuid(),
  goal_id           uuid,           -- nullable; future FK to a goals table
  title             text            not null,
  description       text            not null default '',
  priority          int             not null default 0,
  assignee_type     public.assignee_type not null default 'none',
  status            public.mission_status not null default 'todo',
  input_context_id  uuid            references public.contexts(id) on delete set null,
  output_context_id uuid            references public.contexts(id) on delete set null,
  version           int             not null default 1,
  created_at        timestamptz     not null default now(),
  updated_at        timestamptz     not null default now(),

  -- Guard: version must be positive
  constraint missions_version_positive check (version > 0)
);

comment on table  public.missions is 'Atomic work unit. Agents claim todo missions via API, progressing them through the status lifecycle.';
comment on column public.missions.goal_id is 'Optional link to a higher-level business goal (goals table TBD).';
comment on column public.missions.input_context_id is 'Pre-task briefing: the context an Agent MUST read before starting work.';
comment on column public.missions.output_context_id is 'Post-task deliverable: the context an Agent produces upon completion.';
comment on column public.missions.version is 'Optimistic lock. Every status-change API must CAS (compare-and-swap) on this field. Increment on every write.';

-- BUSINESS RULE (enforced at API layer, documented here):
-- Agents may set status up to 'reviewing' only.
-- Transition to 'completed' requires human confirmation.
-- This prevents Agents from "faking Ship" — value delivery must be verified.

create trigger missions_set_updated_at
  before update on public.missions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Table: token_ledger
--    Append-only cost ledger. Each row records a single Agent interaction's
--    token consumption against a mission.
-- ---------------------------------------------------------------------------

create table public.token_ledger (
  id            uuid        primary key default gen_random_uuid(),
  mission_id    uuid        not null references public.missions(id) on delete cascade,
  agent_name    text        not null,
  input_tokens  bigint      not null default 0,
  output_tokens bigint      not null default 0,
  total_cost    numeric(12, 6) not null default 0,
  created_at    timestamptz not null default now(),

  -- Idempotency key: callers may supply their own UUID as `id` to prevent
  -- duplicate ledger entries on retry. The PK constraint naturally deduplicates.

  -- Guard: tokens and cost must be non-negative
  constraint token_ledger_input_nonneg  check (input_tokens  >= 0),
  constraint token_ledger_output_nonneg check (output_tokens >= 0),
  constraint token_ledger_cost_nonneg   check (total_cost    >= 0)
);

comment on table  public.token_ledger is 'Append-only cost journal. Each row = one Agent API call billed against a mission.';
comment on column public.token_ledger.total_cost is 'USD cost with 6-digit precision (e.g. 0.001500).';

-- ---------------------------------------------------------------------------
-- 6. Indexes
--    Foreign key columns are NOT auto-indexed by Postgres.
--    We also add indexes for common query patterns.
-- ---------------------------------------------------------------------------

-- missions: FK indexes
create index missions_input_context_id_idx  on public.missions (input_context_id);
create index missions_output_context_id_idx on public.missions (output_context_id);
create index missions_goal_id_idx           on public.missions (goal_id);

-- missions: queue claim pattern — filter by status, order by priority desc, created_at asc
-- Agent claim query: WHERE status = 'todo' ORDER BY priority DESC, created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED
create index missions_queue_idx on public.missions (status, priority desc, created_at asc);

-- token_ledger: FK index + common aggregation pattern
create index token_ledger_mission_id_idx on public.token_ledger (mission_id);
create index token_ledger_agent_name_idx on public.token_ledger (agent_name);

-- ---------------------------------------------------------------------------
-- 7. Row Level Security (RLS)
--    MVP: single-tenant. Authenticated users have full access.
--    Service-role calls (from Edge Functions) bypass RLS by default.
--    Uses (select auth.role()) pattern for performance (cached, not per-row).
-- ---------------------------------------------------------------------------

-- contexts
alter table public.contexts enable row level security;

create policy contexts_authenticated_all on public.contexts
  for all
  to authenticated
  using (true)
  with check (true);

-- missions
alter table public.missions enable row level security;

create policy missions_authenticated_all on public.missions
  for all
  to authenticated
  using (true)
  with check (true);

-- token_ledger
alter table public.token_ledger enable row level security;

create policy token_ledger_authenticated_all on public.token_ledger
  for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- 8. Reference: Agent Mission Claim Pattern (for future Edge Function)
--
-- This is the recommended SQL for an Agent to atomically claim a mission.
-- Uses SKIP LOCKED so multiple Agents don't block each other.
-- Uses optimistic locking via version to prevent race conditions.
--
--   UPDATE missions
--   SET
--     status = 'in_progress',
--     assignee_type = $1,        -- e.g. 'agent_claude'
--     version = version + 1,
--     updated_at = now()
--   WHERE id = (
--     SELECT id FROM missions
--     WHERE status = 'todo'
--     ORDER BY priority DESC, created_at ASC
--     LIMIT 1
--     FOR UPDATE SKIP LOCKED
--   )
--   RETURNING *;
--
-- For targeted claim (Agent picks a specific mission):
--
--   UPDATE missions
--   SET
--     status = 'in_progress',
--     assignee_type = $1,
--     version = version + 1
--   WHERE id = $2
--     AND status = 'todo'
--     AND version = $3           -- optimistic lock check
--   RETURNING *;
--
--   If 0 rows returned → 409 Conflict (version mismatch or already claimed)
-- ---------------------------------------------------------------------------
