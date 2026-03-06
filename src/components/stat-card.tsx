interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

export function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card px-5 py-4">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
        {title}
      </span>
      <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
        {value}
      </p>
      {subtitle && (
        <span className="mt-0.5 block text-xs text-muted">{subtitle}</span>
      )}
    </div>
  );
}
