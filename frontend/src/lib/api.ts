const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';
const TOKEN_KEY = 'devtrackr_token';

export type Repository = {
  owner: string;
  name: string;
  fullName: string;
  lastSyncedAt?: string | null;
};

export type User = {
  id: string;
  githubId: number;
  login: string;
  avatarUrl?: string;
};

export type Analytics = {
  _id: string;
  owner: string;
  repo: string;
  fullName: string;
  calculatedAt: string;
  sprintWindow: {
    since: string;
    until: string;
  };
  metrics: {
    totalCommits: number;
    totalAdditions: number;
    totalDeletions: number;
    openPullRequests: number;
    mergedPullRequests: number;
    closedIssues: number;
    averagePrCycleHours: number;
  };
  charts: {
    codeVelocity: Array<{ date: string; additions: number; deletions: number; commits: number }>;
    workDistribution: Array<{ contributor: string; commits: number }>;
    prCycleTime: Array<{ title: string; number: number; hoursToMerge: number; state: string }>;
  };
  ai: {
    sprintSummary: string;
    inactiveContributors: string[];
    bottlenecks: string[];
    recommendations: Array<{ priority: 'HIGH' | 'MEDIUM' | 'LOW'; actionItem: string }>;
  };
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getGitHubLoginUrl() {
  return `${API_BASE_URL}/auth/github`;
}

export async function getMe() {
  return request<{ user: User; repositories: Repository[] }>('/auth/me');
}

export async function syncRepositories() {
  return request<{ repositories: Repository[] }>('/auth/repositories/sync', { method: 'POST' });
}

export async function listAnalytics() {
  return request<{ analytics: Analytics[] }>('/analytics');
}

export async function refreshAnalytics(owner: string, repo: string) {
  return request<{ analytics: Analytics }>(`/analytics/${owner}/${repo}/refresh`, { method: 'POST' });
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error || 'Request failed');
  }

  return response.json();
}
