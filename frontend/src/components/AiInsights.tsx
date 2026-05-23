import { AlertTriangle, CheckCircle2, Terminal } from 'lucide-react';
import type { Analytics } from '../lib/api';

type AiInsightsProps = {
  analytics: Analytics;
};

const priorityClasses = {
  HIGH: 'border-red-500/30 bg-red-500/10 text-red-400',
  MEDIUM: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  LOW: 'border-blue-500/30 bg-blue-500/10 text-blue-400'
};

export function AiInsights({ analytics }: AiInsightsProps) {
  return (
    <section className="rounded-2xl border border-brand-border bg-brand-panel/40 p-6 shadow-xl backdrop-blur-sm mt-5">
      <div className="mb-6 flex items-center gap-3 text-white">
        <Terminal size={20} strokeWidth={2} className="text-brand-orange" />
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-white">AI Insights Terminal</h2>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-brand-orange/30 bg-[#050505] p-6 text-sm leading-relaxed text-brand-text shadow-[0_0_30px_rgba(223,139,91,0.05)]">
        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-brand-orange to-pink-500" />
        <p className="font-mono font-bold text-brand-orange mb-4">$ gemini sprint-analysis --repo {analytics.fullName}</p>
        <p className="whitespace-pre-line font-mono text-[#a1a6b0]">{analytics.ai.sprintSummary || 'No sprint summary generated yet.'}</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <div className="mb-4 flex items-center gap-2 text-white">
            <AlertTriangle size={18} strokeWidth={2} className="text-yellow-500" />
            <h3 className="text-[13px] font-bold uppercase tracking-widest">Bottlenecks</h3>
          </div>
          <ul className="space-y-3">
            {emptyFallback(analytics.ai.bottlenecks, 'No bottlenecks detected.').map((item) => (
              <li key={item} className="rounded-xl border border-brand-border bg-brand-panel p-4 text-[13px] leading-relaxed text-[#a1a6b0]">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-4 flex items-center gap-2 text-white">
            <CheckCircle2 size={18} strokeWidth={2} className="text-green-500" />
            <h3 className="text-[13px] font-bold uppercase tracking-widest">Recommendations</h3>
          </div>
          <ul className="space-y-3">
            {analytics.ai.recommendations.length ? (
              analytics.ai.recommendations.map((recommendation) => (
                <li key={`${recommendation.priority}-${recommendation.actionItem}`} className="rounded-xl border border-brand-border bg-brand-panel p-4 text-[13px] leading-relaxed text-[#a1a6b0] flex items-start gap-3">
                  <span className={`shrink-0 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${priorityClasses[recommendation.priority]}`}>
                    {recommendation.priority}
                  </span>
                  <span className="mt-0.5">{recommendation.actionItem}</span>
                </li>
              ))
            ) : (
              <li className="rounded-xl border border-brand-border bg-brand-panel p-4 text-[13px] leading-relaxed text-[#a1a6b0]">
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
