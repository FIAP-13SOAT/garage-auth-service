import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteUserUseCase } from '../DeleteUserUseCase.js';
import { User } from '../../../domain/user/User.js';
import { UserRole } from '../../../domain/user/UserRole.js';
import { UserNotFoundException } from '../../../domain/user/exceptions/UserNotFoundException.js';
import { newUUID, toUUID } from '../../../shared/types/UUID.js';
import type { UserGateway } from '../../../adapters/outbound/database/UserGateway.js';

const existingUser = new User({
  id: toUUID('22222222-2222-2222-2222-222222222222'),
  fullname: 'Ana Costa',
  email: 'ana@example.com',
  passwordHash: '$2b$10$hash',
  role: UserRole.STOCK_KEEPER,
});

const makeGateway = (found: User | null = existingUser): UserGateway => ({
  create: vi.fn(),
  findById: vi.fn().mockResolvedValue(found),
  findByEmail: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  delete: vi.fn().mockResolvedValue(undefined),
});

describe('DeleteUserUseCase', () => {
  let gateway: UserGateway;
  let useCase: DeleteUserUseCase;

  beforeEach(() => {
    gateway = makeGateway();
    useCase = new DeleteUserUseCase(gateway);
  });

  it('should delete an existing user', async () => {
    await useCase.execute({ id: existingUser.id });
    expect(gateway.delete).toHaveBeenCalledWith(existingUser.id);
  });

  it('should throw UserNotFoundException when user does not exist', async () => {
    gateway = makeGateway(null);
    useCase = new DeleteUserUseCase(gateway);
    await expect(useCase.execute({ id: newUUID() })).rejects.toThrow(UserNotFoundException);
    expect(gateway.delete).not.toHaveBeenCalled();
  });

  it('should verify existence before deleting', async () => {
    const id = existingUser.id;
    await useCase.execute({ id });
    expect(gateway.findById).toHaveBeenCalledWith(id);
  });
});
