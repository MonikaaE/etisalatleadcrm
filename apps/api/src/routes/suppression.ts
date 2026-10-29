import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, canWrite, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const suppressions = await prisma.suppressionEntry.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  res.json({ success: true, data: suppressions });
});

router.post('/', canWrite, async (req: AuthRequest, res: Response) => {
  const data = z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    contactId: z.string().optional(),
    channel: z.enum(['EMAIL', 'WHATSAPP', 'SMS', 'PHONE']).optional(),
    reason: z.enum(['UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED', 'DO_NOT_CONTACT', 'OPT_OUT_WHATSAPP', 'LEGAL_REQUEST', 'DUPLICATE']),
    notes: z.string().optional(),
  }).parse(req.body);

  const entry = await prisma.suppressionEntry.create({ data: { ...data, addedById: req.user!.id, source: 'manual' } });
  res.status(201).json({ success: true, data: entry });
});

router.delete('/:id', canWrite, async (_req: AuthRequest, res: Response) => {
  await prisma.suppressionEntry.delete({ where: { id: _req.params.id } });
  res.json({ success: true, message: 'Suppression removed' });
});

// Check if a specific email/phone is suppressed
router.post('/check', async (req: AuthRequest, res: Response) => {
  const { email, phone, channel } = z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    channel: z.string().optional(),
  }).parse(req.body);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { OR: [] };
  if (email) where.OR.push({ email });
  if (phone) where.OR.push({ phone });
  if (channel) where.channel = channel;

  const entry = where.OR.length > 0 ? await prisma.suppressionEntry.findFirst({ where }) : null;
  res.json({ success: true, data: { suppressed: !!entry, entry } });
});

export default router;
