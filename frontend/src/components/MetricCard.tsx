type MetricCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-panel/40 p-6 shadow-xl backdrop-blur-sm transition-all hover:bg-brand-panel/60 hover:border-brand-border/80">
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-text">{label}</p>
      <p className="mt-3 text-4xl font-bold tracking-tight text-white">{value}</p>
      {helper ? <p className="mt-2 text-sm font-medium text-brand-text/70">{helper}</p> : null}
    </div>
  );
}
