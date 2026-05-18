import 'dotenv/config';
import './instrument.js';
import bcrypt from 'bcrypt';
import { env } from './shared/config/env.js';
import app from './app.js';
import { connectDatabase, disconnectDatabase, prisma } from './adapters/outbound/database/connection.js';
import { SQSBroker, sqsClient } from './adapters/outbound/messaging/SQSBroker.js';
import { CustomerCredentialsGateway } from './adapters/outbound/database/CustomerCredentialsGateway.js';
import { UpsertCustomerCredentialsUseCase } from './application/customerCredentials/UpsertCustomerCredentialsUseCase.js';
import { DeleteCustomerCredentialsUseCase } from './application/customerCredentials/DeleteCustomerCredentialsUseCase.js';
import { CustomerEventsConsumer } from './adapters/inbound/messaging/CustomerEventsConsumer.js';
import { Logger } from './shared/logger/Logger.js';

const seedAdmin = async (): Promise<void> => {
  const { adminEmail, adminPassword, adminFullname } = env.seed;
  if (!adminEmail || !adminPassword) return;
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) return;
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.create({ data: { fullname: adminFullname, email: adminEmail, passwordHash, role: 'ADMIN' } });
  Logger.info('seed.admin_created', { email: adminEmail });
};

const start = async (): Promise<void> => {
  await connectDatabase();
  await seedAdmin();

  const broker = new SQSBroker(sqsClient);
  const gateway = new CustomerCredentialsGateway(prisma);
  await new CustomerEventsConsumer(
    broker,
    new UpsertCustomerCredentialsUseCase(gateway),
    new DeleteCustomerCredentialsUseCase(gateway),
  ).start();

  const server = app.listen(env.port, () => {
    Logger.info('server.listening', { port: env.port });
  });

  const shutdown = async (): Promise<void> => {
    broker.stop();
    server.close();
    await disconnectDatabase();
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
};

start().catch((err) => {
  Logger.error('server.start_failed', {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
