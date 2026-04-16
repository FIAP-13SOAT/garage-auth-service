import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import healthResource from './adapters/inbound/rest/routes/healthResource.js';
import userResource from './adapters/inbound/rest/routes/userResource.js';
import authResource from './adapters/inbound/rest/routes/authResource.js';
import jwksResource from './adapters/inbound/rest/routes/jwksResource.js';
import { AppError } from './shared/errors/AppError.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json());

app.use('/health', healthResource);
app.use('/.well-known', jwksResource);
app.use('/login', authResource);
app.use('/', authResource);
app.use('/admin/users', userResource);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
