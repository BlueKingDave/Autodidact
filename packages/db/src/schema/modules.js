"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modules = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const courses_js_1 = require("./courses.js");
const enums_js_1 = require("./enums.js");
exports.modules = (0, pg_core_1.pgTable)('modules', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    courseId: (0, pg_core_1.uuid)('course_id')
        .notNull()
        .references(() => courses_js_1.courses.id, { onDelete: 'cascade' }),
    position: (0, pg_core_1.integer)('position').notNull(),
    title: (0, pg_core_1.text)('title').notNull(),
    description: (0, pg_core_1.text)('description').notNull(),
    objectives: (0, pg_core_1.jsonb)('objectives').notNull().$type(),
    contentOutline: (0, pg_core_1.jsonb)('content_outline').notNull().$type(),
    estimatedMinutes: (0, pg_core_1.integer)('estimated_minutes').notNull(),
    status: (0, enums_js_1.moduleStatusEnum)('status').notNull().default('locked'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
//# sourceMappingURL=modules.js.map