import type { Channel } from 'amqplib';
import type { UpsertCustomerCredentialsUseCase } from '../../../application/customerCredentials/UpsertCustomerCredentialsUseCase.js';
import type { DeleteCustomerCredentialsUseCase } from '../../../application/customerCredentials/DeleteCustomerCredentialsUseCase.js';
import { toUUID } from '../../../shared/types/UUID.js';
import { Logger } from '../../../shared/logger/Logger.js';
import { AuthMetrics } from '../../../shared/metrics/AuthMetrics.js';

const QUEUE = 'customer.events';

interface CustomerEventMessage {
  type: string;
  payload: unknown;
}

interface CustomerCriadoPayload {
  customerId: string;
  cpfCnpj: string;
  name: string;
  email: string;
  occurredAt: string;
}

interface CustomerRemovidoPayload {
  customerId: string;
  occurredAt: string;
}

export class CustomerEventsConsumer {
  constructor(
    private readonly channel: Channel,
    private readonly upsertUseCase: UpsertCustomerCredentialsUseCase,
    private readonly deleteUseCase: DeleteCustomerCredentialsUseCase,
  ) {}

  async start(): Promise<void> {
    await this.channel.assertQueue(QUEUE, { durable: true });
    await this.channel.consume(QUEUE, async (msg) => {
      if (!msg) return;
      let eventType = 'unknown';
      try {
        const { type, payload } = JSON.parse(msg.content.toString()) as CustomerEventMessage;
        eventType = type;
        await this.handle(type, payload);
        this.channel.ack(msg);
        AuthMetrics.customerEventProcessed(type);
      } catch (err) {
        Logger.error('customer_events.process_failed', {
          event_type: eventType,
          error: err instanceof Error ? err.message : String(err),
        });
        AuthMetrics.customerEventFailed(eventType);
        this.channel.nack(msg, false, false);
      }
    });
    Logger.info('customer_events.listening', { queue: QUEUE });
  }

  private async handle(type: string, payload: unknown): Promise<void> {
    switch (type) {
      case 'CUSTOMER_CRIADO':
      case 'CUSTOMER_ATUALIZADO': {
        const p = payload as CustomerCriadoPayload;
        await this.upsertUseCase.execute({
          customerId: toUUID(p.customerId),
          cpfCnpj: p.cpfCnpj,
          email: p.email ?? null,
        });
        break;
      }
      case 'CUSTOMER_REMOVIDO': {
        const p = payload as CustomerRemovidoPayload;
        await this.deleteUseCase.execute({ customerId: toUUID(p.customerId) });
        break;
      }
      default:
        Logger.warn('customer_events.unknown_type', { event_type: type });
    }
  }
}
