import { AlertTriangle, CheckCircle2, Terminal } from 'lucide-react';
import type { Analytics } from '../lib/api';

type AiInsightsProps = {
  analytics: Analytics;
};

const priorityClasses = {
  HIGH: 'border-rose-400/40 bg-rose-400/10 text-rose-200',
  MEDIUM: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  LOW: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
};

export function AiInsights({ analytics }: AiInsightsProps) {
  return (
    <section className="rounded-3xl border border-cyan-400/20 bg-slate-950 p-6 shadow-2xl shadow-cyan-950/20">
      <div className="mb-5 flex items-center gap-3 text-cyan-200">
        <Terminal size={22} />
        <h2 className="text-lg font-bold text-white">AI Insights Terminal</h2>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-black/40 p-5 font-mono text-sm leading-7 text-slate-200">
        <p className="text-cyan-300">$ gemini sprint-analysis --repo {analytics.fullName}</p>
        <p className="mt-3 whitespace-pre-line">{analytics.ai.sprintSummary || 'No sprint summary generated yet.'}</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center gap-2 text-amber-200">
            <AlertTriangle size={18} />
            <h3 className="font-bold text-white">Bottlenecks</h3>
          </div>
          <ul className="space-y-3">
            {emptyFallback(analytics.ai.bottlenecks, 'No bottlenecks detected.').map((item) => (
              <li key={item} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-emerald-200">
            <CheckCircle2 size={18} />
            <h3 className="font-bold text-white">Recommendations</h3>
          </div>
          <ul className="space-y-3">
            {analytics.ai.recommendations.length ? (
              analytics.ai.recommendations.map((recommendation) => (
                <li key={`${recommendation.priority}-${recommendation.actionItem}`} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
                  <span className={`mr-3 rounded-full border px-2 py-1 text-xs font-black ${priorityClasses[recommendation.priority]}`}>
                    {recommendation.priority}
                  </span>
                  {recommendation.actionItem}
                </li>
              ))
            ) : (
              <li className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
                No recommendations generated yet.
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}

function emptyFallback(items: string[], fallback: string) {
  return items.length ? items : [fallback];
}
