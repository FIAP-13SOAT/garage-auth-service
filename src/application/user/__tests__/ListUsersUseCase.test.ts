import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListUsersUseCase } from '../ListUsersUseCase.js';
import { User } from '../../../domain/user/User.js';
import { UserRole } from '../../../domain/user/UserRole.js';
import { newUUID } from '../../../shared/types/UUID.js';
import type { UserGateway } from '../../../adapters/outbound/database/UserGateway.js';

const makeUsers = () => [
  new User({ id: newUUID(), fullname: 'Alice', email: 'alice@example.com', passwordHash: 'h', role: UserRole.ADMIN }),
  new User({ id: newUUID(), fullname: 'Bob', email: 'bob@example.com', passwordHash: 'h', role: UserRole.MECHANIC }),
];

const makeGateway = (users: User[] = makeUsers()): UserGateway => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findAll: vi.fn().mockResolvedValue(users),
  update: vi.fn(),
  delete: vi.fn(),
});

describe('ListUsersUseCase', () => {
  let gateway: UserGateway;
  let useCase: ListUsersUseCase;

  beforeEach(() => {
    gateway = makeGateway();
    useCase = new ListUsersUseCase(gateway);
  });

  it('should return all users', async () => {
    const users = await useCase.execute();
    expect(users).toHaveLength(2);
    expect(gateway.findAll).toHaveBeenCalledOnce();
  });

  it('should return empty list when no users exist', async () => {
    gateway = makeGateway([]);
    useCase = new ListUsersUseCase(gateway);
    const users = await useCase.execute();
    expect(users).toHaveLength(0);
  });
});
