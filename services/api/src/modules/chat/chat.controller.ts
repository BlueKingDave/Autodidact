import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Sse,
  MessageEvent,
  Header,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { ChatService } from './chat.service.js';
import { SendMessageSchema, CreateSessionSchema } from '@autodidact/schemas';
import type { SendMessage, CreateSession } from '@autodidact/schemas';
import type { AuthUser } from '@autodidact/types';

@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  private readonly agentUrl: string;

  constructor(private readonly chatService: ChatService) {
    this.agentUrl = process.env['AGENT_SERVICE_URL'] ?? 'http://localhost:3001';
  }

  @Post('sessions')
  createSession(@Body(new ZodValidationPipe(CreateSessionSchema)) dto: CreateSession, @CurrentUser() user: AuthUser) {
    return this.chatService.createSession(user.id, dto.moduleId, dto.courseId);
  }

  @Get('sessions/:id')
  getSession(@Param('id') id: string) {
    return this.chatService.getSession(id);
  }

  @Sse('sessions/:id/stream')
  @Header('Cache-Control', 'no-cache')
  @Header('X-Accel-Buffering', 'no')
  stream(
    @Param('id') sessionId: string,
    @Body(new ZodValidationPipe(SendMessageSchema)) dto: SendMessage,
    @CurrentUser() user: AuthUser,
  ): Observable<MessageEvent> {
    return this.chatService.streamMessage(sessionId, user.id, dto.content, this.agentUrl);
  }
}
