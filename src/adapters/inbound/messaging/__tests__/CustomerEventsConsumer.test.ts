import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerEventsConsumer } from '../CustomerEventsConsumer.js';
import type { UpsertCustomerCredentialsUseCase } from '../../../../application/customerCredentials/UpsertCustomerCredentialsUseCase.js';
import type { DeleteCustomerCredentialsUseCase } from '../../../../application/customerCredentials/DeleteCustomerCredentialsUseCase.js';
import type { SQSBroker } from '../../../outbound/messaging/SQSBroker.js';

type Handler = (type: string, payload: unknown) => Promise<void>;

const makeBroker = () => {
  let capturedHandler: Handler | null = null;
  const broker = {
    publish: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockImplementation((_url: string, handler: Handler) => { capturedHandler = handler; }),
    stop: vi.fn(),
    triggerMessage: (type: string, payload: unknown) => capturedHandler!(type, payload),
  };
  return broker as unknown as SQSBroker & { triggerMessage(type: string, payload: unknown): Promise<void> };
};

const makeUpsert = (): UpsertCustomerCredentialsUseCase =>
  ({ execute: vi.fn().mockResolvedValue(undefined) }) as unknown as UpsertCustomerCredentialsUseCase;

const makeDelete = (): DeleteCustomerCredentialsUseCase =>
  ({ execute: vi.fn().mockResolvedValue(undefined) }) as unknown as DeleteCustomerCredentialsUseCase;

describe('CustomerEventsConsumer', () => {
  let broker: ReturnType<typeof makeBroker>;
  let upsert: UpsertCustomerCredentialsUseCase;
  let del: DeleteCustomerCredentialsUseCase;
  let consumer: CustomerEventsConsumer;

  beforeEach(() => {
    broker = makeBroker();
    upsert = makeUpsert();
    del = makeDelete();
    consumer = new CustomerEventsConsumer(broker, upsert, del);
    vi.clearAllMocks();
  });

  it('subscribes to customer.events queue on start', async () => {
    await consumer.start();
    expect(broker.subscribe).toHaveBeenCalledOnce();
  });

  describe('message handling', () => {
    beforeEach(async () => {
      await consumer.start();
    });

    it('calls upsert on CUSTOMER_CRIADO with correct payload', async () => {
      const payload = { customerId: 'cust-1', cpfCnpj: '52998224725', name: 'João', email: 'j@j.com', occurredAt: new Date().toISOString() };
      await broker.triggerMessage('CUSTOMER_CRIADO', payload);

      expect(upsert.execute).toHaveBeenCalledWith({ customerId: 'cust-1', cpfCnpj: '52998224725', email: 'j@j.com' });
    });

    it('calls upsert on CUSTOMER_ATUALIZADO', async () => {
      const payload = { customerId: 'cust-1', cpfCnpj: '52998224725', name: 'João', email: 'new@j.com', occurredAt: new Date().toISOString() };
      await broker.triggerMessage('CUSTOMER_ATUALIZADO', payload);

      expect(upsert.execute).toHaveBeenCalledWith({ customerId: 'cust-1', cpfCnpj: '52998224725', email: 'new@j.com' });
    });

    it('calls delete on CUSTOMER_REMOVIDO', async () => {
      const payload = { customerId: 'cust-2', occurredAt: new Date().toISOString() };
      await broker.triggerMessage('CUSTOMER_REMOVIDO', payload);

      expect(del.execute).toHaveBeenCalledWith({ customerId: 'cust-2' });
    });

    it('is idempotent: processing same event twice does not throw', async () => {
      const payload = { customerId: 'cust-1', cpfCnpj: '52998224725', name: 'X', email: 'x@x.com', occurredAt: '' };
      await broker.triggerMessage('CUSTOMER_CRIADO', payload);
      await broker.triggerMessage('CUSTOMER_CRIADO', payload);

      expect(upsert.execute).toHaveBeenCalledTimes(2);
    });

    it('rethrows on use case error so broker withholds delete', async () => {
      vi.mocked(upsert.execute).mockRejectedValue(new Error('DB error'));
      const payload = { customerId: 'cust-1', cpfCnpj: '52998224725', name: 'X', email: 'x@x.com', occurredAt: '' };

      await expect(broker.triggerMessage('CUSTOMER_CRIADO', payload)).rejects.toThrow('DB error');
    });

    it('does not throw for unknown event types', async () => {
      await expect(broker.triggerMessage('EVENTO_DESCONHECIDO', {})).resolves.not.toThrow();
    });
  });
});
