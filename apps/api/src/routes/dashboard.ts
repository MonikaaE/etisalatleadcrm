import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const [
    totalCompanies,
    totalContacts,
    newLeads,
    qualifiedLeads,
    contactedLeads,
    tasksDueToday,
    overdueFollowUps,
    companiesByIndustry,
    companiesByEmirate,
    companiesByStage,
    recentActivities,
    integrations,
    recentImports,
    emailStats,
    whatsappStats,
  ] = await Promise.all([
    prisma.company.count({ where: { isDeleted: false } }),
    prisma.contact.count({ where: { isDeleted: false } }),
    prisma.company.count({ where: { leadStatus: 'NEW', isDeleted: false } }),
    prisma.company.count({ where: { leadStatus: 'QUALIFIED', isDeleted: false } }),
    prisma.company.count({ where: { leadStatus: 'CONTACTED', isDeleted: false } }),
    prisma.task.count({ where: { status: 'OPEN', dueDate: { gte: todayStart, lt: todayEnd } } }),
    prisma.task.count({ where: { status: 'OPEN', dueDate: { lt: todayStart } } }),
    prisma.company.groupBy({ by: ['industry'], where: { isDeleted: false }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10 }),
    prisma.company.groupBy({ by: ['emirate'], where: { isDeleted: false, emirate: { not: null } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
    prisma.company.groupBy({ by: ['leadStatus'], where: { isDeleted: false }, _count: { id: true } }),
    prisma.activity.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { firstName: true, lastName: true } } } }),
    prisma.integrationConfig.findMany({ select: { key: true, name: true, status: true, lastChecked: true, lastSuccess: true, errorMessage: true } }),
    prisma.importJob.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, originalName: true, status: true, importedRows: true, errorRows: true, completedAt: true } }),
    prisma.campaign.aggregate({ where: { type: 'EMAIL' }, _sum: { sent: true, delivered: true, bounced: true, replied: true, unsubscribed: true } }),
    prisma.campaign.aggregate({ where: { type: 'WHATSAPP' }, _sum: { sent: true, delivered: true, failed: true, replied: true } }),
  ]);

  const openOpportunities = await prisma.company.count({
    where: {
      isDeleted: false,
      leadStatus: { in: ['QUALIFIED', 'CONTACTED', 'ENGAGED', 'MEETING_BOOKED', 'PROPOSAL_SENT'] },
    },
  });

  res.json({
    success: true,
    data: {
      totalCompanies,
      totalContacts,
      newLeads,
      qualifiedLeads,
      contactedLeads,
      openOpportunities,
      tasksDueToday,
      overdueFollowUps,
      companiesByIndustry: companiesByIndustry.map((r) => ({ industry: r.industry, count: r._count.id })),
      companiesByEmirate: companiesByEmirate.map((r) => ({ emirate: r.emirate, count: r._count.id })),
      companiesByStage: companiesByStage.map((r) => ({ stage: r.leadStatus, count: r._count.id })),
      recentActivities: recentActivities.map((a) => ({
        id: a.id,
        type: a.type,
        description: a.description,
        userName: a.user ? `${a.user.firstName} ${a.user.lastName}` : 'System',
        createdAt: a.createdAt,
      })),
      integrationStatus: integrations,
      recentImports,
      emailStats: emailStats._sum,
      whatsappStats: whatsappStats._sum,
    },
  });
});

export default router;
