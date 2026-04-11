import './instrument.js';
import 'dotenv/config';
import { env } from './shared/config/env.js';
import app from './app.js';
import { connectDatabase, disconnectDatabase } from './adapters/outbound/database/connection.js';

const start = async (): Promise<void> => {
  await connectDatabase();

  const server = app.listen(env.port, () => {
    console.warn(`garage-auth-service running on port ${env.port}`);
  });

  const shutdown = async (): Promise<void> => {
    server.close();
    await disconnectDatabase();
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
