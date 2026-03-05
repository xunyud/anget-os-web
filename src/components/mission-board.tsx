import type { Mission, MissionStatus } from "@/types/database";
import { COLUMN_ORDER } from "@/lib/utils";
import { MissionColumn } from "./mission-column";

interface MissionBoardProps {
  missions: Mission[];
  onCardClick?: (mission: Mission) => void;
}

export function MissionBoard({ missions, onCardClick }: MissionBoardProps) {
  // Group missions by status
  const grouped = new Map<MissionStatus, Mission[]>();
  for (const status of COLUMN_ORDER) {
    grouped.set(status, []);
  }
  for (const mission of missions) {
    grouped.get(mission.status)?.push(mission);
  }

  return (
    <div className="flex h-full gap-4 overflow-x-auto px-6 pb-6">
      {COLUMN_ORDER.map((status) => (
        <div key={status} className="min-w-[260px] flex-1">
          <MissionColumn
            status={status}
            missions={grouped.get(status) ?? []}
            onCardClick={onCardClick}
          />
        </div>
      ))}
    </div>
  );
}
