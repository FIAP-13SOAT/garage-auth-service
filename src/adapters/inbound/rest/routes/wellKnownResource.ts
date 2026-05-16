import { Router } from 'express';
import { env } from '../../../../shared/config/env.js';

const router = Router();

router.get('/openid-configuration', (_req, res) => {
  const issuer = env.apiGatewayIssuerUrl;
  res.json({
    issuer,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    id_token_signing_alg_values_supported: ['RS256'],
  });
});

export default router;
