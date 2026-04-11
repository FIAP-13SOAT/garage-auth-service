import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../../../domain/user/UserRole.js';

/**
 * Middleware que valida o role do usuário autenticado.
 *
 * O API Gateway JWT Authorizer injeta o claim `role` do token
 * no header `X-User-Role` antes de encaminhar a requisição.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.headers['x-user-role'];

    if (!role || typeof role !== 'string' || !roles.includes(role as UserRole)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  };
}
