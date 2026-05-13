import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../../../shared/config/env.js';
import { UserRole } from '../../../../domain/user/UserRole.js';

function extractRole(req: Request): string | null {
  // API Gateway injects role via header
  const headerRole = req.headers['x-user-role'];
  if (typeof headerRole === 'string' && headerRole) return headerRole;

  // Fallback: read role directly from JWT (local dev without gateway)
  const auth = req.headers['authorization'];
  if (auth?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(auth.slice(7), env.jwt.secret) as { role?: string };
      if (typeof payload.role === 'string') return payload.role;
    } catch {
      // invalid or expired token — fall through to 403
    }
  }

  return null;
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = extractRole(req);

    if (!role || !roles.includes(role as UserRole)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  };
}
