import type { CustomerCredentialsGateway } from '../../adapters/outbound/database/CustomerCredentialsGateway.js';
import type { UUID } from '../../shared/types/UUID.js';

export type Command = {
  customerId: UUID;
};

export class DeleteCustomerCredentialsUseCase {
  constructor(private readonly gateway: CustomerCredentialsGateway) {}

  async execute(command: Command): Promise<void> {
    await this.gateway.deleteByCustomerId(command.customerId);
  }
}
