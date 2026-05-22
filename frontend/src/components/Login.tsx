import { BarChart3, Bot, Github, GitPullRequest, Shield, Zap } from 'lucide-react';
import { getGitHubLoginUrl } from '../lib/api';

const features = [
  {
    icon: Shield,
    title: 'GitHub Authentication',
    body: 'Secure sign-in with your GitHub account. Tokens are encrypted before storage.'
  },
  {
    icon: GitPullRequest,
    title: 'Repository Ingestion',
    body: 'Collect commits, PR lifecycle data, issue labels, and review bottlenecks.'
  },
  {
    icon: Bot,
    title: 'Gemini Insights',
    body: 'Generate structured sprint summaries, risks, and prioritized recommendations.'
  },
  {
    icon: BarChart3,
    title: 'Visual Analytics',
    body: 'Track velocity, work distribution, and PR cycle time with clean dashboard charts.'
  },
  {
    icon: Zap,
    title: 'Cached Results',
    body: 'Serve analytics instantly from MongoDB instead of blocking on long AI requests.'
  },
  {
    icon: Github,
    title: 'Webhook Ready',
    body: 'Mark repositories stale from GitHub events and avoid aggressive polling.'
  }
];

export function Login() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f7f5] font-mono text-[#151515]">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-[#e7e5df] px-6 py-5">
        <div className="text-2xl font-black tracking-[-0.18em]">dt</div>
        <nav className="flex items-center gap-6 text-xs font-semibold text-[#686660]">
          <a href="#features" className="hidden hover:text-[#151515] sm:inline">
            Features
          </a>
          <a
            href={getGitHubLoginUrl()}
            className="rounded-lg bg-[#171717] px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition hover:bg-black"
          >
            Log in
          </a>
          <a href="https://github.com" className="hidden items-center gap-1 text-[#44413c] sm:flex" aria-label="GitHub">
            <Github size={16} />
            <span>1</span>
          </a>
        </nav>
      </header>

      <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-10">
        <div className="absolute left-1/2 top-0 h-[420px] w-[920px] -translate-x-1/2 rounded-full bg-white blur-3xl" />

        <div className="relative mx-auto max-w-4xl rounded-[1.4rem] border border-[#ece9e2] bg-white/80 p-3 shadow-[0_25px_90px_rgba(20,20,20,0.08)]">
          <div className="grid min-h-[270px] grid-cols-1 overflow-hidden rounded-[1rem] border border-[#ece9e2] bg-[#fbfaf7] md:grid-cols-[1fr_1.05fr_1fr]">
            <div className="hidden border-r border-[#ece9e2] bg-gradient-to-r from-[#fbfaf7] to-white md:block" />

            <div className="flex flex-col items-center justify-center gap-3 border-x border-[#ece9e2] bg-white px-4 py-7">
              <div className="h-2 w-40 rounded-full bg-[#f0eee8]" />
              <PreviewCard title="Sprint Velocity" subtitle="main · last 14 days" metric="+12.4k" />
              <PreviewCard title="PR Cycle Time" subtitle="review bottlenecks" metric="18h" />
              <PreviewCard title="AI Recommendations" subtitle="Gemini structured output" metric="HIGH" />
            </div>

            <div className="flex items-center justify-center bg-gradient-to-l from-[#fbfaf7] to-white px-8 text-right text-xs text-[#55514b]">
              Connect GitHub repos to DevTrackr
            </div>
          </div>
        </div>

        <div className="relative mt-28 max-w-2xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.36em] text-[#8b8880]">DevTrackr</p>
          <h1 className="text-4xl font-black leading-tight tracking-[-0.08em] sm:text-5xl">Everything your sprint needs.</h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#686660]">
            A clean, mechanics-first dashboard for GitHub teams. Sync repository activity, cache analytics, and turn
            sprint noise into scannable AI insights.
          </p>
          <a
            href={getGitHubLoginUrl()}
            className="mt-8 inline-flex items-center gap-2 rounded-xl border border-[#171717] bg-[#171717] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(0,0,0,0.16)]"
          >
            <Github size={17} />
            Continue with GitHub
          </a>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid border border-[#ece9e2] bg-white md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="min-h-36 border-b border-r border-[#ece9e2] p-6 last:border-r-0">
                <div className="mb-4 flex items-center gap-3">
                  <Icon size={17} strokeWidth={1.8} />
                  <h2 className="text-sm font-black tracking-[-0.05em]">{feature.title}</h2>
                </div>
                <p className="max-w-xs text-sm leading-6 text-[#77736b]">{feature.body}</p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

type PreviewCardProps = {
  title: string;
  subtitle: string;
  metric: string;
};

function PreviewCard({ title, subtitle, metric }: PreviewCardProps) {
  return (
    <div className="grid w-full max-w-[270px] grid-cols-[88px_1fr] gap-4 rounded-lg border border-[#ece9e2] bg-white p-3 shadow-[0_12px_32px_rgba(20,20,20,0.06)]">
      <div className="flex h-16 items-end gap-1 rounded bg-[#f3f1eb] p-2">
        <span className="h-5 w-3 rounded-sm bg-[#d7d2c6]" />
        <span className="h-8 w-3 rounded-sm bg-[#bbb4a6]" />
        <span className="h-11 w-3 rounded-sm bg-[#151515]" />
        <span className="h-7 w-3 rounded-sm bg-[#d7d2c6]" />
      </div>
      <div className="min-w-0 py-1">
        <p className="truncate text-[11px] font-black tracking-[-0.04em]">{title}</p>
        <p className="mt-1 truncate text-[10px] text-[#77736b]">{subtitle}</p>
        <p className="mt-3 text-xs font-black">{metric}</p>
      </div>
    </div>
  );
}
