import { prisma } from '../lib/prisma';

interface AuditLogInput {
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  ipAddress?: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
  companyId?: string;
  contactId?: string;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        userId: input.userId,
        ipAddress: input.ipAddress,
        before: input.before ? JSON.parse(JSON.stringify(input.before)) : undefined,
        after: input.after ? JSON.parse(JSON.stringify(input.after)) : undefined,
        metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
        companyId: input.companyId,
        contactId: input.contactId,
      },
    });
  } catch (err) {
    // Audit logging should not fail the main operation
    console.error('Failed to create audit log:', err);
  }
}
