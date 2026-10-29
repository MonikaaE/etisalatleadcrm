import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate, adminOnly, managerOrAbove, AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// GET /api/v1/admin/users
router.get('/', managerOrAbove, async (_req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true, lastLoginAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: users });
});

// PUT /api/v1/admin/users/:id
router.put('/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    role: z.enum(['ADMIN', 'SALES_MANAGER', 'SALES_REP', 'ANALYST']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  }).parse(req.body);

  const user = await prisma.user.update({ where: { id: req.params.id }, data });
  res.json({ success: true, data: user });
});

// POST /api/v1/admin/users/:id/reset-password
router.post('/:id/reset-password', adminOnly, async (_req: AuthRequest, res: Response) => {
  const tempPassword = Math.random().toString(36).slice(-12);
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  await prisma.user.update({ where: { id: _req.params.id }, data: { passwordHash, loginAttempts: 0, lockedUntil: null } });
  // In production, email the temp password instead of returning it
  res.json({ success: true, message: 'Password reset. Temp password (share securely):', data: { tempPassword } });
});

// DELETE /api/v1/admin/users/:id
router.delete('/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  if (req.params.id === req.user!.id) throw new AppError('Cannot delete your own account', 400);
  await prisma.user.update({ where: { id: req.params.id }, data: { status: 'INACTIVE' } });
  res.json({ success: true, message: 'User deactivated' });
});

export default router;
