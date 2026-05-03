import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginCustomerUseCase } from '../LoginCustomerUseCase.js';
import { CustomerCredentials } from '../../../domain/customerCredentials/CustomerCredentials.js';
import { CustomerCredentialsNotFoundException } from '../../../domain/customerCredentials/exceptions/CustomerCredentialsNotFoundException.js';
import type { CustomerCredentialsGateway } from '../../../adapters/outbound/database/CustomerCredentialsGateway.js';
import { newUUID } from '../../../shared/types/UUID.js';

vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn().mockReturnValue('signed.jwt.token') },
}));

const makeGateway = (): CustomerCredentialsGateway =>
  ({
    findByCpfCnpj: vi.fn(),
    upsertByCustomerId: vi.fn(),
    deleteByCustomerId: vi.fn(),
  }) as unknown as CustomerCredentialsGateway;

describe('LoginCustomerUseCase', () => {
  let gateway: CustomerCredentialsGateway;
  let useCase: LoginCustomerUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    gateway = makeGateway();
    useCase = new LoginCustomerUseCase(gateway);
  });

  it('issues a JWT with role CUSTOMER when credentials exist', async () => {
    const customerId = newUUID();
    const credentials = new CustomerCredentials({
      id: newUUID(),
      customerId,
      cpfCnpj: '12345678901',
      email: 'customer@example.com',
    });
    vi.mocked(gateway.findByCpfCnpj).mockResolvedValue(credentials);

    const result = await useCase.execute({ cpfCnpj: '12345678901' });

    expect(result.token).toBe('signed.jwt.token');
    const jwt = (await import('jsonwebtoken')).default;
    expect(jwt.sign).toHaveBeenCalledWith(
      { sub: customerId, role: 'CUSTOMER' },
      expect.any(String),
      expect.objectContaining({ algorithm: 'RS256' }),
    );
  });

  it('throws CustomerCredentialsNotFoundException when credentials not found', async () => {
    vi.mocked(gateway.findByCpfCnpj).mockResolvedValue(null);

    await expect(useCase.execute({ cpfCnpj: '00000000000' })).rejects.toThrow(
      CustomerCredentialsNotFoundException,
    );
  });
});
