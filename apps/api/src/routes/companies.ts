import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, canWrite, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { companySchema } from '@kyzen/shared';
import { calculateLeadScore } from '../services/leadScoring';
import { createAuditLog } from '../services/audit';
import { normalizePhone } from '../lib/utils';

const router = Router();
router.use(authenticate);

// GET /api/v1/companies
router.get('/', async (req: AuthRequest, res: Response) => {
  const query = z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().max(100).default(20),
    search: z.string().optional(),
    industry: z.string().optional(),
    emirate: z.string().optional(),
    leadStatus: z.string().optional(),
    priority: z.string().optional(),
    assignedToId: z.string().optional(),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    tag: z.string().optional(),
  }).parse(req.query);

  const { page, limit, search, industry, emirate, leadStatus, priority, assignedToId, sortBy, sortOrder, tag } = query;
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { isDeleted: false };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { tradingName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { domain: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (industry) where.industry = industry;
  if (emirate) where.emirate = emirate;
  if (leadStatus) where.leadStatus = leadStatus;
  if (priority) where.priority = priority;
  if (assignedToId) where.assignedToId = assignedToId;
  if (tag) where.tags = { some: { tag: { name: tag } } };

  const validSortFields = ['createdAt', 'updatedAt', 'name', 'score', 'leadStatus', 'priority', 'industry', 'emirate'];
  const orderBy = validSortFields.includes(sortBy)
    ? { [sortBy]: sortOrder }
    : { createdAt: 'desc' as const };

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        tags: { include: { tag: true } },
        _count: { select: { contacts: true, tasks: true, notes: true } },
      },
    }),
    prisma.company.count({ where }),
  ]);

  res.json({
    success: true,
    data: companies,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

// POST /api/v1/companies/ai-lookup
router.post('/ai-lookup', authenticate, async (req: AuthRequest, res: Response) => {
  const { name } = z.object({ name: z.string().min(2, 'Company name must be at least 2 characters') }).parse(req.body);
  const { aiCompanyLookup } = await import('../services/aiLookup');
  const result = await aiCompanyLookup(name.trim());
  res.json({ success: true, data: result });
});

// POST /api/v1/companies/scrape-website
router.post('/scrape-website', authenticate, async (req: AuthRequest, res: Response) => {
  const { url } = z.object({ url: z.string().min(3, 'Website URL is required') }).parse(req.body);
  const { scrapeWebsiteContacts } = await import('../services/websiteScraper');
  const contacts = await scrapeWebsiteContacts(url.trim());
  res.json({ success: true, data: contacts });
});

// POST /api/v1/companies/bulk-delete
router.post('/bulk-delete', canWrite, async (req: AuthRequest, res: Response) => {
  const { ids } = z.object({ ids: z.array(z.string()).min(1) }).parse(req.body);

  await prisma.company.updateMany({
    where: { id: { in: ids } },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  res.json({ success: true, message: `${ids.length} lead(s) deleted` });
});

// POST /api/v1/companies/add-to-campaign
router.post('/add-to-campaign', canWrite, async (req: AuthRequest, res: Response) => {
  const { campaignId, companyIds } = z.object({
    campaignId: z.string().min(1),
    companyIds: z.array(z.string()).min(1),
  }).parse(req.body);

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new AppError('Campaign not found', 404);

  let added = 0;
  for (const compId of companyIds) {
    const existing = await prisma.campaignAudience.findFirst({
      where: { campaignId, companyId: compId },
    });
    if (!existing) {
      const contact = await prisma.contact.findFirst({
        where: { companyId: compId, isDeleted: false },
      });
      await prisma.campaignAudience.create({
        data: {
          campaignId,
          companyId: compId,
          contactId: contact?.id,
          eligible: true,
        },
      });
      added++;
    }
  }

  const totalAudience = await prisma.campaignAudience.count({ where: { campaignId } });
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { totalRecipients: totalAudience },
  });

  res.json({ success: true, message: `Added ${added} lead(s) to campaign`, totalAudience });
});

// GET /api/v1/companies/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const company = await prisma.company.findFirst({
    where: { id: req.params.id, isDeleted: false },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      contacts: { where: { isDeleted: false }, take: 20 },
      tags: { include: { tag: true } },
      notes: { orderBy: { createdAt: 'desc' }, take: 10, include: { author: { select: { firstName: true, lastName: true } } } },
      tasks: { where: { status: { not: 'COMPLETED' } }, orderBy: { dueDate: 'asc' } },
      activities: { orderBy: { createdAt: 'desc' }, take: 20, include: { user: { select: { firstName: true, lastName: true } } } },
      sourceRecords: { take: 5 },
      _count: { select: { contacts: true, tasks: true, notes: true } },
    },
  });
  if (!company) throw new AppError('Company not found', 404);
  res.json({ success: true, data: company });
});

