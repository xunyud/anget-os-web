import type { AssigneeType, MissionStatus } from "@/types/database";

// ---------------------------------------------------------------------------
// Priority → visual mapping
// ---------------------------------------------------------------------------

const PRIORITY_COLORS: Record<number, string> = {
  0: "bg-red-500",      // P0 — critical
  1: "bg-orange-400",   // P1 — high
  2: "bg-blue-400",     // P2 — medium
};
const PRIORITY_DEFAULT = "bg-zinc-500"; // P3+ — low

export function priorityColor(priority: number): string {
  return PRIORITY_COLORS[priority] ?? PRIORITY_DEFAULT;
}

export function priorityLabel(priority: number): string {
  return `P${priority}`;
}

// ---------------------------------------------------------------------------
// Assignee type → display
// ---------------------------------------------------------------------------

const ASSIGNEE_LABELS: Record<AssigneeType, string> = {
  none: "Unassigned",
  human: "Human",
  agent_claude: "Claude",
  agent_cursor: "Cursor",
  agent_script: "Script",
};

const ASSIGNEE_ICONS: Record<AssigneeType, string> = {
  none: "—",
  human: "\u{1F464}",       // 👤
  agent_claude: "\u{1F916}", // 🤖
  agent_cursor: "\u{1F5B1}", // 🖱
  agent_script: "\u{2699}",  // ⚙
};

export function assigneeLabel(type: AssigneeType): string {
  return ASSIGNEE_LABELS[type];
}

export function assigneeIcon(type: AssigneeType): string {
  return ASSIGNEE_ICONS[type];
}

// ---------------------------------------------------------------------------
// Status → display config
// ---------------------------------------------------------------------------

interface StatusConfig {
  label: string;
  dotColor: string;
  order: number;
}

const STATUS_CONFIG: Record<MissionStatus, StatusConfig> = {
  todo:        { label: "Todo",        dotColor: "bg-zinc-400",   order: 0 },
  in_progress: { label: "In Progress", dotColor: "bg-blue-400",   order: 1 },
  reviewing:   { label: "Reviewing",   dotColor: "bg-amber-400",  order: 2 },
  completed:   { label: "Completed",   dotColor: "bg-emerald-400", order: 3 },
  failed:      { label: "Failed",      dotColor: "bg-red-400",    order: 4 },
};

export function statusConfig(status: MissionStatus): StatusConfig {
  return STATUS_CONFIG[status];
}

export const COLUMN_ORDER: MissionStatus[] = [
  "todo",
  "in_progress",
  "reviewing",
  "completed",
  "failed",
];

// ---------------------------------------------------------------------------
// Relative time
// ---------------------------------------------------------------------------

export function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
