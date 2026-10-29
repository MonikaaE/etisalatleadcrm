import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, canWrite, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const sources = await prisma.leadSource.findMany({ orderBy: { name: 'asc' } });
  res.json({ success: true, data: sources });
});

router.get('/:key', async (req: AuthRequest, res: Response) => {
  const source = await prisma.leadSource.findUnique({ where: { key: req.params.key } });
  if (!source) throw new AppError('Source not found', 404);
  res.json({ success: true, data: source });
});

// POST /api/v1/sources/:key/discover — starts a discovery job
router.post('/:key/discover', canWrite, async (req: AuthRequest, res: Response) => {
  const source = await prisma.leadSource.findUnique({ where: { key: req.params.key } });
  if (!source) throw new AppError('Source not found', 404);
  if (source.status === 'UNCONFIGURED') throw new AppError('Source is not configured. Please add the required API key in Settings.', 400, 'SOURCE_UNCONFIGURED');
  if (source.status !== 'ACTIVE') throw new AppError(`Source is currently ${source.status}`, 400);

  const filters = z.object({
    industry: z.string().optional(),
    keyword: z.string().optional(),
    emirate: z.string().optional(),
    location: z.string().optional(),
    limit: z.coerce.number().max(500).default(100),
  }).parse(req.body);

  const job = await prisma.discoveryJob.create({
    data: { sourceId: source.id, filters, createdById: req.user!.id },
  });

  // Queue the job
  const { discoveryQueue } = await import('../queues/discovery.queue');
  const bullJob = await discoveryQueue.add('run-discovery', { jobId: job.id, sourceKey: source.key, filters });

  await prisma.discoveryJob.update({ where: { id: job.id }, data: { jobQueueId: bullJob.id?.toString() } });

  res.status(202).json({ success: true, data: { jobId: job.id, queueJobId: bullJob.id } });
});

// POST /api/v1/sources/realtime/scrape — live real-time scraping from 2gis, yellowpages, linkedin, ded
router.post('/realtime/scrape', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    source: z.enum(['2gis', 'yellowpages', 'linkedin', 'ded', 'all']).default('all'),
    query: z.string().optional(),
    industry: z.string().optional(),
    emirate: z.string().default('Dubai'),
    limit: z.coerce.number().min(1).max(50).default(15),
  });

  const parsed = schema.parse(req.body);
  const { scrape2GIS, scrapeYellowPages, scrapeLinkedIn, scrapeDED, scrapeAllSources } = await import('../services/leadScraper');

  let leads: any[] = [];
  if (parsed.source === '2gis') {
    leads = await scrape2GIS(parsed);
  } else if (parsed.source === 'yellowpages') {
    leads = await scrapeYellowPages(parsed);
  } else if (parsed.source === 'linkedin') {
    leads = await scrapeLinkedIn(parsed);
  } else if (parsed.source === 'ded') {
    leads = await scrapeDED(parsed);
  } else {
    leads = await scrapeAllSources(parsed);
  }

  res.json({
    success: true,
    data: {
      count: leads.length,
      source: parsed.source,
      emirate: parsed.emirate,
      leads,
    },
  });
});

