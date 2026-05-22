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

const COLORS = ['#151515', '#8b8880', '#bdb7aa', '#d7d2c6', '#a79f8f', '#5f5b53'];
const tooltipStyle = {
  background: '#ffffff',
  border: '1px solid #ece9e2',
  borderRadius: 0,
  color: '#151515',
  boxShadow: '0 18px 45px rgba(20,20,20,0.08)',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
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
                <stop offset="5%" stopColor="#151515" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#151515" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="deletions" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#bdb7aa" stopOpacity={0.34} />
                <stop offset="95%" stopColor="#bdb7aa" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#ece9e2" strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: '#e7e5df' }} />
            <YAxis tickLine={false} axisLine={{ stroke: '#e7e5df' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="additions" stackId="1" stroke="#151515" fill="url(#additions)" />
            <Area type="monotone" dataKey="deletions" stackId="1" stroke="#8b8880" fill="url(#deletions)" />
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
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="PR Cycle Time" className="xl:col-span-3">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={analytics.charts.prCycleTime} layout="vertical" margin={{ left: 24, right: 24 }}>
            <CartesianGrid stroke="#ece9e2" strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={{ stroke: '#e7e5df' }}
              label={{ value: 'Hours to merge', position: 'insideBottom', offset: -4, fill: '#686660' }}
            />
            <YAxis
              type="category"
              dataKey="number"
              width={80}
              tickLine={false}
              axisLine={{ stroke: '#e7e5df' }}
              tickFormatter={(value) => `#${value}`}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="hoursToMerge" fill="#151515" radius={[0, 0, 0, 0]} />
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
    <section className={`border border-[#ece9e2] bg-white p-6 shadow-[0_18px_45px_rgba(20,20,20,0.04)] ${className}`}>
      <h2 className="mb-5 text-sm font-black uppercase tracking-[-0.04em] text-[#151515]">{title}</h2>
      {children}
    </section>
  );
}
