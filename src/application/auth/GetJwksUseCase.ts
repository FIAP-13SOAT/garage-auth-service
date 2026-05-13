import { createHash, createPublicKey } from 'node:crypto';

export type Jwk = {
  kty: 'RSA';
  n: string;
  e: string;
  use: 'sig';
  alg: 'RS256';
  kid: string;
};

export type JwksResponse = {
  keys: Jwk[];
};

export class GetJwksUseCase {
  constructor(private readonly publicKeyPem: string) {}

  execute(): JwksResponse {
    if (!this.publicKeyPem) return { keys: [] };

    const publicKey = createPublicKey(this.publicKeyPem);
    const jwk = publicKey.export({ format: 'jwk' }) as { n: string; e: string };

    const kid = createHash('sha256')
      .update(`${jwk.n}${jwk.e}`)
      .digest('base64url')
      .slice(0, 16);

    return {
      keys: [
        {
          kty: 'RSA',
          n: jwk.n,
          e: jwk.e,
          use: 'sig',
          alg: 'RS256',
          kid,
        },
      ],
    };
  }
}
