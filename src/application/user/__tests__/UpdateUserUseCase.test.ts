import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateUserUseCase } from '../UpdateUserUseCase.js';
import { User } from '../../../domain/user/User.js';
import { UserRole } from '../../../domain/user/UserRole.js';
import { UserNotFoundException } from '../../../domain/user/exceptions/UserNotFoundException.js';
import { EmailAlreadyInUseException } from '../../../domain/user/exceptions/EmailAlreadyInUseException.js';
import { newUUID, toUUID } from '../../../shared/types/UUID.js';
import type { UserGateway } from '../../../adapters/outbound/database/UserGateway.js';

const makeUser = () =>
  new User({
    id: toUUID('11111111-1111-1111-1111-111111111111'),
    fullname: 'Pedro Lima',
    email: 'pedro@example.com',
    passwordHash: '$2b$10$hash',
    role: UserRole.MECHANIC,
  });

const makeGateway = (existing: User | null = makeUser()): UserGateway => ({
  create: vi.fn(),
  findById: vi.fn().mockResolvedValue(existing),
  findByEmail: vi.fn().mockResolvedValue(null),
  findAll: vi.fn(),
  update: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn(),
});

describe('UpdateUserUseCase', () => {
  let gateway: UserGateway;
  let useCase: UpdateUserUseCase;

  beforeEach(() => {
    gateway = makeGateway();
    useCase = new UpdateUserUseCase(gateway);
  });

  it('should update fullname', async () => {
    const id = toUUID('11111111-1111-1111-1111-111111111111');
    const user = await useCase.execute({ id, fullname: 'Pedro Novo' });
    expect(user.fullname).toBe('Pedro Novo');
    expect(gateway.update).toHaveBeenCalledOnce();
  });

  it('should update role', async () => {
    const id = toUUID('11111111-1111-1111-1111-111111111111');
    const user = await useCase.execute({ id, role: UserRole.ADMIN });
    expect(user.role).toBe(UserRole.ADMIN);
  });

  it('should allow updating email to a free email', async () => {
    const id = toUUID('11111111-1111-1111-1111-111111111111');
    const user = await useCase.execute({ id, email: 'novo@example.com' });
    expect(user.email).toBe('novo@example.com');
    expect(gateway.findByEmail).toHaveBeenCalledWith('novo@example.com');
  });

  it('should skip email uniqueness check when email is unchanged', async () => {
    const id = toUUID('11111111-1111-1111-1111-111111111111');
    await useCase.execute({ id, email: 'pedro@example.com' });
    expect(gateway.findByEmail).not.toHaveBeenCalled();
  });

  it('should throw EmailAlreadyInUseException when new email is taken', async () => {
    vi.mocked(gateway.findByEmail).mockResolvedValue({} as never);
    const id = toUUID('11111111-1111-1111-1111-111111111111');
    await expect(useCase.execute({ id, email: 'taken@example.com' })).rejects.toThrow(EmailAlreadyInUseException);
    expect(gateway.update).not.toHaveBeenCalled();
  });

  it('should throw UserNotFoundException when user does not exist', async () => {
    gateway = makeGateway(null);
    useCase = new UpdateUserUseCase(gateway);
    await expect(useCase.execute({ id: newUUID() })).rejects.toThrow(UserNotFoundException);
  });
});
