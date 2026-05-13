import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg(process.env['DATABASE_URL']!);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const email = process.env['SEED_ADMIN_EMAIL'] ?? 'admin@soat.com';
  const password = process.env['SEED_ADMIN_PASSWORD'] ?? 'admin123';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] admin already exists (${email}), skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { fullname: 'Administrador', email, passwordHash, role: 'ADMIN' },
  });
  console.log(`[seed] admin created: ${email}`);
}

main()
  .catch((err) => { console.error('[seed] error:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
