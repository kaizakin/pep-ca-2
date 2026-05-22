import { AlertTriangle, CheckCircle2, Terminal } from 'lucide-react';
import type { Analytics } from '../lib/api';

type AiInsightsProps = {
  analytics: Analytics;
};

const priorityClasses = {
  HIGH: 'border-[#151515] bg-[#151515] text-white',
  MEDIUM: 'border-[#bbb4a6] bg-[#f3f1eb] text-[#151515]',
  LOW: 'border-[#d7d2c6] bg-white text-[#55514b]'
};

export function AiInsights({ analytics }: AiInsightsProps) {
  return (
    <section className="border border-[#ece9e2] bg-white p-6 shadow-[0_18px_45px_rgba(20,20,20,0.04)]">
      <div className="mb-5 flex items-center gap-3 text-[#151515]">
        <Terminal size={20} strokeWidth={1.8} />
        <h2 className="text-sm font-black uppercase tracking-[-0.04em] text-[#151515]">AI Insights Terminal</h2>
      </div>

      <div className="border border-[#ece9e2] bg-[#fbfaf7] p-5 text-sm leading-7 text-[#55514b]">
        <p className="font-black text-[#151515]">$ gemini sprint-analysis --repo {analytics.fullName}</p>
        <p className="mt-3 whitespace-pre-line">{analytics.ai.sprintSummary || 'No sprint summary generated yet.'}</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[#151515]">
            <AlertTriangle size={18} strokeWidth={1.8} />
            <h3 className="text-sm font-black uppercase tracking-[-0.04em]">Bottlenecks</h3>
          </div>
          <ul className="space-y-3">
            {emptyFallback(analytics.ai.bottlenecks, 'No bottlenecks detected.').map((item) => (
              <li key={item} className="border border-[#ece9e2] bg-[#fbfaf7] p-4 text-sm leading-6 text-[#686660]">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-[#151515]">
            <CheckCircle2 size={18} strokeWidth={1.8} />
            <h3 className="text-sm font-black uppercase tracking-[-0.04em]">Recommendations</h3>
          </div>
          <ul className="space-y-3">
            {analytics.ai.recommendations.length ? (
              analytics.ai.recommendations.map((recommendation) => (
                <li key={`${recommendation.priority}-${recommendation.actionItem}`} className="border border-[#ece9e2] bg-[#fbfaf7] p-4 text-sm leading-6 text-[#686660]">
                  <span className={`mr-3 inline-flex border px-2 py-1 text-[10px] font-black ${priorityClasses[recommendation.priority]}`}>
                    {recommendation.priority}
                  </span>
                  {recommendation.actionItem}
                </li>
              ))
            ) : (
              <li className="border border-[#ece9e2] bg-[#fbfaf7] p-4 text-sm leading-6 text-[#686660]">
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
