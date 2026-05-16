import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../../../domain/user/UserRole.js';

function extractRole(req: Request): string | null {
  // API Gateway injects role via header
  const headerRole = req.headers['x-user-role'];
  if (typeof headerRole === 'string' && headerRole) return headerRole;

  // Fallback: decode JWT payload (signature already validated by API Gateway in prod)
  const auth = req.headers['authorization'];
  if (auth?.startsWith('Bearer ')) {
    try {
      const [, payload] = auth.slice(7).split('.');
      const decoded = JSON.parse(Buffer.from(payload ?? '', 'base64url').toString()) as { role?: string };
      if (typeof decoded.role === 'string') return decoded.role;
    } catch {
      // malformed token — fall through to 403
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
