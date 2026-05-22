import crypto from 'node:crypto';
import { Router } from 'express';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { requireAuth, signUserToken } from '../middleware/auth.js';
import { encryptToken, decryptToken } from '../services/crypto.js';
import {
  exchangeCodeForToken,
  getAuthenticatedGitHubUser,
  getGitHubOAuthUrl,
  listUserRepositories
} from '../services/github.js';

export const authRouter = Router();

const oauthStates = new Map();

authRouter.get('/github', (_req, res) => {
  const state = crypto.randomBytes(24).toString('hex');
  oauthStates.set(state, Date.now() + 10 * 60 * 1000);
  res.redirect(getGitHubOAuthUrl(state));
});

authRouter.get('/github/callback', async (req, res, next) => {
  try {
    const { code, state } = req.query;

    if (!code || !state || !oauthStates.has(state)) {
      return res.status(400).json({ error: 'Invalid GitHub OAuth callback' });
    }

    const expiresAt = oauthStates.get(state);
    oauthStates.delete(state);

    if (expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Expired GitHub OAuth state' });
    }

    const accessToken = await exchangeCodeForToken(code);
    const githubUser = await getAuthenticatedGitHubUser(accessToken);
    const repositories = await listUserRepositories(accessToken);

    const user = await User.findOneAndUpdate(
      { githubId: githubUser.githubId },
      {
        ...githubUser,
        encryptedAccessToken: encryptToken(accessToken),
        repositories
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const token = signUserToken(user);
    const redirectUrl = new URL('/auth/callback', env.CLIENT_URL);
    redirectUrl.searchParams.set('token', token);
    res.redirect(redirectUrl.toString());
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      githubId: req.user.githubId,
      login: req.user.login,
      avatarUrl: req.user.avatarUrl
    },
    repositories: req.user.repositories
  });
});

authRouter.post('/repositories/sync', requireAuth, async (req, res, next) => {
  try {
    const repositories = await listUserRepositories(decryptToken(req.user.encryptedAccessToken));
    req.user.repositories = repositories;
    await req.user.save();
    res.json({ repositories });
  } catch (error) {
    next(error);
  }
});
