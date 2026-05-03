import { describe, it, expect } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import { GetJwksUseCase } from '../GetJwksUseCase.js';

const makeKey = (): string =>
  generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  }).publicKey;

describe('GetJwksUseCase', () => {
  it('exposes a JWKS with one RSA key in JWK format', () => {
    const jwks = new GetJwksUseCase(makeKey()).execute();

    expect(jwks.keys).toHaveLength(1);
    const [key] = jwks.keys;
    expect(key.kty).toBe('RSA');
    expect(key.alg).toBe('RS256');
    expect(key.use).toBe('sig');
    expect(key.n).toBeDefined();
    expect(key.e).toBeDefined();
    expect(key.kid.length).toBeGreaterThan(0);
  });

  it('produces a stable kid for the same public key', () => {
    const pem = makeKey();
    const first = new GetJwksUseCase(pem).execute();
    const second = new GetJwksUseCase(pem).execute();
    expect(first.keys[0].kid).toBe(second.keys[0].kid);
  });

  it('produces different kids for different keys', () => {
    const first = new GetJwksUseCase(makeKey()).execute();
    const second = new GetJwksUseCase(makeKey()).execute();
    expect(first.keys[0].kid).not.toBe(second.keys[0].kid);
  });

  it('throws when the public key PEM is invalid', () => {
    expect(() => new GetJwksUseCase('not-a-valid-pem').execute()).toThrow();
  });
});
