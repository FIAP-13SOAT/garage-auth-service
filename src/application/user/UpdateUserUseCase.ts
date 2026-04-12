import { UserRole } from '../../domain/user/UserRole.js';
import { EmailAlreadyInUseException } from '../../domain/user/exceptions/EmailAlreadyInUseException.js';
import { UserNotFoundException } from '../../domain/user/exceptions/UserNotFoundException.js';
import type { UUID } from '../../shared/types/UUID.js';
import type { UserGateway } from '../../adapters/outbound/database/UserGateway.js';
import type { User } from '../../domain/user/User.js';

export type Command = {
  id: UUID;
  fullname?: string;
  email?: string;
  role?: UserRole;
};

export class UpdateUserUseCase {
  constructor(private readonly gateway: UserGateway) {}

  async execute(command: Command): Promise<User> {
    const user = await this.gateway.findById(command.id);
    if (!user) {
      throw new UserNotFoundException(command.id);
    }

    if (command.email && command.email !== user.email) {
      const taken = await this.gateway.findByEmail(command.email);
      if (taken) {
        throw new EmailAlreadyInUseException(command.email);
      }
    }

    user.update({ fullname: command.fullname, email: command.email, role: command.role });
    await this.gateway.update(user);
    return user;
  }
}
