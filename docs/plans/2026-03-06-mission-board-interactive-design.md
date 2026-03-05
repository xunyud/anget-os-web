# Mission Board Interactive Design

**Date**: 2026-03-06
**Status**: Approved

## Goal

Transform the static Mission kanban board into a functional tool with three interaction capabilities: create missions, view details, and transition status.

## Architecture

Hybrid RSC + Client Islands. Page-level data fetch remains Server Component. Drawer, card clicks, forms, and status buttons are Client Components. State managed with React useState — no external library.

## New Components

| Component | Type | Purpose |
|---|---|---|
| `mission-board-client.tsx` | Client | Wraps board, owns Drawer state, receives card clicks |
| `mission-drawer.tsx` | Client | Right slide-in drawer (420px), detail or create mode |
| `mission-detail.tsx` | Client | Detail view inside drawer (title, desc, status, priority, assignee, contexts, actions) |
| `mission-create-form.tsx` | Client | Create form inside drawer (title, desc, priority, assignee_type) |
| `mission-status-action.tsx` | Client | Status transition buttons with forward-only rules |

## Data Flow

```
page.tsx (Server) → getMockMissions()
  → <MissionBoardClient missions={missions}>
       ├─ <MissionBoard> renders 5 columns + cards (onClick bubbles up)
       └─ <MissionDrawer>
            ├─ mode="detail" → <MissionDetail> + <MissionStatusAction>
            └─ mode="create" → <MissionCreateForm>
```

## Status Transition Rules

```
todo → in_progress → reviewing → completed
                               → failed
```

Forward-only. Agent cannot set `completed` (UI shows "Requires human" hint). Operations carry version for optimistic lock.

## Drawer Behavior

- Click card → slide in detail view
- Click `+ New` → slide in create form
- Click overlay or ESC → close
- Width: 420px with slide-in animation

## Create Form Fields

- Title (required)
- Description (optional, textarea)
- Priority (select: P0-P3)
- Assignee Type (select)
- Submit → add to todo column, close drawer
