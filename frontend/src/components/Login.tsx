import { Github, Sparkles } from 'lucide-react';
import { getGitHubLoginUrl } from '../lib/api';

export function Login() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#1e293b,#020617_55%)] px-6 text-slate-100">
      <section className="max-w-3xl rounded-3xl border border-slate-800 bg-slate-950/80 p-10 shadow-2xl shadow-cyan-950/30 backdrop-blur">
        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
          <Sparkles size={28} />
        </div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.4em] text-cyan-300">DevTrackr</p>
        <h1 className="mb-4 text-5xl font-black tracking-tight">Mechanics-first sprint analytics for GitHub teams.</h1>
        <p className="mb-8 max-w-2xl text-lg leading-8 text-slate-300">
          Connect GitHub, ingest structured repository activity, and let Gemini generate cached sprint summaries,
          bottleneck alerts, and prioritized engineering recommendations.
        </p>
        <a
          href={getGitHubLoginUrl()}
          className="inline-flex items-center gap-3 rounded-2xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 transition hover:bg-cyan-200"
        >
          <Github size={20} />
          Continue with GitHub
        </a>
      </section>
    </main>
  );
}
