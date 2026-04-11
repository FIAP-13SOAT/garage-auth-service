import { UserNotFoundException } from '../../domain/user/exceptions/UserNotFoundException.js';
import type { UUID } from '../../shared/types/UUID.js';
import type { UserGateway } from '../../adapters/outbound/database/UserGateway.js';

export type Command = {
  id: UUID;
};

export class DeleteUserUseCase {
  constructor(private readonly gateway: UserGateway) {}

  async execute(command: Command): Promise<void> {
    const user = await this.gateway.findById(command.id);
    if (!user) {
      throw new UserNotFoundException(command.id);
    }
    await this.gateway.delete(command.id);
  }
}
