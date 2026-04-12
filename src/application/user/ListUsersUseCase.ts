import type { User } from '../../domain/user/User.js';
import type { UserGateway } from '../../adapters/outbound/database/UserGateway.js';

export class ListUsersUseCase {
  constructor(private readonly gateway: UserGateway) {}

  async execute(): Promise<User[]> {
    return this.gateway.findAll();
  }
}
