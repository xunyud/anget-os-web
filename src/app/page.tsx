import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">
          AgentOS
        </h1>
        <p className="text-sm text-muted">
          Mission Control for AI Agents
        </p>
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
            System Online
          </span>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/missions"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm text-foreground transition-colors hover:border-zinc-600 hover:bg-zinc-800/60"
          >
            Mission Board
            <span className="text-muted">&rarr;</span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm text-foreground transition-colors hover:border-zinc-600 hover:bg-zinc-800/60"
          >
            Token Dashboard
            <span className="text-muted">&rarr;</span>
          </Link>
        </div>

        {/* API hint */}
        <div className="mt-10 rounded-lg border border-border/60 bg-card/50 px-5 py-4 text-left">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Agent API
          </span>
          <div className="mt-2 space-y-1 font-mono text-xs text-zinc-500">
            <p>GET  /api/missions/next</p>
            <p>POST /api/missions/:id/claim</p>
            <p>POST /api/missions/:id/submit</p>
            <p>GET  /api/contexts/:id</p>
          </div>
        </div>
      </div>
    </div>
  );
}
