import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { customType } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const courseStatusEnum = pgEnum('course_status', [
  'pending',
  'generating',
  'ready',
  'failed',
]);

export const difficultyEnum = pgEnum('difficulty_level', [
  'beginner',
  'intermediate',
  'advanced',
]);

// pgvector custom type
const vector = customType<{ data: number[]; driverData: string }>({
  dataType(config) {
    const dims = (config as { dimensions?: number })?.dimensions ?? 1536;
    return `vector(${dims})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return value
      .replace('[', '')
      .replace(']', '')
      .split(',')
      .map(Number);
  },
});

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  topic: text('topic').notNull(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  difficulty: difficultyEnum('difficulty').notNull().default('beginner'),
  estimatedHours: integer('estimated_hours'),
  status: courseStatusEnum('status').notNull().default('pending'),
  blueprint: jsonb('blueprint'),
  topicEmbedding: vector('topic_embedding', { dimensions: 1536 }),
  isPublic: boolean('is_public').notNull().default(true),
  generatedBy: uuid('generated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
