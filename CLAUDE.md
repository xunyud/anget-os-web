# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type-check without emitting
```

Database migrations are applied via:
```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

## Architecture

AgentOS is an **Agent-less Mission system** — it dispatches AI Agents, not runs them. Three subsystems: Mission Scheduler, Context Notebook, Token Ledger.

### Core Pattern: Context Flow

Missions are connected through `input_context_id` and `output_context_id` foreign keys pointing to the `contexts` table. This creates an explicit knowledge pipeline: Agent A's output becomes Agent B's input. No Agent operates in isolation.

### Data Access Layer

Components never call Supabase directly. All database operations go through `src/services/`:

- `services/missions.ts` — CRUD + optimistic-lock status updates (version CAS)
- `services/contexts.ts` — CRUD for Markdown knowledge documents
- `services/token-ledger.ts` — Append-only cost tracking (idempotent via caller-supplied UUID)

Each service function accepts a `SupabaseClient` instance as its first parameter.

### Three Supabase Clients (`src/lib/supabase/`)

| File | Context | RLS |
|---|---|---|
| `client.ts` | Browser (React components) | Yes — anon key |
| `server.ts` | Server Components / Actions | Yes — cookie-based session |
| `admin.ts` | API routes only | No — service_role key, bypasses RLS |

### Database Schema (`supabase/migrations/`)

Three tables: `missions`, `contexts`, `token_ledger`. Key enums: `mission_status` (todo → in_progress → reviewing → completed/failed), `assignee_type`, `creator_type`. Full schema with indexes and RLS in `00001_init_schema.sql`.

### Type System (`src/types/database.ts`)

Row types (`Mission`, `Context`, `TokenLedgerEntry`), Insert types (`MissionInsert`, etc.), and Update types mirror the SQL schema. All enum values are union string literal types.

### MCP Integration Path

AgentOS core operations will be exposed as a standard MCP Server. The `services/` layer is the shared business logic consumed by both the Next.js frontend and the future MCP server. When building new service functions, keep them stateless and client-agnostic (accept `SupabaseClient` as parameter, return plain data). MCP tool mapping:

- `list_available_missions` → `getMissionsByStatus('todo')`
- `claim_mission` → `updateMissionStatus(id, 'in_progress', version)`
- `read_input_context` → `getMission()` + `getContext(input_context_id)`
- `submit_output` → `createContext()` + update mission's `output_context_id` + status → `reviewing`
- `record_token_usage` → `recordTokenUsage()` (idempotent)

## Critical Invariants

- **Agents cannot complete missions.** Agent API calls may set status up to `reviewing` only. `completed` requires human confirmation.
- **Optimistic locking is mandatory.** Every mission status change must check and increment the `version` field. On conflict → HTTP 409.
- **Token writes must be idempotent.** Callers supply their own UUID as `id` to prevent duplicate ledger entries on retry.
- **Mission claiming uses `FOR UPDATE SKIP LOCKED`** for non-blocking multi-agent queue processing.
- **All writes go through API routes or Edge Functions**, never from client-side directly.

## Style & UI

Dark-only theme. Cold, professional, minimal (Linear/Notion/Cursor aesthetic). No gamification, no emojis. CSS variables defined in `src/app/globals.css`. Geist Sans + Geist Mono fonts.

## Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.json).