// POST /api/v1/sources/realtime/import-lead — save a scraped lead directly to CRM
router.post('/realtime/import-lead', canWrite, async (req: AuthRequest, res: Response) => {
  const lead = req.body;
  if (!lead?.name) throw new AppError('Lead name is required', 400);

  // Use only verified contacts provided with the lead
  const contactsToImport = Array.isArray(lead.keyContacts) ? lead.keyContacts.filter((c: any) => c?.name?.trim()) : [];

  const domain = lead.domain || (lead.website ? lead.website.replace(/^https?:\/\//, '').split('/')[0] : undefined);

  // Check if company exists or upsert
  let company = domain
    ? await prisma.company.findFirst({
        where: { domain, isDeleted: false },
        include: { contacts: true },
      })
    : await prisma.company.findFirst({
        where: { name: { equals: lead.name, mode: 'insensitive' }, isDeleted: false },
        include: { contacts: true },
      });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: lead.name,
        domain,
        website: lead.website,
        phone: lead.phone,
        phoneNormalized: lead.phoneNormalized,
        email: lead.email,
        address: lead.address,
        emirate: (lead.emirate || 'DUBAI').toUpperCase() as any,
        industry: (lead.industry || 'OTHER') as any,
        employeeSizeBand: lead.employeeSizeBand || '11-50',
        potentialSimQty: lead.potentialSimQty || 15,
        score: lead.score || 85,
        leadStatus: 'NEW',
        assignedToId: req.user!.id,
        createdById: req.user!.id,
        sourceUrl: lead.sourceUrl,
      },
      include: { contacts: true },
    });
  }

  // Create verified key contacts if present
  for (const c of contactsToImport) {
    if (c.name) {
      const parts = c.name.trim().split(' ');
      const firstName = parts[0] || 'Executive';
      const lastName = parts.slice(1).join(' ') || 'Contact';

      const existingContact = await prisma.contact.findFirst({
        where: { companyId: company.id, fullName: c.name, isDeleted: false },
      });

      if (!existingContact) {
        await prisma.contact.create({
          data: {
            company: { connect: { id: company.id } },
            firstName,
            lastName,
            fullName: c.name,
            title: c.title || 'Managing Director',
            department: c.roleGroup || 'MANAGEMENT',
            phone: c.phone || lead.phone,
            email: c.email || lead.email,
            emailOptIn: true,
            whatsappOptIn: true,
          },
        }).catch(() => {});
      }
    }
  }

  const refreshedCompany = await prisma.company.findUnique({
    where: { id: company.id },
    include: { contacts: { where: { isDeleted: false } } },
  });

  res.status(201).json({ success: true, data: refreshedCompany });
});

// POST /api/v1/sources/realtime/import-leads — bulk save multiple scraped leads
router.post('/realtime/import-leads', canWrite, async (req: AuthRequest, res: Response) => {
  const { leads } = z.object({ leads: z.array(z.any()).min(1) }).parse(req.body);

  const imported: any[] = [];
  for (const lead of leads) {
    if (!lead?.name) continue;

    const contactsToImport = Array.isArray(lead.keyContacts) ? lead.keyContacts.filter((c: any) => c?.name?.trim()) : [];

    const domain = lead.domain || (lead.website ? lead.website.replace(/^https?:\/\//, '').split('/')[0] : undefined);
    let company = domain
      ? await prisma.company.findFirst({ where: { domain, isDeleted: false } })
      : await prisma.company.findFirst({ where: { name: { equals: lead.name, mode: 'insensitive' }, isDeleted: false } });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: lead.name,
          domain,
          website: lead.website,
          phone: lead.phone,
          phoneNormalized: lead.phoneNormalized,
          email: lead.email,
          address: lead.address,
          emirate: (lead.emirate || 'DUBAI').toUpperCase() as any,
          industry: (lead.industry || 'OTHER') as any,
          employeeSizeBand: lead.employeeSizeBand || '51-200',
          potentialSimQty: lead.potentialSimQty || 25,
          score: lead.score || 85,
          leadStatus: 'NEW',
          assignedToId: req.user!.id,
          createdById: req.user!.id,
          sourceUrl: lead.sourceUrl,
        },
      });
    }

    // Attach contacts
    for (const c of lead.keyContacts) {
      if (c?.name) {
        const parts = c.name.trim().split(' ');
        await prisma.contact.create({
          data: {
            company: { connect: { id: company.id } },
            firstName: parts[0] || 'Executive',
            lastName: parts.slice(1).join(' ') || 'Contact',
            fullName: c.name,
            title: c.title || 'Managing Director',
            department: c.roleGroup || 'MANAGEMENT',
            phone: c.phone || lead.phone,
            email: c.email || lead.email,
            emailOptIn: true,
            whatsappOptIn: true,
          },
        }).catch(() => {});
      }
    }

    imported.push(company);
  }

  res.status(201).json({ success: true, count: imported.length, data: imported });
});

// GET /api/v1/sources/jobs
router.get('/jobs/list', async (_req: AuthRequest, res: Response) => {
  const jobs = await prisma.discoveryJob.findMany({ orderBy: { createdAt: 'desc' }, take: 50, include: { source: { select: { name: true } } } });
  res.json({ success: true, data: jobs });
});

export default router;

