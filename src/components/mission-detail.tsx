"use client";

import type { Mission, MissionStatus } from "@/types/database";
import {
  priorityColor,
  priorityLabel,
  assigneeIcon,
  assigneeLabel,
  statusConfig,
  relativeTime,
} from "@/lib/utils";
import { MissionStatusAction } from "./mission-status-action";

interface MissionDetailProps {
  mission: Mission;
  onStatusChange: (missionId: string, newStatus: MissionStatus) => void | Promise<void>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

export function MissionDetail({ mission, onStatusChange }: MissionDetailProps) {
  const status = statusConfig(mission.status);

  return (
    <div className="flex flex-col gap-5">
      {/* Title */}
      <h3 className="text-base font-semibold leading-snug text-foreground">
        {mission.title}
      </h3>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Status">
          <span className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${status.dotColor}`}
            />
            {status.label}
          </span>
        </Field>

        <Field label="Priority">
          <span className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${priorityColor(mission.priority)}`}
            />
            {priorityLabel(mission.priority)}
          </span>
        </Field>

        <Field label="Assignee">
          <span className="flex items-center gap-1.5">
            <span className="text-xs">{assigneeIcon(mission.assignee_type)}</span>
            {assigneeLabel(mission.assignee_type)}
          </span>
        </Field>

        <Field label="Version">
          <span className="font-mono text-xs">v{mission.version}</span>
        </Field>
      </div>

      {/* Description */}
      {mission.description && (
        <Field label="Description">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
            {mission.description}
          </p>
        </Field>
      )}

      {/* Context links */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Input Context">
          {mission.input_context_id ? (
            <span className="font-mono text-xs text-accent">
              {mission.input_context_id.slice(0, 8)}...
            </span>
          ) : (
            <span className="text-xs text-zinc-600">None</span>
          )}
        </Field>
        <Field label="Output Context">
          {mission.output_context_id ? (
            <span className="font-mono text-xs text-accent">
              {mission.output_context_id.slice(0, 8)}...
            </span>
          ) : (
            <span className="text-xs text-zinc-600">None</span>
          )}
        </Field>
      </div>

      {/* Timestamps */}
      <div className="flex items-center gap-4 border-t border-border pt-4 text-[11px] text-muted">
        <span>Created {relativeTime(mission.created_at)}</span>
        <span className="text-zinc-700">&middot;</span>
        <span>Updated {relativeTime(mission.updated_at)}</span>
      </div>

      {/* Divider */}
      <div className="border-t border-border pt-4">
        <MissionStatusAction
          currentStatus={mission.status}
          onTransition={(newStatus) => onStatusChange(mission.id, newStatus)}
        />
      </div>
    </div>
  );
}
