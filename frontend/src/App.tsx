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
    <main className="min-h-screen bg-[#f7f7f5] font-mono text-[#151515]">
      <div className="mx-auto flex max-w-7xl gap-5 px-6 py-6">
        <aside className="hidden w-80 shrink-0 flex-col border border-[#ece9e2] bg-white p-5 shadow-[0_18px_45px_rgba(20,20,20,0.04)] lg:flex">
          <div className="mb-6 flex items-center gap-3 border-b border-[#ece9e2] pb-5">
            <img src={user?.avatarUrl} alt="" className="h-11 w-11 border border-[#e7e5df] bg-[#fbfaf7]" />
            <div>
              <p className="font-black tracking-[-0.06em]">{user?.login}</p>
              <p className="text-xs text-[#77736b]">GitHub connected</p>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-[#8b8880]" size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search repositories"
              className="w-full border border-[#ece9e2] bg-[#fbfaf7] py-2.5 pl-9 pr-3 text-sm text-[#151515] outline-none ring-[#d7d2c6]/40 placeholder:text-[#a8a39a] focus:ring-4"
            />
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
            {filteredRepositories.map((repository) => (
              <button
                key={repository.fullName}
                onClick={() => setSelectedFullName(repository.fullName)}
                className={`w-full border px-4 py-3 text-left text-sm transition ${
                  selectedFullName === repository.fullName
                    ? 'border-[#151515] bg-[#151515] font-black text-white'
                    : 'border-[#ece9e2] bg-[#fbfaf7] text-[#55514b] hover:border-[#151515] hover:text-[#151515]'
                }`}
              >
                {repository.fullName}
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0 flex-1 space-y-5">
          <header className="border border-[#ece9e2] bg-white p-6 shadow-[0_18px_45px_rgba(20,20,20,0.04)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.36em] text-[#8b8880]">DevTrackr</p>
                <h1 className="mt-3 text-4xl font-black tracking-[-0.08em] text-[#151515]">{selectedFullName || 'Select a repository'}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#686660]">
                  Cached sprint intelligence powered by GitHub activity aggregation and Gemini structured outputs.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSyncRepositories}
                  className="border border-[#ece9e2] bg-[#fbfaf7] px-4 py-3 text-sm font-bold text-[#151515] transition hover:border-[#151515]"
                >
                  Sync repos
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={!selectedRepository || loadState === 'loading'}
                  className="inline-flex items-center gap-2 border border-[#151515] bg-[#151515] px-4 py-3 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw size={16} className={loadState === 'loading' ? 'animate-spin' : ''} />
                  Refresh analytics
                </button>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 border border-[#ece9e2] bg-[#fbfaf7] px-4 py-3 text-sm font-bold text-[#151515] transition hover:border-[#151515]"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
            {message ? (
              <p className={`mt-5 border px-4 py-3 text-sm ${loadState === 'error' ? 'border-[#151515] bg-white text-[#151515]' : 'border-[#ece9e2] bg-[#fbfaf7] text-[#55514b]'}`}>
                {message}
              </p>
            ) : null}
          </header>

          {selectedAnalytics ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total commits" value={selectedAnalytics.metrics.totalCommits} helper="Current sprint window" />
                <MetricCard label="Line delta" value={`+${selectedAnalytics.metrics.totalAdditions} / -${selectedAnalytics.metrics.totalDeletions}`} helper="Additions vs deletions" />
                <MetricCard label="Merged PRs" value={selectedAnalytics.metrics.mergedPullRequests} helper={`${selectedAnalytics.metrics.openPullRequests} open PRs`} />
                <MetricCard label="Avg PR cycle" value={`${selectedAnalytics.metrics.averagePrCycleHours}h`} helper="Created → merged" />
              </div>
              <Charts analytics={selectedAnalytics} />
              <AiInsights analytics={selectedAnalytics} />
            </>
          ) : (
            <div className="border border-dashed border-[#d7d2c6] bg-white p-10 text-center shadow-[0_18px_45px_rgba(20,20,20,0.04)]">
              <h2 className="text-2xl font-black tracking-[-0.08em] text-[#151515]">No cached analytics yet</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#686660]">
                Choose a repository and click “Refresh analytics” to run the Octokit aggregation worker and generate Gemini insights.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
