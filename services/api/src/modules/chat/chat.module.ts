import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { ProgressModule } from '../progress/progress.module.js';

@Module({
  imports: [ProgressModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
