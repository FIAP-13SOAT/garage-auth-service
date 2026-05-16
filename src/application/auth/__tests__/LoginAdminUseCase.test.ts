import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginAdminUseCase } from '../LoginAdminUseCase.js';
import { User } from '../../../domain/user/User.js';
import { UserRole } from '../../../domain/user/UserRole.js';
import { InvalidCredentialsException } from '../../../domain/user/exceptions/InvalidCredentialsException.js';
import type { UserGateway } from '../../../adapters/outbound/database/UserGateway.js';
import { newUUID } from '../../../shared/types/UUID.js';

vi.mock('bcrypt', () => ({
  default: { compare: vi.fn() },
}));

vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn().mockReturnValue('signed.jwt.token') },
}));

const makeGateway = (): UserGateway => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

const makeUser = (): User =>
  new User({
    id: newUUID(),
    fullname: 'Admin User',
    email: 'admin@example.com',
    passwordHash: '$2b$10$hashed',
    role: UserRole.ADMIN,
  });

describe('LoginAdminUseCase', () => {
  let gateway: UserGateway;
  let useCase: LoginAdminUseCase;

  beforeEach(async () => {
    vi.clearAllMocks();
    const bcrypt = (await import('bcrypt')).default;
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    gateway = makeGateway();
    useCase = new LoginAdminUseCase(gateway);
  });

  it('issues a JWT when credentials are valid', async () => {
    vi.mocked(gateway.findByEmail).mockResolvedValue(makeUser());

    const result = await useCase.execute({ email: 'admin@example.com', password: 'secret' });

    expect(result.token).toBe('signed.jwt.token');
    expect(gateway.findByEmail).toHaveBeenCalledWith('admin@example.com');
  });

  it('throws InvalidCredentialsException when user is not found', async () => {
    vi.mocked(gateway.findByEmail).mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'missing@example.com', password: 'x' }),
    ).rejects.toThrow(InvalidCredentialsException);
  });

  it('throws InvalidCredentialsException when password does not match', async () => {
    const bcrypt = (await import('bcrypt')).default;
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    vi.mocked(gateway.findByEmail).mockResolvedValue(makeUser());

    await expect(
      useCase.execute({ email: 'admin@example.com', password: 'wrong' }),
    ).rejects.toThrow(InvalidCredentialsException);
  });

  it('signs JWT with sub=userId and role from user', async () => {
    const user = makeUser();
    vi.mocked(gateway.findByEmail).mockResolvedValue(user);

    await useCase.execute({ email: 'admin@example.com', password: 'secret' });

    const jwt = (await import('jsonwebtoken')).default;
    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ sub: user.id, role: UserRole.ADMIN }),
      expect.any(String),
      expect.objectContaining({ algorithm: 'RS256' }),
    );
  });
});
