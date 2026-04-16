import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpsertCustomerCredentialsUseCase } from '../UpsertCustomerCredentialsUseCase.js';
import type { CustomerCredentialsGateway } from '../../../adapters/outbound/database/CustomerCredentialsGateway.js';

const makeGateway = (): CustomerCredentialsGateway =>
  ({
    findByCpfCnpj: vi.fn(),
    upsertByCustomerId: vi.fn().mockResolvedValue(undefined),
    deleteByCustomerId: vi.fn().mockResolvedValue(undefined),
  }) as unknown as CustomerCredentialsGateway;

describe('UpsertCustomerCredentialsUseCase', () => {
  let gateway: CustomerCredentialsGateway;
  let useCase: UpsertCustomerCredentialsUseCase;

  beforeEach(() => {
    gateway = makeGateway();
    useCase = new UpsertCustomerCredentialsUseCase(gateway);
  });

  it('delegates to gateway.upsertByCustomerId with all fields', async () => {
    await useCase.execute({ customerId: 'cust-1', cpfCnpj: '52998224725', email: 'joao@email.com' });

    expect(gateway.upsertByCustomerId).toHaveBeenCalledOnce();
    expect(gateway.upsertByCustomerId).toHaveBeenCalledWith('cust-1', '52998224725', 'joao@email.com');
  });

  it('delegates with null email when email is omitted', async () => {
    await useCase.execute({ customerId: 'cust-2', cpfCnpj: '52998224725' });

    expect(gateway.upsertByCustomerId).toHaveBeenCalledWith('cust-2', '52998224725', undefined);
  });

  it('is idempotent: calling twice does not throw', async () => {
    const command = { customerId: 'cust-3', cpfCnpj: '52998224725', email: 'a@b.com' };

    await useCase.execute(command);
    await useCase.execute(command);

    expect(gateway.upsertByCustomerId).toHaveBeenCalledTimes(2);
  });

  it('propagates gateway errors', async () => {
    vi.mocked(gateway.upsertByCustomerId).mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute({ customerId: 'cust-1', cpfCnpj: '52998224725' })).rejects.toThrow('DB error');
  });
});
