import cron from 'node-cron';
import { User } from '../models/User.js';
import { RepositoryAnalytics } from '../models/RepositoryAnalytics.js';
import { decryptToken } from '../services/crypto.js';
import { aggregateRepositoryActivity } from '../services/github.js';
import { generateSprintAnalytics } from '../services/ai.js';
import { env } from '../config/env.js';

const DEFAULT_SPRINT_DAYS = 14;

export function startAnalyticsWorker() {
  if (!cron.validate(env.ANALYTICS_CRON)) {
    console.warn(`Invalid ANALYTICS_CRON value: ${env.ANALYTICS_CRON}. Background worker not started.`);
    return;
  }

  cron.schedule(env.ANALYTICS_CRON, async () => {
    try {
      await refreshDueRepositories();
    } catch (error) {
      console.error('Analytics worker failed', error);
    }
  });

  console.log(`Analytics worker scheduled: ${env.ANALYTICS_CRON}`);
}

export async function refreshDueRepositories() {
  const staleBefore = new Date(Date.now() - 15 * 60 * 1000);
  const users = await User.find({
    repositories: { $exists: true, $ne: [] }
  }).limit(25);

  for (const user of users) {
    for (const repository of user.repositories) {
      if (!repository.lastSyncedAt || repository.lastSyncedAt < staleBefore) {
        await refreshRepositoryAnalytics(user, repository.owner, repository.name);
      }
    }
  }
}

export async function refreshRepositoryAnalytics(user, owner, repo) {
  const accessToken = decryptToken(user.encryptedAccessToken);
  const until = new Date();
  const since = new Date(until.getTime() - DEFAULT_SPRINT_DAYS * 24 * 60 * 60 * 1000);
  const activity = await aggregateRepositoryActivity({ accessToken, owner, repo, since, until });
  const ai = await generateSprintAnalytics(activity.repoMetadata, {
    commits: activity.commits,
    pullRequests: activity.pullRequests,
    issues: activity.issues,
    metrics: activity.metrics
  });

  const analytics = await RepositoryAnalytics.findOneAndUpdate(
    { userId: user._id, fullName: `${owner}/${repo}` },
    {
      userId: user._id,
      owner,
      repo,
      fullName: `${owner}/${repo}`,
      calculatedAt: new Date(),
      sprintWindow: { since, until },
      metrics: activity.metrics,
      charts: activity.charts,
      ai,
      rawActivity: {
        commits: activity.commits,
        pullRequests: activity.pullRequests,
        issues: activity.issues
      }
    },
    { upsert: true, new: true }
  );

  await User.updateOne(
    { _id: user._id, 'repositories.fullName': `${owner}/${repo}` },
    { $set: { 'repositories.$.lastSyncedAt': new Date() } }
  );

  return analytics;
}
