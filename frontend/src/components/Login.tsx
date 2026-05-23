import { useState } from 'react';
import { Bot, Github, GitPullRequest, Shield, Zap, Plus } from 'lucide-react';
import { getGitHubLoginUrl } from '../lib/api';

const features = [
  {
    icon: Shield,
    title: 'Secure GitHub Authentication',
    body: 'Sign in securely with your GitHub account. All tokens are encrypted with AES-256 before storage.'
  },
  {
    icon: GitPullRequest,
    title: 'Deep Repository Ingestion',
    body: 'Collect commits, PR lifecycle data, issue labels, and review bottlenecks directly from the GitHub API.'
  },
  {
    icon: Bot,
    title: 'Gemini AI Insights',
    body: 'Generate structured sprint summaries, identify key risks, and get prioritized recommendations instantly.'
  },
  {
    icon: Zap,
    title: 'Lightning Fast Cached Results',
    body: 'Serve analytics instantly from our MongoDB cache instead of blocking on slow, long-running AI requests.'
  }
];

type LoginProps = {
  isAuthenticated?: boolean;
};

export function Login({ isAuthenticated = false }: LoginProps) {
  const ctaHref = isAuthenticated ? '/dashboard' : getGitHubLoginUrl();
  const [openFeature, setOpenFeature] = useState<number | null>(0);

  return (
    <main className="min-h-screen bg-brand-dark text-white font-sans selection:bg-brand-orange/30 flex flex-col">
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[800px] px-4">
        <header className="flex items-center justify-between rounded-full border border-[#23272e] bg-[#111317]/80 backdrop-blur-xl px-4 py-3 shadow-2xl">
          <div className="flex items-center gap-3">
             <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange to-pink-500 shadow-inner">
               <Zap size={16} className="text-white fill-white" />
             </div>
          </div>
          
          <nav className="flex items-center gap-8 text-[13px] font-semibold text-[#8a8f98]">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <a href="https://github.com" className="hidden sm:flex items-center gap-2 rounded-lg bg-[#1a1c21] border border-[#2a2d35] px-3 py-1.5 text-xs font-semibold text-[#a1a6b0] hover:text-white transition-colors">
              <span className="text-yellow-500 text-sm">★</span> 1,714
            </a>
            <a
              href={ctaHref}
              className="flex items-center gap-2 rounded-lg bg-[#df8b5b] px-4 py-2 text-[13px] font-bold text-black transition-transform hover:bg-[#e6986b]"
            >
              <span className="hidden sm:inline">Connect</span> GitHub
            </a>
          </div>
        </header>
      </div>

      <div className="flex-1">
        <section className="relative mx-auto max-w-4xl px-6 pb-20 pt-52 flex flex-col items-center text-center">
          <div className="absolute left-1/2 top-40 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-[#df8b5b]/10 blur-[120px] pointer-events-none" />

          <div className="relative z-10 w-full">
            <h1 className="text-6xl md:text-7xl font-bold tracking-[-0.04em] mb-6 leading-[1.1]">
              Everything your sprint <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#df8b5b] to-[#b86d42]">needs.</span>
            </h1>
            <p className="mx-auto max-w-xl text-[17px] text-[#8a8f98] mb-12 leading-relaxed">
              A clean, mechanics-first dashboard for GitHub teams. Sync repository activity, cache analytics, and turn
              sprint noise into scannable AI insights.
            </p>
          </div>
        </section>

        <section id="features" className="relative z-10 mx-auto w-full max-w-[700px] px-6 pb-32">
          <div className="flex flex-col gap-4">
            {features.map((feature, idx) => {
              const isOpen = openFeature === idx;
              return (
                <button
                  key={feature.title}
                  onClick={() => setOpenFeature(isOpen ? null : idx)}
                  className={`group flex flex-col rounded-2xl border transition-all duration-300 text-left overflow-hidden ${
                    isOpen 
                      ? 'border-[#2d323a] bg-gradient-to-b from-[#1c2025] to-[#15181c]' 
                      : 'border-[#1f2329] bg-[#15181c] hover:bg-[#1c2025] hover:border-[#2d323a]'
                  }`}
                >
                  <div className="flex w-full items-center justify-between p-5 md:p-6">
                    <span className="text-[15px] md:text-[17px] font-medium text-[#e2e8f0]">{feature.title}</span>
                    <Plus className={`text-[#df8b5b] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} size={20} />
                  </div>
                  <div 
                    className={`px-5 md:px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-[15px] text-[#8a8f98] leading-relaxed">
                      {feature.body}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <footer className="bg-[#e68f5e] w-full text-[#111317]">
        <div className="mx-auto flex flex-col md:flex-row justify-between items-end gap-10 px-6 lg:px-12 py-16 w-full max-w-screen-2xl">
          <div className="w-full md:w-auto text-left">
            <h2 className="text-[16vw] md:text-[12vw] leading-[0.8] font-bold tracking-tight">
              DevTrackr
            </h2>
          </div>
          <div className="flex flex-col gap-3 text-[17px] font-medium text-[#111317]/80 shrink-0 pb-2 md:pb-4 self-start md:self-end text-left md:text-right">
            <a href="https://github.com" className="hover:text-black transition-colors">Github</a>
            <a href="https://twitter.com" className="hover:text-black transition-colors">Twitter</a>
            <a href="https://discord.com" className="hover:text-black transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

