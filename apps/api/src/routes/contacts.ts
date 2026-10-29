import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, canWrite, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { contactSchema } from '@kyzen/shared';
import { createAuditLog } from '../services/audit';
import { normalizePhone } from '../lib/utils';

const router = Router();
router.use(authenticate);

// GET /api/v1/contacts
router.get('/', async (req: AuthRequest, res: Response) => {
  const query = z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().max(100).default(20),
    search: z.string().optional(),
    companyId: z.string().optional(),
    emailOptIn: z.coerce.boolean().optional(),
    whatsappOptIn: z.coerce.boolean().optional(),
    assignedToId: z.string().optional(),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }).parse(req.query);

  const { page, limit, search, companyId, emailOptIn, whatsappOptIn, assignedToId, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { isDeleted: false };
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (companyId) where.companyId = companyId;
  if (emailOptIn !== undefined) where.emailOptIn = emailOptIn;
  if (whatsappOptIn !== undefined) where.whatsappOptIn = whatsappOptIn;
  if (assignedToId) where.assignedToId = assignedToId;

  const validSortFields = ['createdAt', 'updatedAt', 'firstName', 'lastName', 'email'];
  const orderBy = validSortFields.includes(sortBy) ? { [sortBy]: sortOrder } : { createdAt: 'desc' as const };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where, skip, take: limit, orderBy,
      include: {
        company: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        tags: { include: { tag: true } },
        _count: { select: { tasks: true, notes: true } },
      },
    }),
    prisma.contact.count({ where }),
  ]);

  res.json({ success: true, data: contacts, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

// GET /api/v1/contacts/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const contact = await prisma.contact.findFirst({
    where: { id: req.params.id, isDeleted: false },
    include: {
      company: true,
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      tags: { include: { tag: true } },
      notes: { orderBy: { createdAt: 'desc' }, take: 10, include: { author: { select: { firstName: true, lastName: true } } } },
      tasks: { where: { status: { not: 'COMPLETED' } } },
      activities: { orderBy: { createdAt: 'desc' }, take: 20, include: { user: { select: { firstName: true, lastName: true } } } },
      channelPermissions: true,
    },
  });
  if (!contact) throw new AppError('Contact not found', 404);
  res.json({ success: true, data: contact });
});

// POST /api/v1/contacts
router.post('/', canWrite, async (req: AuthRequest, res: Response) => {
  const data = contactSchema.parse(req.body);
  const phoneNormalized = data.phone ? normalizePhone(data.phone) : undefined;
  const fullName = `${data.firstName} ${data.lastName}`;

  const contact = await prisma.contact.create({
    data: {
      ...data,
      fullName,
      phoneNormalized,
      email: data.email || undefined,
      createdById: req.user!.id,
    },
  });

  await createAuditLog({ action: 'CREATE', entityType: 'Contact', entityId: contact.id, userId: req.user!.id, after: contact });
  res.status(201).json({ success: true, data: contact });
});

// PUT /api/v1/contacts/:id
router.put('/:id', canWrite, async (req: AuthRequest, res: Response) => {
  const existing = await prisma.contact.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!existing) throw new AppError('Contact not found', 404);

  const data = contactSchema.partial().parse(req.body);
  const phoneNormalized = data.phone ? normalizePhone(data.phone) : undefined;
  const fullName = data.firstName || data.lastName
    ? `${data.firstName || existing.firstName} ${data.lastName || existing.lastName}`
    : undefined;

  const contact = await prisma.contact.update({
    where: { id: req.params.id },
    data: { ...data, fullName, phoneNormalized, email: data.email || undefined },
  });

  await createAuditLog({ action: 'UPDATE', entityType: 'Contact', entityId: contact.id, userId: req.user!.id, before: existing, after: contact });
  res.json({ success: true, data: contact });
});

// DELETE /api/v1/contacts/:id
router.delete('/:id', canWrite, async (req: AuthRequest, res: Response) => {
  const existing = await prisma.contact.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!existing) throw new AppError('Contact not found', 404);

  await prisma.contact.update({ where: { id: req.params.id }, data: { isDeleted: true, deletedAt: new Date() } });
  await createAuditLog({ action: 'DELETE', entityType: 'Contact', entityId: req.params.id, userId: req.user!.id });

  res.json({ success: true, message: 'Contact deleted' });
});

// PATCH /api/v1/contacts/:id/opt-in
router.patch('/:id/opt-in', canWrite, async (req: AuthRequest, res: Response) => {
  const { channel, optIn, source, consentWording } = z.object({
    channel: z.enum(['EMAIL', 'WHATSAPP']),
    optIn: z.boolean(),
    source: z.string().optional(),
    consentWording: z.string().optional(),
  }).parse(req.body);

  const contact = await prisma.contact.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!contact) throw new AppError('Contact not found', 404);

  const updateData = channel === 'EMAIL'
    ? { emailOptIn: optIn, emailOptInAt: optIn ? new Date() : undefined, emailOptInSource: source, emailUnsubscribed: !optIn }
    : { whatsappOptIn: optIn, whatsappOptInAt: optIn ? new Date() : undefined, whatsappOptInSource: source, whatsappOptedOut: !optIn };

  await prisma.contact.update({ where: { id: req.params.id }, data: updateData });

  await prisma.contactChannelPermission.upsert({
    where: { contactId_channel: { contactId: req.params.id, channel } },
    create: {
      contactId: req.params.id,
      channel,
      hasPermission: optIn,
      grantedAt: optIn ? new Date() : undefined,
      grantedSource: source,
      consentWording,
      revokedAt: !optIn ? new Date() : undefined,
    },
    update: {
      hasPermission: optIn,
      grantedAt: optIn ? new Date() : undefined,
      grantedSource: source,
      consentWording,
      revokedAt: !optIn ? new Date() : undefined,
    },
  });

  if (!optIn) {
    await prisma.suppressionEntry.create({
      data: {
        contactId: req.params.id,
        email: channel === 'EMAIL' ? contact.email ?? undefined : undefined,
        phone: channel === 'WHATSAPP' ? contact.phone ?? undefined : undefined,
        channel,
        reason: channel === 'EMAIL' ? 'UNSUBSCRIBED' : 'OPT_OUT_WHATSAPP',
        addedById: req.user!.id,
        source: 'contact_opt_out',
      },
    });
  }

  res.json({ success: true, message: `${channel} opt-${optIn ? 'in' : 'out'} recorded` });
});

export default router;
