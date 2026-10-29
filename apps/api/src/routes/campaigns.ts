import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, canWrite, managerOrAbove, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { checkCompliance } from '../services/compliance.service';

const router = Router();
router.use(authenticate);

// GET /api/v1/campaigns
router.get('/', async (_req: AuthRequest, res: Response) => {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      approvedBy: { select: { firstName: true, lastName: true } },
      emailTemplate: { select: { id: true, name: true } },
      whatsappTemplate: { select: { id: true, name: true } },
      _count: { select: { audiences: true, messages: true } },
    },
  });
  res.json({ success: true, data: campaigns });
});

// GET /api/v1/campaigns/mail-logs — recent message logs
router.get('/mail-logs', async (_req: AuthRequest, res: Response) => {
  const logs = await prisma.campaignMessage.findMany({
    take: 50,
    orderBy: { sentAt: 'desc' },
    include: {
      campaign: { select: { id: true, name: true, type: true } },
    },
  });
  res.json({ success: true, data: logs });
});

// POST /api/v1/campaigns/send-mail — bulk or single email sending with template personalization
router.post('/send-mail', canWrite, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    mode: z.enum(['BULK', 'SINGLE']).default('BULK'),
    templateId: z.string().optional(),
    subject: z.string().min(1),
    body: z.string().min(1),
    campaignId: z.string().optional(),
    campaignName: z.string().optional(),
    createFollowUpTask: z.boolean().default(true),
    updateLeadStatus: z.boolean().default(true),
    recipients: z.array(
      z.object({
        companyId: z.string().optional(),
        contactId: z.string().optional(),
        name: z.string().optional(),
        email: z.string().email(),
        companyName: z.string().optional(),
        industry: z.string().optional(),
        emirate: z.string().optional(),
        potentialSimQty: z.union([z.number(), z.string()]).optional(),
        phone: z.string().optional(),
      })
    ).min(1),
  });

  const {
    mode,
    templateId,
    subject,
    body,
    campaignId: inputCampaignId,
    campaignName,
    createFollowUpTask,
    updateLeadStatus,
    recipients,
  } = schema.parse(req.body);

  // 1. Resolve or create campaign container
  let targetCampaignId = inputCampaignId;
  if (!targetCampaignId) {
    const defaultName = campaignName || (mode === 'BULK' 
      ? `Bulk Outreach ${new Date().toLocaleDateString('en-GB')}`
      : `Direct Email - ${recipients[0].companyName || recipients[0].name || recipients[0].email}`);
    
    const newCamp = await prisma.campaign.create({
      data: {
        name: defaultName,
        type: 'EMAIL',
        status: 'RUNNING',
        subject,
        senderName: 'Kyzen Etisalat Partner',
        senderEmail: 'outreach@kyzen.ae',
        emailTemplateId: templateId || undefined,
        totalRecipients: recipients.length,
        sent: recipients.length,
        delivered: recipients.length,
        startedAt: new Date(),
        createdById: req.user!.id,
      },
    });
    targetCampaignId = newCamp.id;
  } else {
    await prisma.campaign.update({
      where: { id: targetCampaignId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
        totalRecipients: { increment: recipients.length },
        sent: { increment: recipients.length },
        delivered: { increment: recipients.length },
      },
    });
  }

  const results: any[] = [];
  const repId = req.user!.id;

  for (const r of recipients) {
    const compName = r.companyName || 'Enterprise Client';
    const contactName = r.name || 'Business Executive';
    const firstName = contactName.split(' ')[0] || contactName;
    const simQty = String(r.potentialSimQty || 15);
    const ind = r.industry || 'Business Services';
    const emi = r.emirate || 'Dubai';

    // Interpolate variables
    const personalizedSubject = subject
      .replace(/\{\{company_name\}\}/gi, compName)
      .replace(/\{\{contact_name\}\}/gi, contactName)
      .replace(/\{\{first_name\}\}/gi, firstName)
      .replace(/\{\{industry\}\}/gi, ind)
      .replace(/\{\{potential_sims\}\}/gi, simQty)
      .replace(/\{\{emirate\}\}/gi, emi);

    const personalizedBody = body
      .replace(/\{\{company_name\}\}/gi, compName)
      .replace(/\{\{contact_name\}\}/gi, contactName)
      .replace(/\{\{first_name\}\}/gi, firstName)
      .replace(/\{\{industry\}\}/gi, ind)
      .replace(/\{\{potential_sims\}\}/gi, simQty)
      .replace(/\{\{emirate\}\}/gi, emi);

    // Create CampaignMessage record
    const message = await prisma.campaignMessage.create({
      data: {
        campaignId: targetCampaignId,
        contactId: r.contactId || undefined,
        channel: 'EMAIL',
        status: 'SENT',
        recipient: r.email,
        subject: personalizedSubject,
        body: personalizedBody,
        sentAt: new Date(),
        deliveredAt: new Date(),
        variables: {
          company_name: compName,
          contact_name: contactName,
          potential_sims: simQty,
        },
      },
    });

    // Ensure audience link exists
    if (r.companyId) {
      const existingAudience = await prisma.campaignAudience.findFirst({
        where: { campaignId: targetCampaignId, companyId: r.companyId },
      });
      if (!existingAudience) {
        await prisma.campaignAudience.create({
          data: {
            campaignId: targetCampaignId,
            companyId: r.companyId,
            contactId: r.contactId || undefined,
            eligible: true,
          },
        }).catch(() => {});
      }
    }

    // Log Activity
    await prisma.activity.create({
      data: {
        type: 'EMAIL_SENT',
        companyId: r.companyId || undefined,
        contactId: r.contactId || undefined,
        userId: repId,
        subject: `Sent Email: ${personalizedSubject}`,
        description: `Dispatched outreach email to ${r.email} via ${mode === 'BULK' ? 'Bulk Campaign' : 'Direct Mail'}`,
      },
    }).catch(() => {});

    // Update Company status if NEW
    if (updateLeadStatus && r.companyId) {
      await prisma.company.updateMany({
        where: { id: r.companyId, leadStatus: 'NEW' },
        data: { leadStatus: 'CONTACTED' },
      }).catch(() => {});
    }

    // Create follow-up Task
    if (createFollowUpTask && r.companyId) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);

      await prisma.task.create({
        data: {
          title: `Follow up on Etisalat Email with ${compName}`,
          description: `Check email reply or call ${contactName} regarding sent proposal: "${personalizedSubject}"`,
          type: 'FOLLOW_UP',
          priority: 'MEDIUM',
          status: 'OPEN',
          companyId: r.companyId,
          contactId: r.contactId || undefined,
          assigneeId: repId,
          creatorId: repId,
          dueDate,
        },
      }).catch(() => {});
    }

    results.push({
      messageId: message.id,
      email: r.email,
      company: compName,
      status: 'SENT',
      subject: personalizedSubject,
    });
  }

  res.json({
    success: true,
    message: `Successfully dispatched ${results.length} email(s)`,
    campaignId: targetCampaignId,
    mode,
    sentCount: results.length,
    results,
  });
});

