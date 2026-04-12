import type { CustomerCredentialsGateway } from '../../adapters/outbound/database/CustomerCredentialsGateway.js';
import type { UUID } from '../../shared/types/UUID.js';

export type Command = {
  customerId: UUID;
  cpfCnpj: string;
  email?: string | null;
};

export class UpsertCustomerCredentialsUseCase {
  constructor(private readonly gateway: CustomerCredentialsGateway) {}

  async execute(command: Command): Promise<void> {
    await this.gateway.upsertByCustomerId(command.customerId, command.cpfCnpj, command.email);
  }
}
