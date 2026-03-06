const BAR_COLORS = [
  "bg-accent",     // blue
  "bg-success",    // green
  "bg-warning",    // yellow
  "bg-destructive", // red
];

interface AgentSummary {
  agent_name: string;
  total_cost: number;
  entry_count: number;
}

interface AgentCostChartProps {
  data: AgentSummary[];
}

export function AgentCostChart({ data }: AgentCostChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-5 py-8 text-center text-sm text-muted">
        No token usage recorded yet.
      </div>
    );
  }

  const maxCost = Math.max(...data.map((d) => d.total_cost));

  return (
    <div className="rounded-lg border border-border bg-card px-5 py-4">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
        Cost by Agent
      </span>
      <div className="mt-3 flex flex-col gap-3">
        {data.map((agent, i) => {
          const pct = maxCost > 0 ? (agent.total_cost / maxCost) * 100 : 0;
          return (
            <div key={agent.agent_name} className="flex items-center gap-3">
              <span className="w-36 shrink-0 truncate text-xs text-foreground">
                {agent.agent_name}
              </span>
              <div className="relative flex-1">
                <div
                  className={`h-6 rounded ${BAR_COLORS[i % BAR_COLORS.length]}`}
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    opacity: 0.85,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <span className="w-20 shrink-0 text-right font-mono text-xs text-muted">
                ${agent.total_cost.toFixed(4)}
              </span>
              <span className="w-16 shrink-0 text-right text-[11px] text-zinc-600">
                {agent.entry_count} call{agent.entry_count !== 1 ? "s" : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
