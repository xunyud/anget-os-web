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
        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
            System Online
          </span>
        </div>
        <Link
          href="/missions"
          className="mt-6 inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:border-zinc-600 hover:bg-zinc-800/60"
        >
          Open Mission Board
          <span className="text-muted">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
