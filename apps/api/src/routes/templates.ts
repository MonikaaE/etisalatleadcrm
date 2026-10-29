import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, canWrite, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// Unified GET / - returns all email and whatsapp templates
router.get('/', async (_req, res: Response) => {
  const [emailTemplates, whatsAppTemplates] = await Promise.all([
    prisma.emailTemplate.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }),
    prisma.whatsAppTemplate.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  const unified = [
    ...emailTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      channel: 'EMAIL',
      category: 'MARKETING',
      subject: t.subject,
      bodyText: t.textBody || t.htmlBody.replace(/<[^>]+>/g, ''),
      htmlBody: t.htmlBody,
      variables: t.variables || ['company_name', 'contact_name', 'industry', 'potential_sims', 'emirate'],
      isActive: t.isActive,
      createdAt: t.createdAt,
    })),
    ...whatsAppTemplates.map((w) => {
      let bodyText = w.previewText || '';
      if (!bodyText && Array.isArray(w.components)) {
        const bodyComp = (w.components as any[]).find((c) => c.type === 'BODY');
        if (bodyComp?.text) bodyText = bodyComp.text;
      }
      return {
        id: w.id,
        name: w.name,
        channel: 'WHATSAPP',
        category: w.category || 'MARKETING',
        subject: '',
        bodyText: bodyText || w.name,
        htmlBody: '',
        variables: w.variables || ['1', '2'],
        isActive: true,
        createdAt: w.createdAt,
      };
    }),
  ];

  res.json({ success: true, data: unified });
});

// Unified POST / - handles both channels
router.post('/', canWrite, async (req: AuthRequest, res: Response) => {
  const channel = (req.body.channel || 'EMAIL').toString().toUpperCase();
  if (channel === 'WHATSAPP') {
    const data = z.object({
      name: z.string().min(1),
      category: z.string().default('MARKETING'),
      bodyText: z.string().default(''),
      variables: z.array(z.string()).optional(),
    }).parse(req.body);

    const template = await prisma.whatsAppTemplate.create({
      data: {
        name: data.name,
        category: data.category,
        language: 'en',
        previewText: data.bodyText,
        components: [{ type: 'BODY', text: data.bodyText }] as any,
        variables: (data.variables || ['1', '2']) as any,
        createdById: req.user!.id,
      },
    });
    return res.status(201).json({ success: true, data: template });
  } else {
    const data = z.object({
      name: z.string().min(1),
      subject: z.string().default('Etisalat Business Services'),
      bodyText: z.string().optional(),
      htmlBody: z.string().optional(),
      variables: z.array(z.string()).optional(),
    }).parse(req.body);

    const htmlBody = data.htmlBody || `<p>${data.bodyText?.replace(/\n/g, '<br/>') || 'Hello {{contact_name}},'}</p>`;
    const template = await prisma.emailTemplate.create({
      data: {
        name: data.name,
        subject: data.subject,
        htmlBody,
        textBody: data.bodyText || data.subject,
        variables: (data.variables || ['company_name', 'contact_name', 'industry', 'potential_sims']) as any,
        createdById: req.user!.id,
      },
    });
    return res.status(201).json({ success: true, data: template });
  }
});

// Email Templates
router.get('/email', async (_req, res: Response) => {
  const templates = await prisma.emailTemplate.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: templates });
});

router.get('/email/:id', async (req, res: Response) => {
  const t = await prisma.emailTemplate.findUnique({ where: { id: String(req.params.id) } });
  if (!t) throw new AppError('Template not found', 404);
  res.json({ success: true, data: t });
});

router.post('/email', canWrite, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    name: z.string().min(1),
    subject: z.string().min(1),
    htmlBody: z.string().min(1),
    textBody: z.string().optional(),
    variables: z.array(z.string()).optional(),
  });
  const data = schema.parse(req.body);

  const template = await prisma.emailTemplate.create({
    data: {
      name: data.name,
      subject: data.subject,
      htmlBody: data.htmlBody,
      textBody: data.textBody,
      variables: data.variables as any,
      createdById: req.user!.id,
    },
  });
  res.status(201).json({ success: true, data: template });
});

router.put('/email/:id', canWrite, async (req: AuthRequest, res: Response) => {
  const data = z.object({
    name: z.string().optional(),
    subject: z.string().optional(),
    htmlBody: z.string().optional(),
    textBody: z.string().optional(),
    variables: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }).parse(req.body);

  const template = await prisma.emailTemplate.update({
    where: { id: String(req.params.id) },
    data: {
      ...data,
      variables: data.variables ? (data.variables as any) : undefined,
    },
  });
  res.json({ success: true, data: template });
});

router.delete('/email/:id', canWrite, async (_req, res: Response) => {
  await prisma.emailTemplate.update({ where: { id: String(_req.params.id) }, data: { isActive: false } });
  res.json({ success: true, message: 'Template deactivated' });
});

// WhatsApp Templates
router.get('/whatsapp', async (_req, res: Response) => {
  const templates = await prisma.whatsAppTemplate.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: templates });
});

router.get('/whatsapp/:id', async (req, res: Response) => {
  const t = await prisma.whatsAppTemplate.findUnique({ where: { id: String(req.params.id) } });
  if (!t) throw new AppError('Template not found', 404);
  res.json({ success: true, data: t });
});

router.post('/whatsapp', canWrite, async (req: AuthRequest, res: Response) => {
  const data = z.object({
    name: z.string().min(1),
    language: z.string().default('en'),
    category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
    components: z.array(z.unknown()),
    variables: z.array(z.string()).optional(),
    previewText: z.string().optional(),
  }).parse(req.body);

  const template = await prisma.whatsAppTemplate.create({
    data: {
      name: data.name,
      language: data.language,
      category: data.category,
      components: data.components as object[],
      variables: data.variables as any,
      previewText: data.previewText,
      createdById: req.user!.id,
    },
  });
  res.status(201).json({ success: true, data: template });
});

export default router;
