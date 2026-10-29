import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { getEnv } from '../lib/env';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { loginSchema, registerSchema } from '@kyzen/shared';
import { logger } from '../lib/logger';

const router = Router();

function generateAccessToken(user: { id: string; email: string; role: string; firstName: string; lastName: string }): string {
  const env = getEnv();
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    env.AUTH_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRY as string }
  );
}

async function generateRefreshToken(userId: string, ipAddress?: string, userAgent?: string): Promise<string> {
  const env = getEnv();
  const token = jwt.sign({ userId, type: 'refresh' }, env.AUTH_SECRET, { expiresIn: env.REFRESH_TOKEN_EXPIRY as string });
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({ data: { token, userId, expiresAt, ipAddress, userAgent } });
  return token;
}

// POST /api/v1/auth/login
router.post('/login', async (req, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  if (user.status !== 'ACTIVE') throw new AppError('Account is not active', 401, 'ACCOUNT_INACTIVE');

  // Check lock
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError('Account temporarily locked. Try again later.', 423, 'ACCOUNT_LOCKED');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const attempts = user.loginAttempts + 1;
    const lock = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : undefined;
    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: attempts, lockedUntil: lock },
    });
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Reset attempts
  await prisma.user.update({
    where: { id: user.id },
    data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id, req.ip, req.headers['user-agent']);

  logger.info({ userId: user.id, email: user.email }, 'User logged in');

  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    },
  });
});

// POST /api/v1/auth/register (Admin only in production)
router.post('/register', async (req, res: Response) => {
  const data = registerSchema.parse(req.body);

  // In production, check if admin exists and if so, require auth
  const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (adminExists) {
    // Only admins can create new users
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Only admins can create new users', 403, 'FORBIDDEN');
    }
    try {
      const env = getEnv();
      const payload = jwt.verify(authHeader.slice(7), env.AUTH_SECRET) as { role: string };
      if (payload.role !== 'ADMIN') throw new AppError('Only admins can create new users', 403, 'FORBIDDEN');
    } catch {
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || (adminExists ? 'SALES_REP' : 'ADMIN'),
    },
  });

  logger.info({ userId: user.id }, 'User registered');

  res.status(201).json({
    success: true,
    data: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
  });
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res: Response) => {
  const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
  const env = getEnv();

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  try {
    jwt.verify(refreshToken, env.AUTH_SECRET);
  } catch {
    throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user || user.status !== 'ACTIVE') throw new AppError('User not found or inactive', 401);

  // Rotate token
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = await generateRefreshToken(user.id);

  res.json({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
});

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  const { refreshToken } = z.object({ refreshToken: z.string().optional() }).parse(req.body);
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    }).catch(() => {});
  }
  res.json({ success: true, message: 'Logged out' });
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, avatarUrl: true, phone: true, status: true, createdAt: true, lastLoginAt: true },
  });
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, data: user });
});

// PATCH /api/v1/auth/change-password
router.patch('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  }).parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new AppError('User not found', 404);

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError('Current password is incorrect', 400, 'WRONG_PASSWORD');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash, passwordChangedAt: new Date() } });

  res.json({ success: true, message: 'Password changed successfully' });
});

export default router;
