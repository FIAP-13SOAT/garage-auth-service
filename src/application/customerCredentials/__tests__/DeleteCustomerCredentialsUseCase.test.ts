import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteCustomerCredentialsUseCase } from '../DeleteCustomerCredentialsUseCase.js';
import type { CustomerCredentialsGateway } from '../../../adapters/outbound/database/CustomerCredentialsGateway.js';
import { toUUID } from '../../../shared/types/UUID.js';

const makeGateway = (): CustomerCredentialsGateway =>
  ({
    findByCpfCnpj: vi.fn(),
    upsertByCustomerId: vi.fn().mockResolvedValue(undefined),
    deleteByCustomerId: vi.fn().mockResolvedValue(undefined),
  }) as unknown as CustomerCredentialsGateway;

describe('DeleteCustomerCredentialsUseCase', () => {
  let gateway: CustomerCredentialsGateway;
  let useCase: DeleteCustomerCredentialsUseCase;

  beforeEach(() => {
    gateway = makeGateway();
    useCase = new DeleteCustomerCredentialsUseCase(gateway);
  });

  it('delegates to gateway.deleteByCustomerId', async () => {
    await useCase.execute({ customerId: toUUID('cust-1') });

    expect(gateway.deleteByCustomerId).toHaveBeenCalledOnce();
    expect(gateway.deleteByCustomerId).toHaveBeenCalledWith('cust-1');
  });

  it('does not throw when credentials do not exist (deleteMany is tolerant)', async () => {
    vi.mocked(gateway.deleteByCustomerId).mockResolvedValue(undefined);

    await expect(useCase.execute({ customerId: toUUID('unknown') })).resolves.not.toThrow();
  });

  it('propagates gateway errors', async () => {
    vi.mocked(gateway.deleteByCustomerId).mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute({ customerId: toUUID('cust-1') })).rejects.toThrow('DB error');
  });
});
