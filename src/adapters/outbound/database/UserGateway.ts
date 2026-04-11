import type { UUID } from '../../../shared/types/UUID.js';
import type { User } from '../../../domain/user/User.js';

export interface UserGateway {
  create(user: User): Promise<void>;
  findById(id: UUID): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(user: User): Promise<void>;
  delete(id: UUID): Promise<void>;
}
