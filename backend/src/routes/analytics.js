import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { RepositoryAnalytics } from '../models/RepositoryAnalytics.js';
import { refreshRepositoryAnalytics } from '../workers/analyticsWorker.js';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

analyticsRouter.get('/', async (req, res, next) => {
  try {
    const analytics = await RepositoryAnalytics.find({ userId: req.user._id })
      .sort({ calculatedAt: -1 })
      .select('-rawActivity')
      .lean();

    res.json({ analytics });
  } catch (error) {
    next(error);
  }
});

analyticsRouter.get('/:owner/:repo', async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const analytics = await RepositoryAnalytics.findOne({
      userId: req.user._id,
      owner,
      repo
    }).lean();

    if (!analytics) {
      return res.status(404).json({ error: 'Analytics cache not found. Trigger a refresh first.' });
    }

    res.json({ analytics });
  } catch (error) {
    next(error);
  }
});

analyticsRouter.post('/:owner/:repo/refresh', async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const hasRepository = req.user.repositories.some(
      (repository) => repository.owner === owner && repository.name === repo
    );

    if (!hasRepository) {
      return res.status(403).json({ error: 'Repository is not available for this GitHub account' });
    }

    const analytics = await refreshRepositoryAnalytics(req.user, owner, repo);
    res.status(202).json({ analytics });
  } catch (error) {
    next(error);
  }
});
