import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, canWrite, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const conversations = await prisma.conversation.findMany({
    orderBy: { lastMessageAt: 'desc' },
    take: 50,
    include: {
      assignedTo: { select: { firstName: true, lastName: true } },
      contacts: { include: { contact: { select: { firstName: true, lastName: true, company: { select: { name: true } } } } } },
      messages: { take: 1, orderBy: { createdAt: 'desc' } },
    },
  });
  res.json({ success: true, data: conversations });
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const conv = await prisma.conversation.findUnique({
    where: { id: req.params.id },
    include: {
      assignedTo: { select: { firstName: true, lastName: true } },
      contacts: { include: { contact: true } },
      messages: { orderBy: { createdAt: 'asc' }, take: 100 },
    },
  });
  if (!conv) throw new AppError('Conversation not found', 404);
  res.json({ success: true, data: conv });
});

router.post('/:id/assign', canWrite, async (req: AuthRequest, res: Response) => {
  const { assignedToId } = z.object({ assignedToId: z.string() }).parse(req.body);
  const conv = await prisma.conversation.update({ where: { id: req.params.id }, data: { assignedToId } });
  res.json({ success: true, data: conv });
});

router.post('/:id/close', canWrite, async (req: AuthRequest, res: Response) => {
  const conv = await prisma.conversation.update({ where: { id: req.params.id }, data: { isOpen: false } });
  res.json({ success: true, data: conv });
});

// Internal note in conversation
router.post('/:id/notes', canWrite, async (req: AuthRequest, res: Response) => {
  const { body } = z.object({ body: z.string().min(1) }).parse(req.body);
  const msg = await prisma.conversationMessage.create({
    data: { conversationId: req.params.id, direction: 'internal', body, isInternal: true },
  });
  res.status(201).json({ success: true, data: msg });
});

export default router;
