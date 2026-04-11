import { describe, it, expect } from 'vitest';
import { User } from '../User.js';
import { UserRole } from '../UserRole.js';
import { newUUID } from '../../../shared/types/UUID.js';

const makeUser = (overrides?: Partial<ConstructorParameters<typeof User>[0]>) =>
  new User({
    id: newUUID(),
    fullname: 'João Silva',
    email: 'joao@example.com',
    passwordHash: '$2b$10$hash',
    role: UserRole.MECHANIC,
    ...overrides,
  });

describe('User', () => {
  it('should create a user with given props', () => {
    const user = makeUser();
    expect(user.fullname).toBe('João Silva');
    expect(user.email).toBe('joao@example.com');
    expect(user.role).toBe(UserRole.MECHANIC);
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('should default createdAt to now when not provided', () => {
    const before = new Date();
    const user = makeUser();
    expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('should update fullname', () => {
    const user = makeUser();
    user.update({ fullname: 'Carlos Novo' });
    expect(user.fullname).toBe('Carlos Novo');
    expect(user.email).toBe('joao@example.com');
  });

  it('should update email', () => {
    const user = makeUser();
    user.update({ email: 'novo@example.com' });
    expect(user.email).toBe('novo@example.com');
  });

  it('should update role', () => {
    const user = makeUser();
    user.update({ role: UserRole.ADMIN });
    expect(user.role).toBe(UserRole.ADMIN);
  });

  it('should update multiple fields at once', () => {
    const user = makeUser();
    user.update({ fullname: 'Ana', email: 'ana@example.com', role: UserRole.CLERK });
    expect(user.fullname).toBe('Ana');
    expect(user.email).toBe('ana@example.com');
    expect(user.role).toBe(UserRole.CLERK);
  });

  it('should not change fields omitted from update', () => {
    const user = makeUser();
    const originalEmail = user.email;
    user.update({ fullname: 'Novo Nome' });
    expect(user.email).toBe(originalEmail);
  });

  it('should keep id and createdAt immutable after update', () => {
    const user = makeUser();
    const originalId = user.id;
    const originalCreatedAt = user.createdAt;
    user.update({ fullname: 'Alterado' });
    expect(user.id).toBe(originalId);
    expect(user.createdAt).toBe(originalCreatedAt);
  });
});
