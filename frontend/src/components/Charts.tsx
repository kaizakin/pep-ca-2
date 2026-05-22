import type { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { Analytics } from '../lib/api';

const COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#60a5fa'];

type ChartsProps = {
  analytics: Analytics;
};

export function Charts({ analytics }: ChartsProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <ChartPanel title="Sprint Burn-up / Code Velocity" className="xl:col-span-2">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={analytics.charts.codeVelocity} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="additions" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="deletions" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#fb7185" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#fb7185" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip contentStyle={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 12 }} />
            <Area type="monotone" dataKey="additions" stackId="1" stroke="#22d3ee" fill="url(#additions)" />
            <Area type="monotone" dataKey="deletions" stackId="1" stroke="#fb7185" fill="url(#deletions)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Work Distribution">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={analytics.charts.workDistribution}
              dataKey="commits"
              nameKey="contributor"
              innerRadius={72}
              outerRadius={118}
              paddingAngle={3}
            >
              {analytics.charts.workDistribution.map((entry, index) => (
                <Cell key={entry.contributor} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="PR Cycle Time" className="xl:col-span-3">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={analytics.charts.prCycleTime} layout="vertical" margin={{ left: 24, right: 24 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis type="number" label={{ value: 'Hours to merge', position: 'insideBottom', offset: -4 }} />
            <YAxis type="category" dataKey="number" width={80} tickFormatter={(value) => `#${value}`} />
            <Tooltip contentStyle={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 12 }} />
            <Bar dataKey="hoursToMerge" fill="#a78bfa" radius={[0, 10, 10, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>
    </div>
  );
}

type ChartPanelProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

function ChartPanel({ title, children, className = '' }: ChartPanelProps) {
  return (
    <section className={`rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/20 ${className}`}>
      <h2 className="mb-5 text-lg font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}
