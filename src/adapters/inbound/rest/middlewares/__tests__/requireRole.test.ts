import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { requireRole } from '../requireRole.js';
import { UserRole } from '../../../../../domain/user/UserRole.js';

const JWT_SECRET = 'soat-dev-secret';

const makeToken = (role: string) =>
  jwt.sign({ sub: 'user-1', role }, JWT_SECRET, { algorithm: 'HS256' });

const makeReq = (opts: { role?: string; token?: string } = {}) =>
  ({
    headers: {
      ...(opts.role !== undefined ? { 'x-user-role': opts.role } : {}),
      ...(opts.token !== undefined ? { authorization: `Bearer ${opts.token}` } : {}),
    },
  }) as unknown as Request;

const makeRes = () => {
  const res = { status: vi.fn(), json: vi.fn() } as unknown as Response;
  (res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
  return res;
};

const next: NextFunction = vi.fn();

describe('requireRole', () => {
  describe('via x-user-role header (gateway path)', () => {
    it('should call next when role matches', () => {
      requireRole(UserRole.ADMIN)(makeReq({ role: 'ADMIN' }), makeRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it('should call next when one of multiple allowed roles matches', () => {
      requireRole(UserRole.ADMIN, UserRole.CLERK)(makeReq({ role: 'CLERK' }), makeRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it('should return 403 when role does not match', () => {
      const res = makeRes();
      requireRole(UserRole.ADMIN)(makeReq({ role: 'MECHANIC' }), res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    });

    it('should return 403 for unknown role value', () => {
      const res = makeRes();
      requireRole(UserRole.ADMIN)(makeReq({ role: 'UNKNOWN_ROLE' }), res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('via JWT Authorization header (direct access fallback)', () => {
    it('should call next when JWT contains allowed role', () => {
      const localNext = vi.fn();
      requireRole(UserRole.ADMIN)(makeReq({ token: makeToken('ADMIN') }), makeRes(), localNext);
      expect(localNext).toHaveBeenCalled();
    });

    it('should return 403 when JWT role is not allowed', () => {
      const res = makeRes();
      requireRole(UserRole.ADMIN)(makeReq({ token: makeToken('MECHANIC') }), res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 403 when JWT is invalid', () => {
      const res = makeRes();
      requireRole(UserRole.ADMIN)(makeReq({ token: 'not.a.valid.token' }), res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('no credentials', () => {
    it('should return 403 when neither header nor token is present', () => {
      const res = makeRes();
      requireRole(UserRole.ADMIN)(makeReq(), res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should not call next when access is denied', () => {
      const localNext = vi.fn();
      requireRole(UserRole.ADMIN)(makeReq({ role: 'MECHANIC' }), makeRes(), localNext);
      expect(localNext).not.toHaveBeenCalled();
    });
  });
});
