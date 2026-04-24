import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { createLogger, initTracer } from '@autodidact/observability';

const logger = createLogger('api');
const PORT = parseInt(process.env['API_PORT'] ?? '3000', 10);

async function bootstrap() {
  initTracer('autodidact-api');

  const app = await NestFactory.create(AppModule, { logger: false });
  app.enableCors({ origin: '*' });
  app.setGlobalPrefix('v1');

  await app.listen(PORT, '0.0.0.0');
  logger.info({ port: PORT }, 'API service started');
}

bootstrap().catch((err: unknown) => {
  logger.error(err, 'API service failed to start');
  process.exit(1);
});
