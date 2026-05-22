import { Octokit } from '@octokit/rest';
import { env } from '../config/env.js';

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

export function getGitHubOAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    scope: 'repo read:user read:org',
    state
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code
    })
  });

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error(data.error_description || 'GitHub token exchange did not return an access token');
  }

  return data.access_token;
}

export function createOctokit(accessToken) {
  return new Octokit({ auth: accessToken });
}

export async function getAuthenticatedGitHubUser(accessToken) {
  const octokit = createOctokit(accessToken);
  const { data } = await octokit.users.getAuthenticated();

  return {
    githubId: data.id,
    login: data.login,
    avatarUrl: data.avatar_url
  };
}

export async function listUserRepositories(accessToken) {
  const octokit = createOctokit(accessToken);
  const repos = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
    affiliation: 'owner,collaborator,organization_member',
    sort: 'updated',
    per_page: 100
  });

  return repos.map((repo) => ({
    owner: repo.owner.login,
    name: repo.name,
    fullName: repo.full_name,
    lastSyncedAt: null
  }));
}

export async function aggregateRepositoryActivity({ accessToken, owner, repo, since, until }) {
  const octokit = createOctokit(accessToken);
  const [commits, pullRequests, issues] = await Promise.all([
    fetchCommitActivity(octokit, owner, repo, since, until),
    fetchPullRequestActivity(octokit, owner, repo, since, until),
    fetchIssueActivity(octokit, owner, repo, since, until)
  ]);

  return {
    repoMetadata: {
      owner,
      repo,
      sprintWindow: {
        since: since.toISOString(),
        until: until.toISOString()
      }
    },
    commits,
    pullRequests,
    issues,
    metrics: buildMetrics(commits, pullRequests, issues),
    charts: buildCharts(commits, pullRequests)
  };
}

async function fetchCommitActivity(octokit, owner, repo, since, until) {
  const commits = await octokit.paginate(octokit.repos.listCommits, {
    owner,
    repo,
    since: since.toISOString(),
    until: until.toISOString(),
    per_page: 100
  });

  return Promise.all(
    commits.map(async (commit) => {
      const detail = await octokit.repos.getCommit({ owner, repo, ref: commit.sha });
      return {
        sha: commit.sha,
        author: commit.commit.author?.name || commit.author?.login || 'Unknown',
        timestamp: commit.commit.author?.date,
        message: commit.commit.message,
        additions: detail.data.stats?.additions || 0,
        deletions: detail.data.stats?.deletions || 0,
        filesChanged: detail.data.files?.length || 0
      };
    })
  );
}

async function fetchPullRequestActivity(octokit, owner, repo, since, until) {
  const pullRequests = await octokit.paginate(octokit.pulls.list, {
    owner,
    repo,
    state: 'all',
    sort: 'updated',
    direction: 'desc',
    per_page: 100
  });

  const relevantPullRequests = pullRequests.filter(
    (pr) => isWithinWindow(pr.updated_at, since, until) || isWithinWindow(pr.created_at, since, until)
  );

  return Promise.all(
    relevantPullRequests.map(async (pr) => {
      const detail = await octokit.pulls.get({ owner, repo, pull_number: pr.number });
      return {
        number: pr.number,
        title: pr.title,
        state: pr.merged_at ? 'merged' : pr.state,
        author: pr.user?.login || 'Unknown',
        createdAt: pr.created_at,
        mergedAt: pr.merged_at,
        closedAt: pr.closed_at,
        commentsCount: pr.comments + pr.review_comments,
        additions: detail.data.additions || 0,
        deletions: detail.data.deletions || 0,
        changedFiles: detail.data.changed_files || 0,
        hoursToMerge: pr.merged_at ? hoursBetween(pr.created_at, pr.merged_at) : null
      };
    })
  );
}

async function fetchIssueActivity(octokit, owner, repo, since, until) {
  const issues = await octokit.paginate(octokit.issues.listForRepo, {
    owner,
    repo,
    state: 'all',
    since: since.toISOString(),
    per_page: 100
  });

  return issues
    .filter((issue) => !issue.pull_request && isWithinWindow(issue.created_at, since, until))
    .map((issue) => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      createdAt: issue.created_at,
      closedAt: issue.closed_at,
      labels: issue.labels.map((label) => (typeof label === 'string' ? label : label.name)).filter(Boolean),
      closingVelocityHours: issue.closed_at ? hoursBetween(issue.created_at, issue.closed_at) : null
    }));
}

function buildMetrics(commits, pullRequests, issues) {
  const mergedPullRequests = pullRequests.filter((pr) => pr.state === 'merged');
  const averagePrCycleHours = mergedPullRequests.length
    ? mergedPullRequests.reduce((sum, pr) => sum + (pr.hoursToMerge || 0), 0) / mergedPullRequests.length
    : 0;

  return {
    totalCommits: commits.length,
    totalAdditions: commits.reduce((sum, commit) => sum + commit.additions, 0),
    totalDeletions: commits.reduce((sum, commit) => sum + commit.deletions, 0),
    openPullRequests: pullRequests.filter((pr) => pr.state === 'open').length,
    mergedPullRequests: mergedPullRequests.length,
    closedIssues: issues.filter((issue) => issue.state === 'closed').length,
    averagePrCycleHours: Number(averagePrCycleHours.toFixed(1))
  };
}

function buildCharts(commits, pullRequests) {
  const velocityByDate = new Map();
  const commitsByAuthor = new Map();

  for (const commit of commits) {
    const date = new Date(commit.timestamp).toISOString().slice(0, 10);
    const daily = velocityByDate.get(date) || { date, additions: 0, deletions: 0, commits: 0 };
    daily.additions += commit.additions;
    daily.deletions += commit.deletions;
    daily.commits += 1;
    velocityByDate.set(date, daily);

    commitsByAuthor.set(commit.author, (commitsByAuthor.get(commit.author) || 0) + 1);
  }

  return {
    codeVelocity: [...velocityByDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
    workDistribution: [...commitsByAuthor.entries()]
      .map(([contributor, commitCount]) => ({ contributor, commits: commitCount }))
      .sort((a, b) => b.commits - a.commits),
    prCycleTime: pullRequests.map((pr) => ({
      title: pr.title,
      number: pr.number,
      hoursToMerge: pr.hoursToMerge || 0,
      state: pr.state
    }))
  };
}

function isWithinWindow(value, since, until) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  return date >= since && date <= until;
}

function hoursBetween(start, end) {
  return Number(((new Date(end).getTime() - new Date(start).getTime()) / 36e5).toFixed(1));
}
