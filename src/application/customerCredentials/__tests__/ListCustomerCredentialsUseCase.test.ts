import { describe, it, expect, vi } from 'vitest';
import { ListCustomerCredentialsUseCase } from '../ListCustomerCredentialsUseCase.js';
import { CustomerCredentials } from '../../../domain/customerCredentials/CustomerCredentials.js';
import { toUUID } from '../../../shared/types/UUID.js';

const makeGateway = () => ({
  findByCpfCnpj: vi.fn(),
  upsertByCustomerId: vi.fn(),
  deleteByCustomerId: vi.fn(),
  findAll: vi.fn(),
});

const makeCredentials = (cpfCnpj: string) =>
  new CustomerCredentials({
    id: toUUID('id-1'),
    customerId: toUUID('cust-1'),
    cpfCnpj,
    email: 'test@test.com',
  });

describe('ListCustomerCredentialsUseCase', () => {
  it('should return all customer credentials', async () => {
    const gateway = makeGateway();
    const items = [makeCredentials('123.456.789-00'), makeCredentials('987.654.321-00')];
    gateway.findAll.mockResolvedValue(items);

    const result = await new ListCustomerCredentialsUseCase(gateway as never).execute();

    expect(result).toHaveLength(2);
    expect(gateway.findAll).toHaveBeenCalledOnce();
  });

  it('should return empty list when no credentials exist', async () => {
    const gateway = makeGateway();
    gateway.findAll.mockResolvedValue([]);

    const result = await new ListCustomerCredentialsUseCase(gateway as never).execute();

    expect(result).toHaveLength(0);
  });
});
