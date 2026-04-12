import type { Channel } from 'amqplib';
import type { UpsertCustomerCredentialsUseCase } from '../../../application/customerCredentials/UpsertCustomerCredentialsUseCase.js';
import type { DeleteCustomerCredentialsUseCase } from '../../../application/customerCredentials/DeleteCustomerCredentialsUseCase.js';
import { toUUID } from '../../../shared/types/UUID.js';

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
      try {
        const { type, payload } = JSON.parse(msg.content.toString()) as CustomerEventMessage;
        await this.handle(type, payload);
        this.channel.ack(msg);
      } catch (err) {
        console.error('[CustomerEventsConsumer] Failed to process message:', err);
        this.channel.nack(msg, false, false);
      }
    });
    console.warn('[CustomerEventsConsumer] Listening on customer.events');
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
        console.warn(`[CustomerEventsConsumer] Unknown event type: ${type}`);
    }
  }
}
