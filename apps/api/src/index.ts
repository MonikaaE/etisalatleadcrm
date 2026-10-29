import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/errorHandler';
import { validateEnv } from './lib/env';

// Routes
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import companyRoutes from './routes/companies';
import contactRoutes from './routes/contacts';
import taskRoutes from './routes/tasks';
import importRoutes from './routes/imports';
import campaignRoutes from './routes/campaigns';
import templateRoutes from './routes/templates';
import sourcesRoutes from './routes/sources';
import enrichmentRoutes from './routes/enrichment';
import suppressionRoutes from './routes/suppression';
import conversationRoutes from './routes/conversations';
import webhookRoutes from './routes/webhooks';
import adminUsersRoutes from './routes/admin/users';
import adminIntegrationsRoutes from './routes/admin/integrations';
import adminAuditRoutes from './routes/admin/audit';

// Validate environment at startup
const env = validateEnv();

const app = express();
const server = createServer(app);

// ─── Security middleware ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN || env.APP_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate limiting ────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts. Please try again later.' },
});

app.use('/api/v1/auth', authLimiter);
app.use('/api', generalLimiter);

// ─── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Request logging ──────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip }, 'Incoming request');
  next();
});

// ─── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── API routes ───────────────────────────────────────────────
const v1 = '/api/v1';
app.use(`${v1}/auth`, authRoutes);
app.use(`${v1}/dashboard`, dashboardRoutes);
app.use(`${v1}/companies`, companyRoutes);
app.use(`${v1}/contacts`, contactRoutes);
app.use(`${v1}/tasks`, taskRoutes);
app.use(`${v1}/imports`, importRoutes);
app.use(`${v1}/campaigns`, campaignRoutes);
app.use(`${v1}/templates`, templateRoutes);
app.use(`${v1}/sources`, sourcesRoutes);
app.use(`${v1}/enrichment`, enrichmentRoutes);
app.use(`${v1}/suppression`, suppressionRoutes);
app.use(`${v1}/conversations`, conversationRoutes);
app.use(`${v1}/webhooks`, webhookRoutes);
app.use(`${v1}/admin/users`, adminUsersRoutes);
app.use(`${v1}/admin/integrations`, adminIntegrationsRoutes);
app.use(`${v1}/admin/audit`, adminAuditRoutes);

// ─── 404 handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Error handler ────────────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────
const PORT = env.PORT || 4000;
server.listen(PORT, () => {
  logger.info(`🚀 Kyzen API server running on port ${PORT}`);
  logger.info(`   Environment: ${env.NODE_ENV}`);
  logger.info(`   API Base: http://localhost:${PORT}/api/v1`);
});

export { app, server };
