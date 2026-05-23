import { useCallback, useEffect, useMemo, useState } from 'react';
import { LogOut, RefreshCw, Search } from 'lucide-react';
import { AiInsights } from './components/AiInsights';
import { AuthCallback } from './components/AuthCallback';
import { Charts } from './components/Charts';
import { Login } from './components/Login';
import { MetricCard } from './components/MetricCard';
import {
  type Analytics,
  type Repository,
  type User,
  clearToken,
  getMe,
  getToken,
  listAnalytics,
  refreshAnalytics,
  syncRepositories
} from './lib/api';

type LoadState = 'idle' | 'loading' | 'error';

export default function App() {
  const [token, setTokenState] = useState(getToken());
  const [user, setUser] = useState<User | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [selectedFullName, setSelectedFullName] = useState('');
  const [query, setQuery] = useState('');
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [message, setMessage] = useState('');
  const pathname = window.location.pathname;

  const bootstrap = useCallback(async () => {
    if (!getToken()) {
      return;
    }

    setLoadState('loading');
    setMessage('');

    try {
      const [{ user: nextUser, repositories: nextRepositories }, analyticsResponse] = await Promise.all([
        getMe(),
        listAnalytics()
      ]);
      setUser(nextUser);
      setRepositories(nextRepositories);
      setAnalytics(analyticsResponse.analytics);
      setSelectedFullName((current) => current || analyticsResponse.analytics[0]?.fullName || nextRepositories[0]?.fullName || '');
      setLoadState('idle');
    } catch (error) {
      clearToken();
      setTokenState(null);
      setLoadState('error');
      setMessage(error instanceof Error ? error.message : 'Failed to load dashboard');
    }
  }, []);

  useEffect(() => {
    if (pathname === '/dashboard') {
      void bootstrap();
    }
  }, [bootstrap, pathname, token]);

  const selectedRepository = repositories.find((repository) => repository.fullName === selectedFullName);
  const selectedAnalytics = analytics.find((item) => item.fullName === selectedFullName);
  const filteredRepositories = useMemo(
    () => repositories.filter((repository) => repository.fullName.toLowerCase().includes(query.toLowerCase())),
    [repositories, query]
  );

  if (pathname === '/auth/callback') {
    return <AuthCallback onAuthenticated={() => setTokenState(getToken())} />;
  }

  if (pathname !== '/dashboard') {
    return <Login isAuthenticated={Boolean(token)} />;
  }

  if (!token) {
    return <Login />;
  }

  async function handleRefresh() {
    if (!selectedRepository) {
      return;
    }

    setMessage('Refreshing repository activity and Gemini insights…');
    setLoadState('loading');

    try {
      const response = await refreshAnalytics(selectedRepository.owner, selectedRepository.name);
      setAnalytics((current) => [response.analytics, ...current.filter((item) => item.fullName !== response.analytics.fullName)]);
      setMessage('Analytics cache refreshed.');
      setLoadState('idle');
    } catch (error) {
      setLoadState('error');
      setMessage(error instanceof Error ? error.message : 'Refresh failed');
    }
  }

  async function handleSyncRepositories() {
    setMessage('Syncing GitHub repositories…');
    setLoadState('loading');

    try {
      const response = await syncRepositories();
      setRepositories(response.repositories);
      setSelectedFullName((current) => current || response.repositories[0]?.fullName || '');
      setMessage('Repository list synced.');
      setLoadState('idle');
    } catch (error) {
      setLoadState('error');
      setMessage(error instanceof Error ? error.message : 'Repository sync failed');
    }
  }

  function handleSignOut() {
    clearToken();
    setTokenState(null);
    setUser(null);
    setRepositories([]);
    setAnalytics([]);
    window.location.href = '/';
  }

  return (
    <main className="min-h-screen bg-brand-dark font-sans text-white selection:bg-brand-orange/30 flex">
      <aside className="hidden w-80 shrink-0 flex-col border-r border-brand-border bg-[#0a0a0a] p-6 lg:flex h-screen sticky top-0 overflow-y-auto">
        <div className="mb-6 flex items-center gap-4 border-b border-brand-border pb-6">
          <img src={user?.avatarUrl} alt="" className="h-12 w-12 rounded-full border border-brand-border bg-brand-panel object-cover shadow-lg" />
          <div>
            <p className="font-bold text-[15px]">{user?.login}</p>
            <p className="text-[12px] text-brand-text">GitHub connected</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-3 text-brand-text" size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search repositories"
            className="w-full rounded-xl border border-brand-border bg-brand-panel py-2.5 pl-10 pr-4 text-[13px] text-white outline-none ring-brand-orange/50 placeholder:text-brand-text/50 focus:ring-2 focus:border-brand-orange/50 transition-all shadow-inner"
          />
        </div>

        <div className="min-h-0 flex-1 space-y-2 pr-1">
          {filteredRepositories.map((repository) => (
            <button
              key={repository.fullName}
              onClick={() => setSelectedFullName(repository.fullName)}
              className={`w-full rounded-xl border px-4 py-3 text-left text-[13px] transition-all duration-200 ${
                selectedFullName === repository.fullName
                  ? 'border-brand-orange bg-brand-orange/10 font-bold text-brand-orange shadow-[0_0_15px_rgba(223,139,91,0.15)]'
                  : 'border-transparent bg-transparent text-brand-text hover:bg-brand-panel hover:text-white'
              }`}
            >
              {repository.fullName}
            </button>
          ))}
        </div>
      </aside>

      <section className="min-w-0 flex-1 flex flex-col h-screen overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl p-6 lg:p-10 space-y-8">
          <header className="rounded-2xl border border-brand-border bg-brand-panel/40 p-6 lg:p-8 shadow-xl backdrop-blur-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-text mb-2">DevTrackr Dashboard</p>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">{selectedFullName || 'Select a repository'}</h1>
                <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-brand-text">
                  Cached sprint intelligence powered by GitHub activity aggregation and Gemini structured outputs.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleSyncRepositories}
                  className="rounded-full border border-brand-border bg-brand-panel px-4 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-brand-border hover:shadow-lg"
                >
                  Sync repos
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={!selectedRepository || loadState === 'loading'}
                  className="inline-flex items-center gap-2 rounded-full border border-transparent bg-brand-orange px-5 py-2.5 text-[13px] font-bold text-[#0a0a0a] transition-all hover:brightness-110 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_rgba(223,139,91,0.3)]"
                >
                  <RefreshCw size={14} className={loadState === 'loading' ? 'animate-spin' : ''} />
                  Refresh analytics
                </button>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center justify-center rounded-full border border-brand-border bg-brand-panel h-10 w-10 text-brand-text transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
            {message ? (
              <div className={`mt-6 rounded-xl border px-4 py-3 text-[13px] backdrop-blur-md flex items-center gap-3 ${loadState === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-brand-border bg-brand-panel text-brand-text'}`}>
                {loadState === 'error' ? <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> : <div className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />}
                {message}
              </div>
            ) : null}
          </header>

          {selectedAnalytics ? (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total commits" value={selectedAnalytics.metrics.totalCommits} helper="Current sprint window" />
                <MetricCard label="Line delta" value={`+${selectedAnalytics.metrics.totalAdditions} / -${selectedAnalytics.metrics.totalDeletions}`} helper="Additions vs deletions" />
                <MetricCard label="Merged PRs" value={selectedAnalytics.metrics.mergedPullRequests} helper={`${selectedAnalytics.metrics.openPullRequests} open PRs`} />
                <MetricCard label="Avg PR cycle" value={`${selectedAnalytics.metrics.averagePrCycleHours}h`} helper="Created → merged" />
              </div>
              <Charts analytics={selectedAnalytics} />
              <AiInsights analytics={selectedAnalytics} />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-brand-border bg-brand-panel/20 p-12 text-center backdrop-blur-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-panel mb-6 border border-brand-border shadow-inner">
                 <Search size={24} className="text-brand-text" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-3">No cached analytics yet</h2>
              <p className="mx-auto max-w-lg text-[14px] leading-relaxed text-brand-text">
                Choose a repository from the sidebar and click “Refresh analytics” to run the Octokit aggregation worker and generate Gemini insights.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
