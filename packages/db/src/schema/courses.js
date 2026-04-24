"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courses = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const enums_js_1 = require("./enums.js");
const users_js_1 = require("./users.js");
const vector_js_1 = require("../vector.js");
exports.courses = (0, pg_core_1.pgTable)('courses', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    topic: (0, pg_core_1.text)('topic').notNull(),
    slug: (0, pg_core_1.text)('slug').notNull(),
    title: (0, pg_core_1.text)('title').notNull(),
    description: (0, pg_core_1.text)('description').notNull(),
    difficulty: (0, enums_js_1.difficultyEnum)('difficulty').notNull().default('beginner'),
    estimatedHours: (0, pg_core_1.integer)('estimated_hours'),
    status: (0, enums_js_1.courseStatusEnum)('status').notNull().default('pending'),
    blueprint: (0, pg_core_1.jsonb)('blueprint').$type(),
    topicEmbedding: (0, vector_js_1.vector)('topic_embedding', { dimensions: 1536 }),
    isPublic: (0, pg_core_1.boolean)('is_public').notNull().default(true),
    generatedBy: (0, pg_core_1.uuid)('generated_by').references(() => users_js_1.users.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
//# sourceMappingURL=courses.js.map