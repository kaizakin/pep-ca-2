type MetricCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <div className="border border-[#ece9e2] bg-white p-5 shadow-[0_18px_45px_rgba(20,20,20,0.04)]">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8b8880]">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-[-0.08em] text-[#151515]">{value}</p>
      {helper ? <p className="mt-2 text-xs leading-5 text-[#77736b]">{helper}</p> : null}
    </div>
  );
}