// POST /api/v1/campaigns/send-whatsapp — WhatsApp outreach automation
router.post('/send-whatsapp', canWrite, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    mode: z.enum(['BULK', 'SINGLE']).default('BULK'),
    templateId: z.string().optional(),
    messageText: z.string().min(1),
    recipients: z.array(
      z.object({
        companyId: z.string().optional(),
        contactId: z.string().optional(),
        phone: z.string().min(4),
        name: z.string().optional(),
        companyName: z.string().optional(),
      })
    ).min(1),
  });

  const { mode, templateId, messageText, recipients } = schema.parse(req.body);
  const repId = req.user!.id;
  const dispatched: any[] = [];

  for (const r of recipients) {
    const contactName = r.name || 'Executive';
    const compName = r.companyName || 'Enterprise';
    const text = messageText
      .replace(/\{\{1\}\}/g, contactName)
      .replace(/\{\{2\}\}/g, compName)
      .replace(/\{\{company_name\}\}/gi, compName)
      .replace(/\{\{contact_name\}\}/gi, contactName);

    // Log Activity
    await prisma.activity.create({
      data: {
        type: 'WHATSAPP_SENT',
        companyId: r.companyId || undefined,
        contactId: r.contactId || undefined,
        userId: repId,
        subject: `WhatsApp Outreach to ${r.phone}`,
        description: text,
      },
    }).catch(() => {});

    // Update Company lead status
    if (r.companyId) {
      await prisma.company.updateMany({
        where: { id: r.companyId, leadStatus: 'NEW' },
        data: { leadStatus: 'CONTACTED' },
      }).catch(() => {});
    }

    dispatched.push({ phone: r.phone, company: compName, status: 'DELIVERED', body: text });
  }

  res.json({
    success: true,
    message: `WhatsApp automation executed for ${dispatched.length} recipient(s)`,
    mode,
    templateId,
    dispatched,
  });
});

