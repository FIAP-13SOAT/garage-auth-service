import type { PrismaClient } from '@prisma/client';
import { User } from '../../../domain/user/User.js';
import { UserRole } from '../../../domain/user/UserRole.js';
import { toUUID } from '../../../shared/types/UUID.js';
import type { UUID } from '../../../shared/types/UUID.js';

export interface UserGateway {
  create(user: User): Promise<void>;
  findById(id: UUID): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(user: User): Promise<void>;
  delete(id: UUID): Promise<void>;
}

function toDomain(row: {
  id: string;
  fullname: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
}): User {
  return new User({
    id: toUUID(row.id),
    fullname: row.fullname,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role as UserRole,
    createdAt: row.createdAt,
  });
}

export class UserGatewayImpl implements UserGateway {
  constructor(private readonly prisma: PrismaClient) {}

  async create(user: User): Promise<void> {
    await this.prisma.user.create({
      data: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
      },
    });
  }

  async findById(id: UUID): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? toDomain(row) : null;
  }

  async findAll(): Promise<User[]> {
    const rows = await this.prisma.user.findMany({ orderBy: { fullname: 'asc' } });
    return rows.map(toDomain);
  }

  async update(user: User): Promise<void> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { fullname: user.fullname, email: user.email, role: user.role },
    });
  }

  async delete(id: UUID): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
