import type { Mission, MissionStatus } from "@/types/database";
import { statusConfig } from "@/lib/utils";
import { MissionCard } from "./mission-card";

interface MissionColumnProps {
  status: MissionStatus;
  missions: Mission[];
  onCardClick?: (mission: Mission) => void;
}

export function MissionColumn({
  status,
  missions,
  onCardClick,
}: MissionColumnProps) {
  const config = statusConfig(status);

  return (
    <div className="flex h-full min-w-[260px] flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2.5 px-1 pb-3">
        <span
          className={`inline-block h-2 w-2 rounded-full ${config.dotColor}`}
        />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {config.label}
        </h2>
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium tabular-nums text-zinc-400">
          {missions.length}
        </span>
      </div>

      {/* Card list */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {missions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            onClick={onCardClick}
          />
        ))}

        {missions.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-800 py-10">
            <span className="text-xs text-zinc-600">No missions</span>
          </div>
        )}
      </div>
    </div>
  );
}
