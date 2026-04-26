import type { Request, Response, NextFunction } from 'express';
import { Logger } from '../../../../shared/logger/Logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    Logger.info('http.request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Number(durationMs.toFixed(2)),
    });
  });
  next();
}
