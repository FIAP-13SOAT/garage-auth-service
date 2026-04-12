import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateUserUseCase } from '../CreateUserUseCase.js';
import { UserRole } from '../../../domain/user/UserRole.js';
import { EmailAlreadyInUseException } from '../../../domain/user/exceptions/EmailAlreadyInUseException.js';
import type { UserGateway } from '../../../adapters/outbound/database/UserGateway.js';

vi.mock('bcrypt', () => ({
  default: { hash: vi.fn().mockResolvedValue('$2b$10$hashed') },
}));

const makeGateway = (): UserGateway => ({
  create: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(null),
  findByEmail: vi.fn().mockResolvedValue(null),
  findAll: vi.fn().mockResolvedValue([]),
  update: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
});

const command = {
  fullname: 'Maria Souza',
  email: 'maria@example.com',
  password: 'secret123',
  role: UserRole.CLERK,
};

describe('CreateUserUseCase', () => {
  let gateway: UserGateway;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    gateway = makeGateway();
    useCase = new CreateUserUseCase(gateway);
  });

  it('should create a user and return it', async () => {
    const user = await useCase.execute(command);
    expect(user.fullname).toBe('Maria Souza');
    expect(user.email).toBe('maria@example.com');
    expect(user.role).toBe(UserRole.CLERK);
    expect(user.id).toBeDefined();
    expect(gateway.create).toHaveBeenCalledOnce();
  });

  it('should hash the password before saving', async () => {
    const user = await useCase.execute(command);
    expect(user.passwordHash).toBe('$2b$10$hashed');
    expect(user.passwordHash).not.toBe(command.password);
  });

  it('should throw EmailAlreadyInUseException if email is taken', async () => {
    vi.mocked(gateway.findByEmail).mockResolvedValue({} as never);
    await expect(useCase.execute(command)).rejects.toThrow(EmailAlreadyInUseException);
    expect(gateway.create).not.toHaveBeenCalled();
  });

  it('should check email uniqueness before creating', async () => {
    await useCase.execute(command);
    expect(gateway.findByEmail).toHaveBeenCalledWith(command.email);
  });
});
