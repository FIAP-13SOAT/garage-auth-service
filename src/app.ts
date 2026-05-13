import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import healthResource from './adapters/inbound/rest/routes/healthResource.js';
import userResource from './adapters/inbound/rest/routes/userResource.js';
import customerCredentialsResource from './adapters/inbound/rest/routes/customerCredentialsResource.js';
import authResource from './adapters/inbound/rest/routes/authResource.js';
import wellKnownResource from './adapters/inbound/rest/routes/wellKnownResource.js';
import { requestLogger } from './adapters/inbound/rest/middlewares/requestLogger.js';
import jwksResource from './adapters/inbound/rest/routes/jwksResource.js';
import { AppError } from './shared/errors/AppError.js';
import { Logger } from './shared/logger/Logger.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json());
app.use(requestLogger);

app.use('/health', healthResource);
app.use('/.well-known', jwksResource);
app.use('/login', authResource);
app.use('/', authResource);
app.use('/admin/users', userResource);
app.use('/admin/customer-credentials', customerCredentialsResource);
app.use('/.well-known', wellKnownResource);

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  Logger.error('http.unhandled_error', {
    method: req.method,
    path: req.path,
    error: err instanceof Error ? err.message : String(err),
  });
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
