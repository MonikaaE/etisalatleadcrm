import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate, adminOnly, AuthRequest } from '../../middleware/auth';

const router = Router();
router.use(authenticate, adminOnly);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const integrations = await prisma.integrationConfig.findMany();
  res.json({ success: true, data: integrations });
});

router.put('/:key', async (req: AuthRequest, res: Response) => {
  const data = z.object({
    isEnabled: z.boolean().optional(),
    publicConfig: z.record(z.unknown()).optional(),
  }).parse(req.body);

  const integration = await prisma.integrationConfig.update({
    where: { key: req.params.key },
    data,
  });
  res.json({ success: true, data: integration });
});

export default router;
