import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { courses } from './courses.js';
import { moduleStatusEnum } from './enums.js';
import type { ContentSection } from '@autodidact/types';

export const modules = pgTable('modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  objectives: jsonb('objectives').notNull().$type<string[]>(),
  contentOutline: jsonb('content_outline').notNull().$type<ContentSection[]>(),
  estimatedMinutes: integer('estimated_minutes').notNull(),
  status: moduleStatusEnum('status').notNull().default('locked'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
