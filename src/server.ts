import 'dotenv/config';
import './instrument.js';
import { env } from './shared/config/env.js';
import app from './app.js';
import { connectDatabase, disconnectDatabase, prisma } from './adapters/outbound/database/connection.js';
import { getRabbitMQChannel, closeRabbitMQ } from './adapters/outbound/messaging/rabbitmq.js';
import { CustomerCredentialsGateway } from './adapters/outbound/database/CustomerCredentialsGateway.js';
import { UpsertCustomerCredentialsUseCase } from './application/customerCredentials/UpsertCustomerCredentialsUseCase.js';
import { DeleteCustomerCredentialsUseCase } from './application/customerCredentials/DeleteCustomerCredentialsUseCase.js';
import { CustomerEventsConsumer } from './adapters/inbound/messaging/CustomerEventsConsumer.js';
import { Logger } from './shared/logger/Logger.js';

const startConsumers = async (): Promise<void> => {
  const channel = await getRabbitMQChannel();
  const gateway = new CustomerCredentialsGateway(prisma);
  const consumer = new CustomerEventsConsumer(
    channel,
    new UpsertCustomerCredentialsUseCase(gateway),
    new DeleteCustomerCredentialsUseCase(gateway),
  );
  await consumer.start();
};

const start = async (): Promise<void> => {
  await connectDatabase();

  await startConsumers();

  const server = app.listen(env.port, () => {
    Logger.info('server.listening', { port: env.port });
  });

  const shutdown = async (): Promise<void> => {
    server.close();
    await closeRabbitMQ();
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
