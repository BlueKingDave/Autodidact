import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module.js';
import { CoursesModule } from './modules/courses/courses.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { ProgressModule } from './modules/progress/progress.module.js';
import { HealthController } from './modules/health/health.controller.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';
import { createQueueProvider } from '@autodidact/providers';
import { QUEUE_PROVIDER_TOKEN } from './providers.token.js';

@Module({
  imports: [AuthModule, CoursesModule, ChatModule, ProgressModule],
  controllers: [HealthController],
  providers: [
    {
      provide: QUEUE_PROVIDER_TOKEN,
      useFactory: async () => createQueueProvider(),
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  exports: [QUEUE_PROVIDER_TOKEN],
})
export class AppModule {}
