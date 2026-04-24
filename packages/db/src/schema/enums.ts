import { pgEnum } from 'drizzle-orm/pg-core';

export const courseStatusEnum = pgEnum('course_status', [
  'pending',
  'generating',
  'ready',
  'failed',
]);

export const moduleStatusEnum = pgEnum('module_status', [
  'locked',
  'available',
  'in_progress',
  'completed',
]);

export const difficultyEnum = pgEnum('difficulty_level', [
  'beginner',
  'intermediate',
  'advanced',
]);
