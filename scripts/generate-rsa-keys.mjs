#!/usr/bin/env node
/**
 * Gera um par de chaves RSA 2048-bit para assinar e verificar JWTs RS256.
 *
 * Uso:
 *   node scripts/generate-rsa-keys.mjs
 *
 * Saída: imprime as variáveis de ambiente prontas para copiar no .env ou
 * no Secret Manager. As chaves NÃO são gravadas em disco nem commitadas.
 *
 * Variáveis geradas:
 *   JWT_PRIVATE_KEY  – chave privada PEM (assina tokens, fica só no auth-service)
 *   JWT_PUBLIC_KEY   – chave pública PEM (usada no JWKS endpoint + API Gateway)
 */
import { generateKeyPairSync } from 'node:crypto';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const escape = (pem) => pem.replace(/\n/g, '\\n');

console.log('# Cole as linhas abaixo no seu .env (nunca commite este arquivo):\n');
console.log(`JWT_PRIVATE_KEY="${escape(privateKey)}"`);
console.log(`JWT_PUBLIC_KEY="${escape(publicKey)}"`);
