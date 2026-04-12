import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerEventsConsumer } from '../CustomerEventsConsumer.js';
import type { UpsertCustomerCredentialsUseCase } from '../../../../application/customerCredentials/UpsertCustomerCredentialsUseCase.js';
import type { DeleteCustomerCredentialsUseCase } from '../../../../application/customerCredentials/DeleteCustomerCredentialsUseCase.js';
import type { Channel } from 'amqplib';

const makeChannel = () => ({
  assertQueue: vi.fn().mockResolvedValue(undefined),
  consume: vi.fn().mockResolvedValue(undefined),
  ack: vi.fn(),
  nack: vi.fn(),
}) as unknown as Channel;

const makeUpsert = (): UpsertCustomerCredentialsUseCase =>
  ({ execute: vi.fn().mockResolvedValue(undefined) }) as unknown as UpsertCustomerCredentialsUseCase;

const makeDelete = (): DeleteCustomerCredentialsUseCase =>
  ({ execute: vi.fn().mockResolvedValue(undefined) }) as unknown as DeleteCustomerCredentialsUseCase;

const buildMessage = (type: string, payload: unknown) => ({
  content: Buffer.from(JSON.stringify({ type, payload })),
});

describe('CustomerEventsConsumer', () => {
  let channel: Channel;
  let upsert: UpsertCustomerCredentialsUseCase;
  let del: DeleteCustomerCredentialsUseCase;
  let consumer: CustomerEventsConsumer;

  beforeEach(() => {
    channel = makeChannel();
    upsert = makeUpsert();
    del = makeDelete();
    consumer = new CustomerEventsConsumer(channel, upsert, del);
    vi.clearAllMocks();
  });

  it('asserts customer.events queue as durable on start', async () => {
    await consumer.start();
    expect(channel.assertQueue).toHaveBeenCalledWith('customer.events', { durable: true });
  });

  describe('message handling', () => {
    let handler: (msg: unknown) => Promise<void>;

    beforeEach(async () => {
      vi.mocked(channel.assertQueue).mockResolvedValue(undefined as never);
      vi.mocked(channel.consume).mockImplementation(async (_queue, cb) => {
        handler = cb as (msg: unknown) => Promise<void>;
        return undefined as never;
      });
      await consumer.start();
    });

    it('calls upsert on CUSTOMER_CRIADO with correct payload', async () => {
      const payload = { customerId: 'cust-1', cpfCnpj: '52998224725', name: 'João', email: 'j@j.com', occurredAt: new Date().toISOString() };
      await handler(buildMessage('CUSTOMER_CRIADO', payload));

      expect(upsert.execute).toHaveBeenCalledWith({ customerId: 'cust-1', cpfCnpj: '52998224725', email: 'j@j.com' });
      expect(channel.ack).toHaveBeenCalledOnce();
    });

    it('calls upsert on CUSTOMER_ATUALIZADO (same handler as CRIADO)', async () => {
      const payload = { customerId: 'cust-1', cpfCnpj: '52998224725', name: 'João', email: 'new@j.com', occurredAt: new Date().toISOString() };
      await handler(buildMessage('CUSTOMER_ATUALIZADO', payload));

      expect(upsert.execute).toHaveBeenCalledWith({ customerId: 'cust-1', cpfCnpj: '52998224725', email: 'new@j.com' });
      expect(channel.ack).toHaveBeenCalledOnce();
    });

    it('calls delete on CUSTOMER_REMOVIDO', async () => {
      const payload = { customerId: 'cust-2', occurredAt: new Date().toISOString() };
      await handler(buildMessage('CUSTOMER_REMOVIDO', payload));

      expect(del.execute).toHaveBeenCalledWith({ customerId: 'cust-2' });
      expect(channel.ack).toHaveBeenCalledOnce();
    });

    it('acks only after use case resolves (pós-persist guarantee)', async () => {
      let upsertResolved = false;
      vi.mocked(upsert.execute).mockImplementation(async () => { upsertResolved = true; });
      vi.mocked(channel.ack).mockImplementation(() => { expect(upsertResolved).toBe(true); });

      const payload = { customerId: 'cust-1', cpfCnpj: '52998224725', name: 'X', email: 'x@x.com', occurredAt: '' };
      await handler(buildMessage('CUSTOMER_CRIADO', payload));

      expect(channel.ack).toHaveBeenCalledOnce();
    });

    it('is idempotent: processing same CUSTOMER_CRIADO twice does not throw', async () => {
      const payload = { customerId: 'cust-1', cpfCnpj: '52998224725', name: 'X', email: 'x@x.com', occurredAt: '' };
      await handler(buildMessage('CUSTOMER_CRIADO', payload));
      await handler(buildMessage('CUSTOMER_CRIADO', payload));

      expect(upsert.execute).toHaveBeenCalledTimes(2);
      expect(channel.ack).toHaveBeenCalledTimes(2);
    });

    it('nacks without requeue on use case error', async () => {
      vi.mocked(upsert.execute).mockRejectedValue(new Error('DB error'));
      const payload = { customerId: 'cust-1', cpfCnpj: '52998224725', name: 'X', email: 'x@x.com', occurredAt: '' };
      await handler(buildMessage('CUSTOMER_CRIADO', payload));

      expect(channel.nack).toHaveBeenCalledWith(expect.anything(), false, false);
      expect(channel.ack).not.toHaveBeenCalled();
    });

    it('acks unknown event types without throwing (skip-and-ack)', async () => {
      await handler(buildMessage('EVENTO_DESCONHECIDO', {}));

      expect(channel.ack).toHaveBeenCalledOnce();
      expect(channel.nack).not.toHaveBeenCalled();
    });

    it('nacks on malformed JSON', async () => {
      const badMsg = { content: Buffer.from('not-json') };
      await handler(badMsg);

      expect(channel.nack).toHaveBeenCalledWith(badMsg, false, false);
      expect(channel.ack).not.toHaveBeenCalled();
    });

    it('ignores null messages (queue cancelled)', async () => {
      await handler(null);

      expect(channel.ack).not.toHaveBeenCalled();
      expect(channel.nack).not.toHaveBeenCalled();
    });
  });
});