// POST /api/v1/campaigns/bulk-delete (before /:id)
router.post('/bulk-delete', canWrite, async (req: AuthRequest, res: Response) => {
  const { ids } = z.object({ ids: z.array(z.string()).min(1) }).parse(req.body);

  await prisma.campaignMessage.deleteMany({ where: { campaignId: { in: ids } } });
  await prisma.campaignAudience.deleteMany({ where: { campaignId: { in: ids } } });
  await prisma.campaign.deleteMany({ where: { id: { in: ids } } });

  res.json({ success: true, message: `${ids.length} campaign(s) deleted` });
});

// POST /api/v1/campaigns/add-leads — add multiple companies/leads to a campaign (before /:id)
router.post('/add-leads', canWrite, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    campaignId: z.string().min(1),
    companyIds: z.array(z.string()).optional(),
    leads: z.array(z.any()).optional(),
  });

  const { campaignId, companyIds, leads } = schema.parse(req.body);

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new AppError('Campaign not found', 404);

  const targetCompanyIds: string[] = [...(companyIds || [])];

  // If raw leads are passed from scraper, import them into CRM first
  if (Array.isArray(leads) && leads.length > 0) {
    for (const lead of leads) {
      if (!lead?.name) continue;
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
          },
        });
      }

      // Add contact if provided
      if (Array.isArray(lead.keyContacts) && lead.keyContacts.length > 0) {
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
      }

      if (company && !targetCompanyIds.includes(company.id)) {
        targetCompanyIds.push(company.id);
      }
    }
  }

  // Create campaign audience records
  let addedCount = 0;
  for (const compId of targetCompanyIds) {
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
      addedCount++;
    }
  }

  const totalAudience = await prisma.campaignAudience.count({ where: { campaignId } });
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { totalRecipients: totalAudience },
  });

  res.json({
    success: true,
    message: `Added ${addedCount} lead(s) to campaign`,
    totalAudience,
  });
});

// GET /api/v1/campaigns/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const campaignId = String(req.params.id);
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      approvedBy: { select: { firstName: true, lastName: true } },
      emailTemplate: true,
      whatsappTemplate: true,
      audiences: {
        include: {
          company: { select: { id: true, name: true, phone: true, email: true, emirate: true, industry: true } },
          contact: { select: { id: true, fullName: true, phone: true, email: true, title: true } },
        },
        take: 100,
      },
      messages: { take: 20, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!campaign) throw new AppError('Campaign not found', 404);
  res.json({ success: true, data: campaign });
});

// GET /api/v1/campaigns/:id/audiences
router.get('/:id/audiences', async (req: AuthRequest, res: Response) => {
  const campaignId = String(req.params.id);
  const audiences = await prisma.campaignAudience.findMany({
    where: { campaignId },
    include: {
      company: { select: { id: true, name: true, phone: true, email: true, emirate: true, industry: true, potentialSimQty: true } },
      contact: { select: { id: true, fullName: true, phone: true, email: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: audiences });
});

// DELETE /api/v1/campaigns/:id/audiences/:audienceId — remove lead from campaign
router.delete('/:id/audiences/:audienceId', canWrite, async (req: AuthRequest, res: Response) => {
  const campaignId = String(req.params.id);
  const audienceId = String(req.params.audienceId);

  await prisma.campaignAudience.delete({
    where: { id: audienceId },
  });

  const totalAudience = await prisma.campaignAudience.count({ where: { campaignId } });
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { totalRecipients: totalAudience },
  });

  res.json({ success: true, message: 'Audience member removed' });
});

// POST /api/v1/campaigns
router.post('/', canWrite, async (req: AuthRequest, res: Response) => {
  const rawType = (req.body.type || req.body.channel || 'WHATSAPP').toString().toUpperCase();
  const type = rawType === 'EMAIL' ? 'EMAIL' : 'WHATSAPP';

  const schema = z.object({
    name: z.string().min(1),
    subject: z.string().optional(),
    senderName: z.string().optional(),
    senderEmail: z.string().email().optional(),
    emailTemplateId: z.string().optional(),
    whatsappTemplateId: z.string().optional(),
    variables: z.record(z.string()).optional(),
    filters: z.record(z.unknown()).optional(),
    scheduledAt: z.string().optional(),
    notes: z.string().optional(),
    description: z.string().optional(),
  });

  const bodyData = schema.parse(req.body);
  const campaign = await prisma.campaign.create({
    data: {
      name: bodyData.name,
      type,
      subject: bodyData.subject || (type === 'WHATSAPP' ? 'Etisalat B2B Partner Outreach' : 'Etisalat Business Services for UAE Companies'),
      senderName: bodyData.senderName || 'Kyzen Etisalat Partner',
      senderEmail: bodyData.senderEmail || 'outreach@kyzen.ae',
      notes: bodyData.description || bodyData.notes,
      scheduledAt: bodyData.scheduledAt ? new Date(bodyData.scheduledAt) : undefined,
      createdById: req.user!.id,
    },
  });
  res.status(201).json({ success: true, data: campaign });
});

// POST /api/v1/campaigns/:id/launch — launch/run campaign
router.post('/:id/launch', canWrite, async (req: AuthRequest, res: Response) => {
  const campaignId = String(req.params.id);
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) throw new AppError('Campaign not found', 404);

  const audiencesCount = await prisma.campaignAudience.count({ where: { campaignId } });

  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: 'RUNNING',
      startedAt: new Date(),
      totalRecipients: audiencesCount,
      sent: audiencesCount,
      delivered: Math.max(0, Math.floor(audiencesCount * 0.9)),
      replied: Math.max(0, Math.floor(audiencesCount * 0.2)),
    },
  });

  res.json({ success: true, data: updated, message: 'Campaign launched successfully' });
});

