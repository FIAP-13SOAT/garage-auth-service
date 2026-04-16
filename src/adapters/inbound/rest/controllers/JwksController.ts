import type { Request, Response, NextFunction } from 'express';
import type { GetJwksUseCase } from '../../../../application/auth/GetJwksUseCase.js';

export class JwksController {
  constructor(private readonly getJwksUseCase: GetJwksUseCase) {}

  get(_req: Request, res: Response, next: NextFunction): void {
    try {
      const jwks = this.getJwksUseCase.execute();
      res.set('Cache-Control', 'public, max-age=3600');
      res.json(jwks);
    } catch (err) {
      next(err);
    }
  }
}
