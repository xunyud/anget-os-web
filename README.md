# AgentOS — Mission Control for AI Agents

A B2D (Business-to-Developer) tool that turns fragmented Agent activity into coordinated value delivery. AgentOS is an **Agent-less Mission system** — it doesn't run Agents, it *dispatches* them.

## The Problem

Today's AI Agents (Claude, Cursor, custom scripts) operate in silos. Each starts from scratch, duplicates context, and optimizes for "closing a PR" rather than shipping business value. There is no shared memory, no handoff protocol, no cost visibility.

## The Solution

AgentOS provides three integrated subsystems:

| Subsystem | Purpose |
|---|---|
| **Mission Scheduler** | Decompose Goals into claimable Missions with priority queuing and optimistic-lock concurrency control |
| **Context Notebook** | Shared Markdown knowledge base that flows between Missions as structured input/output |
| **Token Ledger** | Append-only cost journal tracking per-Agent, per-Mission token consumption and USD spend |

---

## Architecture Philosophy

### Breaking the Agent Silo with Input/Output Context

The core insight: **AI value delivery is a pipeline, not a point.**

A single Agent completing a single task rarely ships real value. Value emerges when Agent A's research feeds Agent B's implementation, which feeds Agent C's review. But today, each Agent starts cold — no shared memory, no handoff.

AgentOS solves this with the **Context Flow** pattern:

```
┌─────────────┐    input_context    ┌─────────────┐    input_context    ┌─────────────┐
│  Context A   │───────────────────▶│  Mission 1   │                    │  Mission 2   │
│  (briefing)  │                    │  (research)  │                    │  (implement) │
└─────────────┘                    └──────┬───────┘                    └──────▲───────┘
                                          │ output_context                    │
                                          ▼                                   │
                                   ┌─────────────┐    input_context          │
                                   │  Context B   │─────────────────────────┘
                                   │  (findings)  │
                                   └─────────────┘
```

Every Mission has two context slots:

- **`input_context_id`** — The briefing an Agent reads *before* starting. Could be a PRD, research findings, or the output of a prior Mission.
- **`output_context_id`** — The deliverable an Agent writes *after* completing. Becomes the input for downstream Missions.

This creates an explicit, auditable knowledge pipeline. No Agent operates in isolation. Every output feeds the next input.

### Ship, Don't Just PR

Agents cannot mark their own work as `completed`. The furthest an Agent can advance a Mission's status is `reviewing`. Only a human can confirm `completed`. This prevents the "fake Ship" problem — where an Agent closes a task without delivering real value.

### Optimistic Concurrency for Multi-Agent Coordination

Every Mission carries a `version` field. When an Agent claims or updates a Mission, the API performs a compare-and-swap: if the version has changed since the Agent last read it, the write is rejected with `409 Conflict`. This eliminates race conditions without pessimistic locking.

### MCP-Native: From Cloud to Local Agent

AgentOS is designed to be consumed as a **standard MCP (Model Context Protocol) Server**. The core operations — claim mission, read input context, submit output context, transition status — map 1:1 to MCP tool definitions:

```
MCP Tool                     → Internal Operation
─────────────────────────────────────────────────
list_available_missions      → SELECT ... WHERE status='todo' ORDER BY priority
claim_mission(id)            → UPDATE ... SET status='in_progress' (SKIP LOCKED + version CAS)
read_input_context(id)       → GET context by mission.input_context_id
submit_output(id, content)   → CREATE context → SET output_context_id → status='reviewing'
record_token_usage(...)      → UPSERT into token_ledger (idempotent by PK)
```

This means any local Coding Agent (Claude Code, Codex, etc.) can connect to AgentOS via MCP and participate in the global task pipeline. Tools like [cc-switch](https://github.com/nicholasgriffintn/cc-switch) enable one-click MCP mounting, giving command-line Agents cloud-native task orchestration.

The `services/` layer is intentionally structured as stateless, client-agnostic functions — they serve both the Next.js frontend and the future MCP server without duplication.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) + React + TypeScript + Tailwind CSS |
| Backend | Supabase (PostgreSQL + Edge Functions) |
| Auth | Supabase Auth |
| Deployment | Vercel (frontend) + Supabase (backend) |

## Project Structure

```
anget-os-web/
├── supabase/
│   └── migrations/
│       └── 00001_init_schema.sql    # Core schema: missions, contexts, token_ledger
├── src/
│   ├── app/                         # Next.js App Router pages
│   ├── components/                  # UI components (rendering only)
│   ├── services/                    # Supabase client & data access layer
│   ├── lib/                         # Shared utilities & types
│   └── types/                       # TypeScript type definitions
├── README.md
└── package.json
```

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm (recommended) or npm
- Supabase CLI (`npx supabase init` if not installed)
- A Supabase project (free tier works for development)

### 1. Clone & Install

```bash
git clone <repo-url>
cd anget-os-web
pnpm install
```

### 2. Configure Environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **Never commit `.env.local`.** It contains secrets.

### 3. Initialize Database

Run the migration against your Supabase project:

```bash
# Link to your Supabase project
npx supabase link --project-ref your-project-ref

# Apply migrations
npx supabase db push
```

Or run the SQL directly in the Supabase Dashboard SQL Editor:
- Open `supabase/migrations/00001_init_schema.sql`
- Paste into SQL Editor and execute

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Development Conventions

1. **API-First & Idempotent** — All write operations go through API routes or Edge Functions. Writes are idempotent (token_ledger uses PK-based deduplication; mission updates use version CAS).

2. **No Silent Failures** — Every API error returns structured JSON with an appropriate HTTP status code. `409 Conflict` for version mismatches. `400` for invalid state transitions.

3. **Separation of Concerns** — Components render UI. `services/` handles all Supabase interaction. No direct database calls from components.

4. **Single-Tenant RLS** — All tables have RLS enabled. Current policy: authenticated users have full access. Service-role key bypasses RLS for server-side operations.

## Database Schema Overview

| Table | Purpose | Key Fields |
|---|---|---|
| `missions` | Task queue with lifecycle management | `status`, `version`, `input_context_id`, `output_context_id` |
| `contexts` | Markdown knowledge documents | `content`, `created_by_type` |
| `token_ledger` | Append-only cost tracking | `mission_id`, `agent_name`, `total_cost` |

See `supabase/migrations/00001_init_schema.sql` for the full schema with comments.

## License

Private. All rights reserved.
