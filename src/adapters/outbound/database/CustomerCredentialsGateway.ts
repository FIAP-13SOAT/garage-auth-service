import type { PrismaClient } from '@prisma/client';
import { CustomerCredentials } from '../../../domain/customerCredentials/CustomerCredentials.js';
import { toUUID } from '../../../shared/types/UUID.js';
import type { UUID } from '../../../shared/types/UUID.js';

export class CustomerCredentialsGateway {
  constructor(private readonly prisma: PrismaClient) {}

  async findByCpfCnpj(cpfCnpj: string): Promise<CustomerCredentials | null> {
    const row = await this.prisma.customerCredentials.findUnique({ where: { cpfCnpj } });
    if (!row) return null;
    return new CustomerCredentials({
      id: toUUID(row.id),
      customerId: toUUID(row.customerId),
      cpfCnpj: row.cpfCnpj,
      email: row.email,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async upsertByCustomerId(customerId: UUID, cpfCnpj: string, email?: string | null): Promise<void> {
    await this.prisma.customerCredentials.upsert({
      where: { customerId },
      create: { customerId, cpfCnpj, email: email ?? null },
      update: { cpfCnpj, email: email ?? null },
    });
  }

  async deleteByCustomerId(customerId: UUID): Promise<void> {
    await this.prisma.customerCredentials.deleteMany({ where: { customerId } });
  }
}
