import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, canWrite, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { taskSchema } from '@kyzen/shared';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const query = z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().max(100).default(20),
    status: z.string().optional(),
    type: z.string().optional(),
    assigneeId: z.string().optional(),
    companyId: z.string().optional(),
    contactId: z.string().optional(),
    overdue: z.coerce.boolean().optional(),
    dueToday: z.coerce.boolean().optional(),
  }).parse(req.query);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (query.status) where.status = query.status;
  if (query.type) where.type = query.type;
  if (query.assigneeId) where.assigneeId = query.assigneeId;
  if (query.companyId) where.companyId = query.companyId;
  if (query.contactId) where.contactId = query.contactId;
  if (query.overdue) where.dueDate = { lt: todayStart };
  if (query.dueToday) where.dueDate = { gte: todayStart, lt: todayEnd };

  const skip = (query.page - 1) * query.limit;
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where, skip, take: query.limit, orderBy: { dueDate: 'asc' },
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.task.count({ where }),
  ]);

  res.json({ success: true, data: tasks, meta: { total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) } });
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id }, include: { company: true, contact: true, assignee: true, creator: true } });
  if (!task) throw new AppError('Task not found', 404);
  res.json({ success: true, data: task });
});

router.post('/', canWrite, async (req: AuthRequest, res: Response) => {
  const data = taskSchema.parse(req.body);
  const task = await prisma.task.create({
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      creatorId: req.user!.id,
    },
  });
  res.status(201).json({ success: true, data: task });
});

router.put('/:id', canWrite, async (req: AuthRequest, res: Response) => {
  const data = taskSchema.partial().parse(req.body);
  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : undefined },
  });
  res.json({ success: true, data: task });
});

router.patch('/:id/complete', canWrite, async (req: AuthRequest, res: Response) => {
  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });
  if (task.companyId) {
    await prisma.activity.create({
      data: { type: 'TASK_COMPLETED', description: `Task completed: ${task.title}`, companyId: task.companyId, userId: req.user!.id },
    });
  }
  res.json({ success: true, data: task });
});

router.delete('/:id', canWrite, async (req: AuthRequest, res: Response) => {
  await prisma.task.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
  res.json({ success: true, message: 'Task cancelled' });
});

export default router;
