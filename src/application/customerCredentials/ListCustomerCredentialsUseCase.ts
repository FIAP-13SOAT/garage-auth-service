import type { CustomerCredentials } from '../../domain/customerCredentials/CustomerCredentials.js';
import type { CustomerCredentialsGateway } from '../../adapters/outbound/database/CustomerCredentialsGateway.js';

export class ListCustomerCredentialsUseCase {
  constructor(private readonly gateway: CustomerCredentialsGateway) {}

  async execute(): Promise<CustomerCredentials[]> {
    return this.gateway.findAll();
  }
}
