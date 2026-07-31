import { Router } from 'express';
import { ah } from '../asyncHandler';
import { requirePermission } from '../auth';
import { config } from '../config';
import { getStoreOpen, setStoreOpen } from '../settings';

export const configRouter = Router();

configRouter.get(
  '/',
  ah(async (_req, res) => {
    res.json({ ...config, storeOpen: await getStoreOpen() });
  })
);

configRouter.patch(
  '/',
  requirePermission('users'),
  ah(async (req, res) => {
    const storeOpen = !!req.body.storeOpen;
    await setStoreOpen(storeOpen);
    res.json({ ...config, storeOpen });
  })
);
