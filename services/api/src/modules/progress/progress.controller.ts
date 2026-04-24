import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ProgressService } from './progress.service.js';
import type { AuthUser } from '@autodidact/types';

@Controller('progress')
@UseGuards(AuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get(':courseId')
  get(@Param('courseId') courseId: string, @CurrentUser() user: AuthUser) {
    return this.progressService.getUserProgress(user.id, courseId);
  }
}
