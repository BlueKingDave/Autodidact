import pino from 'pino';

export function createLogger(service: string) {
  const isDev = process.env['NODE_ENV'] !== 'production';

  return pino({
    name: service,
    level: process.env['LOG_LEVEL'] || 'info',
    ...(isDev
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:standard' },
          },
        }
      : {}),
  });
}

export type Logger = ReturnType<typeof createLogger>;
