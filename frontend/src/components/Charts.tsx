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

const COLORS = ['#e68f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
const tooltipStyle = {
  background: '#151a1e',
  border: '1px solid #272f38',
  borderRadius: '8px',
  color: '#ffffff',
  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
  fontFamily: 'system-ui, sans-serif',
  fontSize: '13px',
};

type ChartsProps = {
  analytics: Analytics;
};

export function Charts({ analytics }: ChartsProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <ChartPanel title="Sprint Burn-up / Code Velocity" className="xl:col-span-2">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={analytics.charts.codeVelocity} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="additions" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#e68f5e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#e68f5e" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="deletions" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#272f38" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: '#272f38' }} tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#272f38', strokeWidth: 1 }} />
            <Area type="monotone" dataKey="additions" stackId="1" stroke="#e68f5e" strokeWidth={2} fill="url(#additions)" />
            <Area type="monotone" dataKey="deletions" stackId="1" stroke="#ef4444" strokeWidth={2} fill="url(#deletions)" />
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
              stroke="none"
            >
              {analytics.charts.workDistribution.map((entry, index) => (
                <Cell key={entry.contributor} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="PR Cycle Time" className="xl:col-span-3">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={analytics.charts.prCycleTime} layout="vertical" margin={{ left: 24, right: 24 }}>
            <CartesianGrid stroke="#272f38" strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={{ stroke: '#272f38' }}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              label={{ value: 'Hours to merge', position: 'insideBottom', offset: -4, fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="number"
              width={80}
              tickLine={false}
              axisLine={{ stroke: '#272f38' }}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(value) => `#${value}`}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#ffffff', opacity: 0.05 }} />
            <Bar dataKey="hoursToMerge" fill="#e68f5e" radius={[0, 4, 4, 0]} />
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
    <section className={`rounded-2xl border border-brand-border bg-brand-panel/40 p-6 shadow-xl backdrop-blur-sm ${className}`}>
      <h2 className="mb-6 text-[13px] font-bold uppercase tracking-widest text-white">{title}</h2>
      {children}
    </section>
  );
}
