"use client";

import { useState } from "react";
import type { MissionInsert, AssigneeType } from "@/types/database";

interface MissionCreateFormProps {
  onSubmit: (mission: MissionInsert) => void;
  onCancel: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 0, label: "P0 — Critical" },
  { value: 1, label: "P1 — High" },
  { value: 2, label: "P2 — Medium" },
  { value: 3, label: "P3 — Low" },
];

const ASSIGNEE_OPTIONS: { value: AssigneeType; label: string }[] = [
  { value: "none", label: "Unassigned" },
  { value: "human", label: "Human" },
  { value: "agent_claude", label: "Agent — Claude" },
  { value: "agent_cursor", label: "Agent — Cursor" },
  { value: "agent_script", label: "Agent — Script" },
];

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "rounded-md border border-border bg-zinc-900 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30";

const selectClass =
  "rounded-md border border-border bg-zinc-900 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30";

export function MissionCreateForm({
  onSubmit,
  onCancel,
}: MissionCreateFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(2);
  const [assigneeType, setAssigneeType] = useState<AssigneeType>("none");

  const canSubmit = title.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assignee_type: assigneeType,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FormField label="Title" required>
        <input
          type="text"
          className={inputClass}
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </FormField>

      <FormField label="Description">
        <textarea
          className={`${inputClass} min-h-[100px] resize-y`}
          placeholder="Additional context, acceptance criteria..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Priority">
          <select
            className={selectClass}
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Assignee">
          <select
            className={selectClass}
            value={assigneeType}
            onChange={(e) => setAssigneeType(e.target.value as AssigneeType)}
          >
            {ASSIGNEE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-opacity disabled:opacity-30"
        >
          Create Mission
        </button>
      </div>
    </form>
  );
}
