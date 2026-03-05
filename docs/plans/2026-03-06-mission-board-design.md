# Mission Board Design

**Date**: 2026-03-06
**Status**: Approved

## Decisions

- **Layout**: 5-column kanban — todo, in_progress, reviewing, completed, failed
- **Card style**: Compact — title + priority dot + assignee icon + relative time
- **Architecture**: Pure Server Component (Next.js RSC), zero client JS
- **Data**: Mock data first, seamless switch to Supabase later
- **Drag-and-drop**: Not included in MVP

## File Structure

```
src/app/missions/page.tsx        # Page route (Server Component)
src/components/mission-board.tsx  # Board container (5-column grid)
src/components/mission-column.tsx # Single column (header + card list)
src/components/mission-card.tsx   # Card (title, priority, assignee, time)
src/lib/mock-data.ts              # Mock Mission[] for dev
```

## Data Flow

```
page.tsx → getMissions() (mock or Supabase)
  → group by status
  → <MissionBoard columns={grouped}>
      → 5x <MissionColumn>
          → Nx <MissionCard>
```

## Card Layout

```
┌───────────────────────────┐
│ ● P2  Setup CI pipeline   │  ← priority dot (color) + title (truncated)
│                           │
│ 🤖 agent_claude    2h ago  │  ← assignee icon + relative time
└───────────────────────────┘
```

Priority colors: P0=red, P1=orange, P2=blue, P3+=gray

## Column Header

Status label + count badge. Example: `In Progress (3)`

## Visual

- Dark background, `bg-card` cards with hover brightening
- Horizontal scroll container for narrow screens
- Vertical scroll within columns for overflow
- `border-border` separators between columns
