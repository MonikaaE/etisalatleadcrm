import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, canWrite, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { getEnv } from '../lib/env';
import { importQueue } from '../queues/import.queue';

const router = Router();
router.use(authenticate);

const env = getEnv();
const uploadDir = env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: (env.UPLOAD_MAX_SIZE_MB || 50) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError('Only CSV and XLSX files are allowed', 400));
    }
  },
});

// GET /api/v1/imports
router.get('/', async (_req: AuthRequest, res: Response) => {
  const imports = await prisma.importJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true, filename: true, originalName: true, recordType: true, status: true,
      totalRows: true, processedRows: true, importedRows: true, skippedRows: true, errorRows: true,
      startedAt: true, completedAt: true, createdAt: true,
    },
  });
  res.json({ success: true, data: imports });
});

// GET /api/v1/imports/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const job = await prisma.importJob.findUnique({
    where: { id: req.params.id },
    include: { rowErrors: { take: 100 } },
  });
  if (!job) throw new AppError('Import job not found', 404);
  res.json({ success: true, data: job });
});

// POST /api/v1/imports/upload
router.post('/upload', canWrite, upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  const { recordType, options } = z.object({
    recordType: z.enum(['COMPANY', 'CONTACT']).default('COMPANY'),
    options: z.string().optional(),
  }).parse(req.body);

  // Parse preview rows
  const { parseFile } = await import('../services/import.service');
  const preview = await parseFile(req.file.path, req.file.originalname);

  const importJob = await prisma.importJob.create({
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      recordType,
      totalRows: preview.totalRows,
      options: options ? JSON.parse(options) : {},
      createdById: req.user!.id,
    },
  });

  res.status(201).json({
    success: true,
    data: {
      jobId: importJob.id,
      preview: preview.rows.slice(0, 10),
      headers: preview.headers,
      totalRows: preview.totalRows,
      sampleRows: preview.rows.slice(0, 5),
    },
  });
});

// POST /api/v1/imports/:id/execute
router.post('/:id/execute', canWrite, async (req: AuthRequest, res: Response) => {
  const { columnMapping, options } = z.object({
    columnMapping: z.record(z.string()),
    options: z.object({
      duplicateAction: z.enum(['skip', 'update', 'review']).default('skip'),
      skipInvalid: z.boolean().default(true),
    }).optional(),
  }).parse(req.body);

  const job = await prisma.importJob.findUnique({ where: { id: req.params.id } });
  if (!job) throw new AppError('Import job not found', 404);
  if (job.status !== 'PENDING') throw new AppError('Import job already processed', 400);

  await prisma.importJob.update({
    where: { id: req.params.id },
    data: { columnMapping, options: options as object, status: 'PROCESSING', startedAt: new Date() },
  });

  const bullJob = await importQueue.add('process-import', { jobId: req.params.id, userId: req.user!.id }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });

  await prisma.importJob.update({ where: { id: req.params.id }, data: { jobQueueId: bullJob.id?.toString() } });

  res.json({ success: true, message: 'Import started', data: { jobId: req.params.id, queueJobId: bullJob.id } });
});

// GET /api/v1/imports/:id/errors
router.get('/:id/errors', async (req: AuthRequest, res: Response) => {
  const errors = await prisma.importRowError.findMany({
    where: { importJobId: req.params.id },
    take: 500,
    orderBy: { rowNumber: 'asc' },
  });
  res.json({ success: true, data: errors });
});

export default router;