// POST /api/v1/companies
router.post('/', canWrite, async (req: AuthRequest, res: Response) => {
  const contactSchema = z.object({
    firstName: z.string().min(1, 'Contact first name is required'),
    lastName: z.string().min(1, 'Contact last name is required'),
    title: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid contact email').optional().or(z.literal('')),
    department: z.string().optional(),
  });

  const bodySchema = z.object({
    contacts: z.array(contactSchema).default([]),
  });

  const { contacts } = bodySchema.parse(req.body);
  const data = companySchema.parse(req.body);
  const phoneNormalized = data.phone ? normalizePhone(data.phone) : undefined;

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        ...data,
        phoneNormalized,
        email: data.email || undefined,
        website: data.website || undefined,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
        createdById: req.user!.id,
      },
    });

    for (const c of contacts) {
      const phoneN = c.phone ? normalizePhone(c.phone) : undefined;
      await tx.contact.create({
        data: {
          companyId: company.id,
          firstName: c.firstName,
          lastName: c.lastName,
          fullName: `${c.firstName} ${c.lastName}`.trim(),
          title: c.title || undefined,
          department: c.department || undefined,
          phone: c.phone || undefined,
          phoneNormalized: phoneN,
          email: c.email || undefined,
          createdById: req.user!.id,
        },
      });
    }

    return company;
  });

  // Calculate initial score
  const score = calculateLeadScore(result);
  await prisma.company.update({ where: { id: result.id }, data: { score: score.total, scoreReason: score.components as unknown as object } });

  await createAuditLog({ action: 'CREATE', entityType: 'Company', entityId: result.id, userId: req.user!.id, after: result });

  res.status(201).json({ success: true, data: { ...result, score: score.total } });
});

// PUT /api/v1/companies/:id
router.put('/:id', canWrite, async (req: AuthRequest, res: Response) => {
  const existing = await prisma.company.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!existing) throw new AppError('Company not found', 404);

  const data = companySchema.partial().parse(req.body);
  const phoneNormalized = data.phone ? normalizePhone(data.phone) : undefined;

  const company = await prisma.company.update({
    where: { id: req.params.id },
    data: {
      ...data,
      phoneNormalized,
      email: data.email || undefined,
      website: data.website || undefined,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
    },
  });

  const score = calculateLeadScore(company);
  const updated = await prisma.company.update({ where: { id: company.id }, data: { score: score.total, scoreReason: score.components as unknown as object } });

  await createAuditLog({ action: 'UPDATE', entityType: 'Company', entityId: company.id, userId: req.user!.id, before: existing, after: updated });

  res.json({ success: true, data: updated });
});

// PATCH /api/v1/companies/:id/status
router.patch('/:id/status', canWrite, async (req: AuthRequest, res: Response) => {
  const { leadStatus } = z.object({ leadStatus: z.string() }).parse(req.body);
  const existing = await prisma.company.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!existing) throw new AppError('Company not found', 404);

  const company = await prisma.company.update({ where: { id: req.params.id }, data: { leadStatus: leadStatus as never } });

  await prisma.activity.create({
    data: {
      type: 'STAGE_CHANGED',
      description: `Lead stage changed from ${existing.leadStatus} to ${leadStatus}`,
      companyId: company.id,
      userId: req.user!.id,
      metadata: { from: existing.leadStatus, to: leadStatus },
    },
  });

  res.json({ success: true, data: company });
});

// DELETE /api/v1/companies/:id (soft delete)
router.delete('/:id', canWrite, async (req: AuthRequest, res: Response) => {
  const existing = await prisma.company.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!existing) throw new AppError('Company not found', 404);

  await prisma.company.update({ where: { id: req.params.id }, data: { isDeleted: true, deletedAt: new Date() } });
  await createAuditLog({ action: 'DELETE', entityType: 'Company', entityId: req.params.id, userId: req.user!.id });

  res.json({ success: true, message: 'Company deleted' });
});

// POST /api/v1/companies/:id/notes
router.post('/:id/notes', canWrite, async (req: AuthRequest, res: Response) => {
  const { content } = z.object({ content: z.string().min(1) }).parse(req.body);
  const company = await prisma.company.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!company) throw new AppError('Company not found', 404);

  const note = await prisma.note.create({ data: { content, companyId: req.params.id, authorId: req.user!.id } });
  await prisma.activity.create({ data: { type: 'NOTE_ADDED', description: 'Note added', companyId: req.params.id, userId: req.user!.id } });

  res.status(201).json({ success: true, data: note });
});

// GET /api/v1/companies/:id/score
router.get('/:id/score', async (req: AuthRequest, res: Response) => {
  const company = await prisma.company.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!company) throw new AppError('Company not found', 404);
  const score = calculateLeadScore(company);
  res.json({ success: true, data: score });
});

export default router;

