import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const jobs = await prisma.enrichmentJob.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  res.json({ success: true, data: jobs });
});

router.post('/:id/approve', async (req: AuthRequest, res: Response) => {
  const job = await prisma.enrichmentJob.update({
    where: { id: req.params.id },
    data: { status: 'COMPLETED', reviewedById: req.user!.id, reviewedAt: new Date() },
  });
  res.json({ success: true, data: job });
});

router.post('/:id/reject', async (req: AuthRequest, res: Response) => {
  const { notes } = z.object({ notes: z.string().optional() }).parse(req.body);
  const job = await prisma.enrichmentJob.update({
    where: { id: req.params.id },
    data: { status: 'REJECTED', reviewedById: req.user!.id, reviewedAt: new Date(), notes },
  });
  res.json({ success: true, data: job });
});

export default router;
