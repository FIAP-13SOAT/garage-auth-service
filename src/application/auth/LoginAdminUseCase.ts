import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../shared/config/env.js';
import { InvalidCredentialsException } from '../../domain/user/exceptions/InvalidCredentialsException.js';
import type { UserGateway } from '../../adapters/outbound/database/UserGateway.js';

export type Command = {
  email: string;
  password: string;
};

export type Result = {
  token: string;
};

export class LoginAdminUseCase {
  constructor(private readonly gateway: UserGateway) {}

  async execute(command: Command): Promise<Result> {
    const user = await this.gateway.findByEmail(command.email);
    if (!user) throw new InvalidCredentialsException();

    const passwordMatches = await bcrypt.compare(command.password, user.passwordHash);
    if (!passwordMatches) throw new InvalidCredentialsException();

    const token = jwt.sign(
      { sub: user.id, role: user.role, iss: env.apiGatewayIssuerUrl, aud: env.jwt.audience },
      env.jwt.privateKey,
      { algorithm: 'RS256', expiresIn: env.jwt.expiresIn } as jwt.SignOptions,
    );

    return { token };
  }
}
