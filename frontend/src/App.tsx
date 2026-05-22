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
    void bootstrap();
  }, [bootstrap, token]);

  const selectedRepository = repositories.find((repository) => repository.fullName === selectedFullName);
  const selectedAnalytics = analytics.find((item) => item.fullName === selectedFullName);
  const filteredRepositories = useMemo(
    () => repositories.filter((repository) => repository.fullName.toLowerCase().includes(query.toLowerCase())),
    [repositories, query]
  );

  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback onAuthenticated={() => setTokenState(getToken())} />;
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
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-8">
        <aside className="hidden w-80 shrink-0 flex-col rounded-3xl border border-slate-800 bg-slate-900/60 p-5 lg:flex">
          <div className="mb-6 flex items-center gap-3">
            <img src={user?.avatarUrl} alt="" className="h-11 w-11 rounded-2xl border border-slate-700" />
            <div>
              <p className="font-bold">{user?.login}</p>
              <p className="text-xs text-slate-400">GitHub connected</p>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-slate-500" size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search repositories"
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-sm outline-none ring-cyan-400/30 focus:ring-4"
            />
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
            {filteredRepositories.map((repository) => (
              <button
                key={repository.fullName}
                onClick={() => setSelectedFullName(repository.fullName)}
                className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
                  selectedFullName === repository.fullName
                    ? 'bg-cyan-300 font-bold text-slate-950'
                    : 'bg-slate-950/70 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {repository.fullName}
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0 flex-1 space-y-6">
          <header className="rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top_right,#164e63,#0f172a_45%,#020617)] p-6 shadow-2xl shadow-slate-950/20">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">DevTrackr</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight">{selectedFullName || 'Select a repository'}</h1>
                <p className="mt-3 max-w-2xl text-slate-300">
                  Cached sprint intelligence powered by GitHub activity aggregation and Gemini structured outputs.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleSyncRepositories} className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-slate-800">
                  Sync repos
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={!selectedRepository || loadState === 'loading'}
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw size={16} className={loadState === 'loading' ? 'animate-spin' : ''} />
                  Refresh analytics
                </button>
                <button onClick={handleSignOut} className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-slate-800">
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
            {message ? (
              <p className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${loadState === 'error' ? 'border-rose-400/30 bg-rose-400/10 text-rose-200' : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100'}`}>
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
            <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center">
              <h2 className="text-2xl font-black text-white">No cached analytics yet</h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-400">
                Choose a repository and click “Refresh analytics” to run the Octokit aggregation worker and generate Gemini insights.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