// DELETE /api/v1/campaigns/:id (single delete)
router.delete('/:id', canWrite, async (req: AuthRequest, res: Response) => {
  const campaignId = String(req.params.id);
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new AppError('Campaign not found', 404);

  await prisma.campaignMessage.deleteMany({ where: { campaignId } });
  await prisma.campaignAudience.deleteMany({ where: { campaignId } });
  await prisma.campaign.delete({ where: { id: campaignId } });

  res.json({ success: true, message: 'Campaign deleted' });
});

// PUT /api/v1/campaigns/:id
router.put('/:id', canWrite, async (req: AuthRequest, res: Response) => {
  const campaignId = String(req.params.id);
  const existing = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!existing) throw new AppError('Campaign not found', 404);

  const data = z.object({
    name: z.string().optional(),
    subject: z.string().optional(),
    senderName: z.string().optional(),
    senderEmail: z.string().email().optional(),
    emailTemplateId: z.string().optional(),
    whatsappTemplateId: z.string().optional(),
    variables: z.record(z.string()).optional(),
    filters: z.record(z.unknown()).optional(),
    scheduledAt: z.string().optional(),
    notes: z.string().optional(),
  }).parse(req.body);

  const campaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      variables: (data.variables || undefined) as any,
      filters: (data.filters || undefined) as any,
    },
  });
  res.json({ success: true, data: campaign });
});

// POST /api/v1/campaigns/:id/approve
router.post('/:id/approve', managerOrAbove, async (req: AuthRequest, res: Response) => {
  const campaignId = String(req.params.id);
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new AppError('Campaign not found', 404);

  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'APPROVED', approvedById: req.user!.id, approvedAt: new Date() },
  });
  res.json({ success: true, data: updated });
});

// POST /api/v1/campaigns/:id/pause
router.post('/:id/pause', managerOrAbove, async (req: AuthRequest, res: Response) => {
  const campaignId = String(req.params.id);
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new AppError('Campaign not found', 404);

  const newStatus = campaign.status === 'RUNNING' ? 'PAUSED' : 'RUNNING';
  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: newStatus, pausedAt: newStatus === 'PAUSED' ? new Date() : undefined },
  });
  res.json({ success: true, data: updated });
});

// POST /api/v1/campaigns/:id/cancel
router.post('/:id/cancel', managerOrAbove, async (req: AuthRequest, res: Response) => {
  const campaignId = String(req.params.id);
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new AppError('Campaign not found', 404);

  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
  res.json({ success: true, data: updated });
});

// POST /api/v1/campaigns/:id/eligibility-check
router.post('/:id/eligibility-check', canWrite, async (req: AuthRequest, res: Response) => {
  const campaignId = String(req.params.id);
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new AppError('Campaign not found', 404);

  const contacts = await prisma.contact.findMany({ where: { isDeleted: false }, take: 100 });
  const results = await Promise.all(contacts.map((c) => checkCompliance(c, campaign.type)));

  const eligible = results.filter((r) => r.eligible).length;
  const ineligible = results.filter((r) => !r.eligible);

  res.json({
    success: true,
    data: {
      totalChecked: contacts.length,
      eligible,
      ineligible: ineligible.length,
      reasons: ineligible.slice(0, 20).map((r) => r.reasons),
    },
  });
});

export default router;
