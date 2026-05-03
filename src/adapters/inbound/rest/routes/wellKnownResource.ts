import { Router } from 'express';
import { createPublicKey } from 'node:crypto';
import { env } from '../../../../shared/config/env.js';

const router = Router();

router.get('/jwks.json', (_req, res) => {
  const pem = env.jwt.publicKey.replace(/\\n/g, '\n');
  const key = createPublicKey(pem);
  const jwk = key.export({ format: 'jwk' }) as Record<string, string>;
  res.json({ keys: [{ ...jwk, use: 'sig', alg: 'RS256', kid: '1' }] });
});

router.get('/openid-configuration', (_req, res) => {
  const issuer = env.apiGatewayIssuerUrl;
  res.json({
    issuer,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    id_token_signing_alg_values_supported: ['RS256'],
  });
});

export default router;
