"use client";

import type { MissionStatus } from "@/types/database";
import { statusConfig } from "@/lib/utils";

/**
 * Forward-only status transitions.
 * Agent cannot set `completed` — requires human confirmation.
 */
const NEXT_STATUSES: Record<MissionStatus, MissionStatus[]> = {
  todo: ["in_progress"],
  in_progress: ["reviewing"],
  reviewing: ["completed", "failed"],
  completed: [],
  failed: [],
};

const ACTION_LABELS: Record<MissionStatus, string> = {
  in_progress: "Start",
  reviewing: "Submit for Review",
  completed: "Complete",
  failed: "Mark Failed",
  todo: "Reset",
};

interface MissionStatusActionProps {
  currentStatus: MissionStatus;
  onTransition: (newStatus: MissionStatus) => void;
}

export function MissionStatusAction({
  currentStatus,
  onTransition,
}: MissionStatusActionProps) {
  const nextStatuses = NEXT_STATUSES[currentStatus];

  if (nextStatuses.length === 0) {
    return (
      <div className="rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-xs text-muted">
        Terminal state — no further transitions
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
        Actions
      </span>
      <div className="flex gap-2">
        {nextStatuses.map((next) => {
          const config = statusConfig(next);
          const isComplete = next === "completed";
          const isFail = next === "failed";

          return (
            <button
              key={next}
              onClick={() => onTransition(next)}
              className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                isFail
                  ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                  : isComplete
                    ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    : "border-border text-foreground hover:bg-zinc-800"
              }`}
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${config.dotColor}`}
              />
              {ACTION_LABELS[next]}
              {isComplete && (
                <span className="text-[10px] text-zinc-500">
                  (human)
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
