import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'garage-auth-service' });
});

router.get('/version', (_req, res) => {
  res.json({ version: '1.1.0', service: 'garage-auth-service' });
});

export default router;
