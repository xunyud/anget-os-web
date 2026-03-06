"use client";

import { useState, useMemo } from "react";
import type { LedgerEntryWithMission } from "@/services/token-ledger";
import { relativeTime } from "@/lib/utils";

interface LedgerTableProps {
  entries: LedgerEntryWithMission[];
}

export function LedgerTable({ entries }: LedgerTableProps) {
  const [agentFilter, setAgentFilter] = useState<string>("all");

  const agents = useMemo(
    () => Array.from(new Set(entries.map((e) => e.agent_name))).sort(),
    [entries],
  );

  const filtered = useMemo(
    () =>
      agentFilter === "all"
        ? entries
        : entries.filter((e) => e.agent_name === agentFilter),
    [entries, agentFilter],
  );

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
          Ledger Detail
        </span>
        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="rounded-md border border-border bg-zinc-900 px-2.5 py-1 text-xs text-foreground outline-none focus:border-zinc-600"
        >
          <option value="all">All Agents</option>
          {agents.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted">
              <th className="px-5 py-2.5 font-medium">Agent</th>
              <th className="px-5 py-2.5 font-medium">Mission</th>
              <th className="px-5 py-2.5 text-right font-medium">Input</th>
              <th className="px-5 py-2.5 text-right font-medium">Output</th>
              <th className="px-5 py-2.5 text-right font-medium">Cost</th>
              <th className="px-5 py-2.5 text-right font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-8 text-center text-sm text-muted"
                >
                  No entries found.
                </td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border/50 transition-colors hover:bg-zinc-800/50"
                >
                  <td className="px-5 py-2.5 font-mono text-foreground">
                    {entry.agent_name}
                  </td>
                  <td className="max-w-[200px] truncate px-5 py-2.5 text-zinc-300">
                    {entry.mission_title}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono text-zinc-400">
                    {entry.input_tokens.toLocaleString()}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono text-zinc-400">
                    {entry.output_tokens.toLocaleString()}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono text-foreground">
                    ${entry.total_cost.toFixed(4)}
                  </td>
                  <td className="px-5 py-2.5 text-right text-muted">
                    {relativeTime(entry.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
