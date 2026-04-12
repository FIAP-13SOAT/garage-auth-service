export const env = {
  port: parseInt(process.env['PORT'] ?? '8083', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  databaseUrl: process.env['DATABASE_URL'] ?? '',
  rabbitmqUrl: process.env['RABBITMQ_URL'] ?? '',
  jwt: {
    privateKey: process.env['JWT_PRIVATE_KEY'] ?? '',
    publicKey: process.env['JWT_PUBLIC_KEY'] ?? '',
    expiresIn: process.env['JWT_EXPIRES_IN'] ?? '8h',
  },
  datadog: {
    service: process.env['DD_SERVICE'] ?? 'garage-auth-service',
    env: process.env['DD_ENV'] ?? 'development',
    version: process.env['DD_VERSION'] ?? '1.0.0',
    agentHost: process.env['DD_AGENT_HOST'] ?? 'localhost',
    traceEnabled: process.env['DD_TRACE_ENABLED'] !== 'false',
  },
};
