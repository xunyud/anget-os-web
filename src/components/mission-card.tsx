import type { Mission } from "@/types/database";
import {
  priorityColor,
  priorityLabel,
  assigneeIcon,
  assigneeLabel,
  relativeTime,
} from "@/lib/utils";

interface MissionCardProps {
  mission: Mission;
  onClick?: (mission: Mission) => void;
}

export function MissionCard({ mission, onClick }: MissionCardProps) {
  return (
    <div
      className="group cursor-pointer rounded-lg border border-border bg-card px-3.5 py-3 transition-colors hover:border-zinc-600 hover:bg-zinc-800/60"
      onClick={() => onClick?.(mission)}
    >
      {/* Row 1: Priority dot + title */}
      <div className="flex items-start gap-2.5">
        <span
          className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${priorityColor(mission.priority)}`}
          title={priorityLabel(mission.priority)}
        />
        <span className="text-sm font-medium leading-snug text-foreground line-clamp-2">
          {mission.title}
        </span>
      </div>

      {/* Row 2: Assignee + time */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-1.5 truncate">
          <span className="text-[11px]">{assigneeIcon(mission.assignee_type)}</span>
          <span className="truncate">{assigneeLabel(mission.assignee_type)}</span>
        </span>
        <span className="shrink-0 tabular-nums">
          {relativeTime(mission.updated_at)}
        </span>
      </div>
    </div>
  );
}
