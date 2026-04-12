import bcrypt from 'bcrypt';
import { User } from '../../domain/user/User.js';
import { UserRole } from '../../domain/user/UserRole.js';
import { EmailAlreadyInUseException } from '../../domain/user/exceptions/EmailAlreadyInUseException.js';
import { newUUID } from '../../shared/types/UUID.js';
import type { UserGateway } from '../../adapters/outbound/database/UserGateway.js';

export type Command = {
  fullname: string;
  email: string;
  password: string;
  role: UserRole;
};

export class CreateUserUseCase {
  constructor(private readonly gateway: UserGateway) {}

  async execute(command: Command): Promise<User> {
    const existing = await this.gateway.findByEmail(command.email);
    if (existing) {
      throw new EmailAlreadyInUseException(command.email);
    }

    const passwordHash = await bcrypt.hash(command.password, 10);

    const user = new User({
      id: newUUID(),
      fullname: command.fullname,
      email: command.email,
      passwordHash,
      role: command.role,
    });

    await this.gateway.create(user);
    return user;
  }
}
