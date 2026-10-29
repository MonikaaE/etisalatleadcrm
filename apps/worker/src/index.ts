import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import pino from 'pino';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Load env
try { require('dotenv').config({ path: '../../.env' }); } catch {}

const logger = pino({ level: process.env.LOG_LEVEL || 'info', transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined });
const prisma = new PrismaClient();

function getRedis() {
  return new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null, enableReadyCheck: false });
}

// ─── Import Worker ────────────────────────────────────────────
const importWorker = new Worker('import-jobs', async (job) => {
  const { jobId } = job.data;
  logger.info({ jobId }, 'Processing import job');

  const importJob = await prisma.importJob.findUnique({ where: { id: jobId } });
  if (!importJob || !importJob.filePath) {
    throw new Error(`Import job ${jobId} not found or no file path`);
  }

  const ext = path.extname(importJob.originalName).toLowerCase();
  const buffer = fs.readFileSync(importJob.filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer', raw: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });

  const mapping = (importJob.columnMapping || {}) as Record<string, string>;
  const options = (importJob.options || { duplicateAction: 'skip', skipInvalid: true }) as { duplicateAction: string; skipInvalid: boolean };

  let imported = 0, skipped = 0, errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowErrors: string[] = [];

    // Apply column mapping
    const mapped: Record<string, unknown> = {};
    for (const [csvCol, dbField] of Object.entries(mapping)) {
      if (row[csvCol] !== undefined && row[csvCol] !== '') mapped[dbField] = row[csvCol];
    }

    // Basic validation
    if (importJob.recordType === 'COMPANY') {
      if (!mapped.name || String(mapped.name).trim() === '') rowErrors.push('Company name is required');
      if (mapped.email && !String(mapped.email).match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) rowErrors.push('Invalid email');

      if (rowErrors.length > 0) {
        await prisma.importRowError.create({ data: { importJobId: jobId, rowNumber: i + 2, rowData: row, errors: rowErrors } });
        errors++;
        continue;
      }

      // Deduplication
      const name = String(mapped.name).trim();
      const email = mapped.email ? String(mapped.email).toLowerCase() : undefined;
      const domain = mapped.domain ? String(mapped.domain).toLowerCase() : undefined;

      const existing = await prisma.company.findFirst({
        where: {
          isDeleted: false,
          OR: [
            ...(email ? [{ email }] : []),
            ...(domain ? [{ domain }] : []),
            { name: { equals: name, mode: 'insensitive' } },
          ],
        },
      });

      if (existing) {
        if (options.duplicateAction === 'update') {
          await prisma.company.update({ where: { id: existing.id }, data: { ...mapped as object, updatedAt: new Date() } });
          imported++;
        } else {
          skipped++;
        }
      } else {
        await prisma.company.create({ data: { name, ...mapped as object, sourceId: importJob.id, retrievedAt: new Date() } });
        imported++;
      }
    } else if (importJob.recordType === 'CONTACT') {
      const firstName = String(mapped.firstName || mapped.fullName || '').split(' ')[0] || '';
      const lastName = String(mapped.lastName || mapped.fullName || '').split(' ').slice(1).join(' ') || '';

      if (!firstName) rowErrors.push('First name is required');
      if (rowErrors.length > 0) {
        await prisma.importRowError.create({ data: { importJobId: jobId, rowNumber: i + 2, rowData: row, errors: rowErrors } });
        errors++;
        continue;
      }

      const email = mapped.email ? String(mapped.email).toLowerCase() : undefined;
      const existing = email ? await prisma.contact.findFirst({ where: { email, isDeleted: false } }) : null;

      if (existing && options.duplicateAction !== 'update') {
        skipped++;
      } else {
        const data = { firstName, lastName, fullName: `${firstName} ${lastName}`, ...mapped as object };
        if (existing) {
          await prisma.contact.update({ where: { id: existing.id }, data });
        } else {
          await prisma.contact.create({ data });
        }
        imported++;
      }
    }

    // Update progress every 50 rows
    if (i % 50 === 0) {
      await prisma.importJob.update({ where: { id: jobId }, data: { processedRows: i + 1, importedRows: imported, skippedRows: skipped, errorRows: errors } });
      await job.updateProgress(Math.round(((i + 1) / rows.length) * 100));
    }
  }

  await prisma.importJob.update({
    where: { id: jobId },
    data: { status: errors > 0 && imported === 0 ? 'FAILED' : errors > 0 ? 'PARTIAL' : 'COMPLETED', processedRows: rows.length, importedRows: imported, skippedRows: skipped, errorRows: errors, completedAt: new Date() },
  });

  logger.info({ jobId, imported, skipped, errors }, 'Import job completed');
  return { imported, skipped, errors };
}, {
  connection: getRedis(),
  concurrency: 2,
});

// ─── Discovery Worker ─────────────────────────────────────────
const discoveryWorker = new Worker('discovery-jobs', async (job) => {
  const { jobId, sourceKey } = job.data;
  logger.info({ jobId, sourceKey }, 'Discovery job started');

  const discoveryJob = await prisma.discoveryJob.findUnique({ where: { id: jobId }, include: { source: true } });
  if (!discoveryJob) throw new Error('Discovery job not found');

  await prisma.discoveryJob.update({ where: { id: jobId }, data: { status: 'PROCESSING', startedAt: new Date() } });

  // Manual/CSV source is always available
  if (sourceKey === 'manual') {
    await prisma.discoveryJob.update({ where: { id: jobId }, data: { status: 'COMPLETED', completedAt: new Date(), processedCount: 0 } });
    return;
  }

  // For API sources that require credentials, check and fail gracefully
  const source = discoveryJob.source;
  if (source.status === 'UNCONFIGURED') {
    await prisma.discoveryJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', errorMessage: `Source ${sourceKey} is not configured. Add the required API key in Settings > Integrations.`, completedAt: new Date() },
    });
    return;
  }

  // Placeholder for actual API integrations
  logger.warn({ sourceKey }, 'Source integration not yet implemented — awaiting API credentials');
  await prisma.discoveryJob.update({
    where: { id: jobId },
    data: { status: 'FAILED', errorMessage: 'Source integration requires external API credentials. See docs/data-sourcing.md for setup.', completedAt: new Date() },
  });
}, { connection: getRedis(), concurrency: 1 });

// ─── Error handlers ───────────────────────────────────────────
importWorker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Import job failed'));
importWorker.on('completed', (job) => logger.info({ jobId: job.id }, 'Import job completed'));
discoveryWorker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Discovery job failed'));

process.on('SIGTERM', async () => {
  logger.info('Shutting down workers...');
  await importWorker.close();
  await discoveryWorker.close();
  await prisma.$disconnect();
  process.exit(0);
});

logger.info('🔄 Kyzen Worker started — Import and Discovery queues active');
