import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { courses } from './courses.js';

export const moduleStatusEnum = pgEnum('module_status', [
  'locked',
  'available',
  'in_progress',
  'completed',
]);

export const modules = pgTable('modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  objectives: jsonb('objectives').notNull().$type<string[]>(),
  contentOutline: jsonb('content_outline').notNull().$type<Array<{ topic: string; subtopics: string[] }>>(),
  estimatedMinutes: integer('estimated_minutes').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Module = typeof modules.$inferSelect;
export type NewModule = typeof modules.$inferInsert;
