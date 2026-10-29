import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate, managerOrAbove, AuthRequest } from '../../middleware/auth';

const router = Router();
router.use(authenticate, managerOrAbove);

router.get('/', async (req: AuthRequest, res: Response) => {
  const query = z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().max(100).default(50),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    userId: z.string().optional(),
    action: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  }).parse(req.query);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (query.entityType) where.entityType = query.entityType;
  if (query.entityId) where.entityId = query.entityId;
  if (query.userId) where.userId = query.userId;
  if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(query.from);
    if (query.to) where.createdAt.lte = new Date(query.to);
  }

  const skip = (query.page - 1) * query.limit;
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where, skip, take: query.limit, orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({ success: true, data: logs, meta: { total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) } });
});

export default router;
