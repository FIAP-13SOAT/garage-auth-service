import jwt from 'jsonwebtoken';
import { env } from '../../shared/config/env.js';
import type { CustomerCredentialsGateway } from '../../adapters/outbound/database/CustomerCredentialsGateway.js';
import { CustomerCredentialsNotFoundException } from '../../domain/customerCredentials/exceptions/CustomerCredentialsNotFoundException.js';
import { AuthMetrics } from '../../shared/metrics/AuthMetrics.js';

export type Command = {
  cpfCnpj: string;
};

export type Result = {
  token: string;
};

export class LoginCustomerUseCase {
  constructor(private readonly gateway: CustomerCredentialsGateway) {}

  async execute(command: Command): Promise<Result> {
    const credentials = await this.gateway.findByCpfCnpj(command.cpfCnpj);
    if (!credentials) {
      AuthMetrics.loginFailure('customer', 'credentials_not_found');
      throw new CustomerCredentialsNotFoundException();
    }

    const token = jwt.sign(
      { sub: credentials.customerId, role: 'CUSTOMER' },
      env.jwt.secret,
      { algorithm: 'HS256', expiresIn: env.jwt.expiresIn } as jwt.SignOptions,
    );

    AuthMetrics.loginSuccess('customer');
    return { token };
  }
}
