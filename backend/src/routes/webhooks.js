import { Router } from 'express';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { verifyGitHubSignature } from '../services/crypto.js';

export const webhooksRouter = Router();

webhooksRouter.post('/github', async (req, res, next) => {
  try {
    if (env.GITHUB_WEBHOOK_SECRET) {
      const signature = req.headers['x-hub-signature-256'];
      const rawBody = req.rawBody;

      if (!rawBody || !verifyGitHubSignature(rawBody, signature, env.GITHUB_WEBHOOK_SECRET)) {
        return res.status(401).json({ error: 'Invalid GitHub webhook signature' });
      }
    }

    const event = req.headers['x-github-event'];
    const fullName = req.body.repository?.full_name;

    if (!fullName || !['push', 'pull_request', 'issues', 'issue_comment'].includes(event)) {
      return res.status(202).json({ ignored: true });
    }

    await User.updateMany(
      { 'repositories.fullName': fullName },
      { $set: { 'repositories.$[repo].lastSyncedAt': null } },
      { arrayFilters: [{ 'repo.fullName': fullName }] }
    );

    res.status(202).json({ queued: true, repository: fullName, event });
  } catch (error) {
    next(error);
  }
});
