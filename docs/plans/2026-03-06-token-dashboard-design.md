# Token Dashboard Design

## Overview

A standalone `/dashboard` page providing token usage analytics for AgentOS. Serves both project managers (cost overview) and developers (per-call details).

## Approach

**Pure Server Component + CSS bar chart** (zero chart-library dependency). A small Client Island handles table filtering.

## Page Layout (top → bottom)

1. **Header** — Same style as `/missions`: `AgentOS / Dashboard` with link back to Missions
2. **Stat Cards Row** — 3 cards:
   - Total Cost (`$X.XX`)
   - Total Tokens (`XX.XK` combined input+output)
   - Active Agents (distinct agent_name count)
3. **Agent Cost Bar Chart** — Pure CSS horizontal bars, one per agent, width proportional to cost share. Color rotation: accent/success/warning/destructive.
4. **Ledger Detail Table** — Client component with Agent dropdown filter. Columns: Agent | Mission Title | Input Tokens | Output Tokens | Cost | Time.

## Data Flow

```
page.tsx (Server Component, force-dynamic)
  ├─ createAdminClient()
  ├─ Promise.all([getAllLedgerEntries(client), getCostSummaryByAgent(client)])
  ├─ Compute aggregates (total cost, total tokens, active agents)
  └─ Render:
       ├─ StatCard × 3 (Server)
       ├─ AgentCostChart (Server) — receives agent summary
       └─ LedgerTable (Client) — receives full entries array
```

## New Files

| File | Type | Purpose |
|------|------|---------|
| `src/app/dashboard/page.tsx` | Server | Data fetch + layout |
| `src/components/stat-card.tsx` | Server | Reusable stat card |
| `src/components/agent-cost-chart.tsx` | Server | CSS bar chart |
| `src/components/ledger-table.tsx` | Client | Filterable detail table |

## Service Layer Addition

- `getAllLedgerEntries(client)` in `token-ledger.ts` — fetches all entries with mission title via Supabase foreign-key select.

## Visual Style

- Dark theme consistent with existing UI (bg-background, card, border tokens)
- Numbers in Geist Mono, labels in uppercase 11px muted
- Bar chart: h-6 rounded bars, theme color rotation
- Table: compact text-xs font-mono rows, hover highlight
