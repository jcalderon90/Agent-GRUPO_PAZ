import { Router } from 'express';
import { authPool } from '../../config/database.js';
import { env } from '../../config/env.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    await authPool.query('SELECT 1');
    res.json({
      status: 'ok',
      project: env.PROJECT_NAME,
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({ status: 'error', db: 'unreachable' });
  }
});
