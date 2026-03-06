import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAllLedgerEntries,
  getCostSummaryByAgent,
} from "@/services/token-ledger";
import { StatCard } from "@/components/stat-card";
import { AgentCostChart } from "@/components/agent-cost-chart";
import { LedgerTable } from "@/components/ledger-table";

export const metadata = {
  title: "Dashboard — AgentOS",
};

export const dynamic = "force-dynamic";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default async function DashboardPage() {
  const client = createAdminClient();

  const [entries, agentSummary] = await Promise.all([
    getAllLedgerEntries(client),
    getCostSummaryByAgent(client),
  ]);

  // Compute aggregates
  const totalCost = entries.reduce((sum, e) => sum + e.total_cost, 0);
  const totalTokens = entries.reduce(
    (sum, e) => sum + e.input_tokens + e.output_tokens,
    0,
  );
  const activeAgents = new Set(entries.map((e) => e.agent_name)).size;

  // Sort agent summary by cost descending
  const sortedAgents = [...agentSummary].sort(
    (a, b) => b.total_cost - a.total_cost,
  );

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold tracking-tight text-foreground">
            AgentOS
          </h1>
          <span className="text-zinc-600">/</span>
          <span className="text-sm text-muted">Dashboard</span>
        </div>
        <Link
          href="/missions"
          className="rounded-md border border-border bg-zinc-900 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-zinc-600 hover:bg-zinc-800"
        >
          ← Missions
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              title="Total Cost"
              value={`$${totalCost.toFixed(4)}`}
              subtitle="All time"
            />
            <StatCard
              title="Total Tokens"
              value={formatTokens(totalTokens)}
              subtitle={`${totalTokens.toLocaleString()} tokens`}
            />
            <StatCard
              title="Active Agents"
              value={String(activeAgents)}
              subtitle={`${entries.length} ledger entries`}
            />
          </div>

          {/* Agent Cost Chart */}
          <AgentCostChart data={sortedAgents} />

          {/* Ledger Table */}
          <LedgerTable entries={entries} />
        </div>
      </main>
    </div>
  );
}
