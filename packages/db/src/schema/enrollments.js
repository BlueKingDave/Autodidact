"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollments = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_js_1 = require("./users.js");
const courses_js_1 = require("./courses.js");
exports.enrollments = (0, pg_core_1.pgTable)('enrollments', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_js_1.users.id),
    courseId: (0, pg_core_1.uuid)('course_id')
        .notNull()
        .references(() => courses_js_1.courses.id),
    enrolledAt: (0, pg_core_1.timestamp)('enrolled_at').defaultNow().notNull(),
    completedAt: (0, pg_core_1.timestamp)('completed_at'),
    lastAccessedAt: (0, pg_core_1.timestamp)('last_accessed_at').defaultNow(),
}, (t) => [(0, pg_core_1.uniqueIndex)('enrollments_user_course_idx').on(t.userId, t.courseId)]);
//# sourceMappingURL=enrollments.js.map