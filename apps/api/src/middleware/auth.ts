import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { getEnv } from '../lib/env';
import { UserRole } from '@kyzen/shared';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.slice(7);
  const env = getEnv();

  try {
    const payload = jwt.verify(token, env.AUTH_SECRET) as AuthUser;
    req.user = payload;
    next();
  } catch {
    throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
    }
    next();
  };
}

// Convenience: Admin only
export const adminOnly = authorize('ADMIN');

// Sales Manager and above
export const managerOrAbove = authorize('ADMIN', 'SALES_MANAGER');

// Can write (not read-only)
export const canWrite = authorize('ADMIN', 'SALES_MANAGER', 'SALES_REP');
