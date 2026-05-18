import type { UpsertCustomerCredentialsUseCase } from '../../../application/customerCredentials/UpsertCustomerCredentialsUseCase.js';
import type { DeleteCustomerCredentialsUseCase } from '../../../application/customerCredentials/DeleteCustomerCredentialsUseCase.js';
import type { SQSBroker } from '../../outbound/messaging/SQSBroker.js';
import { toUUID } from '../../../shared/types/UUID.js';
import { Logger } from '../../../shared/logger/Logger.js';
import { AuthMetrics } from '../../../shared/metrics/AuthMetrics.js';
import { env } from '../../../shared/config/env.js';

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
    private readonly broker: SQSBroker,
    private readonly upsertUseCase: UpsertCustomerCredentialsUseCase,
    private readonly deleteUseCase: DeleteCustomerCredentialsUseCase,
  ) {}

  async start(): Promise<void> {
    this.broker.subscribe(env.sqsQueues.customerEvents, async (type, payload) => {
      try {
        await this.handle(type, payload);
        AuthMetrics.customerEventProcessed(type);
      } catch (err) {
        Logger.error('customer_events.process_failed', {
          event_type: type,
          error: err instanceof Error ? err.message : String(err),
        });
        AuthMetrics.customerEventFailed(type);
        throw err;
      }
    });
    Logger.info('customer_events.listening', { queue: env.sqsQueues.customerEvents });
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
