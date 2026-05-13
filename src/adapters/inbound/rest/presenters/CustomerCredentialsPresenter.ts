import type { CustomerCredentials } from '../../../../domain/customerCredentials/CustomerCredentials.js';

export interface CustomerCredentialsResponse {
  id: string;
  customerId: string;
  cpfCnpj: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

export class CustomerCredentialsPresenter {
  toResponse(c: CustomerCredentials): CustomerCredentialsResponse {
    return {
      id: c.id,
      customerId: c.customerId,
      cpfCnpj: c.cpfCnpj,
      email: c.email,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  toList(items: CustomerCredentials[]): CustomerCredentialsResponse[] {
    return items.map((c) => this.toResponse(c));
  }
}
