"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moduleProgress = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_js_1 = require("./users.js");
const modules_js_1 = require("./modules.js");
const courses_js_1 = require("./courses.js");
const enums_js_1 = require("./enums.js");
exports.moduleProgress = (0, pg_core_1.pgTable)('module_progress', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_js_1.users.id),
    moduleId: (0, pg_core_1.uuid)('module_id')
        .notNull()
        .references(() => modules_js_1.modules.id),
    courseId: (0, pg_core_1.uuid)('course_id')
        .notNull()
        .references(() => courses_js_1.courses.id),
    status: (0, enums_js_1.moduleStatusEnum)('status').notNull().default('locked'),
    startedAt: (0, pg_core_1.timestamp)('started_at'),
    completedAt: (0, pg_core_1.timestamp)('completed_at'),
    chatSessionId: (0, pg_core_1.uuid)('chat_session_id'),
    completionScore: (0, pg_core_1.integer)('completion_score'),
}, (t) => [(0, pg_core_1.uniqueIndex)('module_progress_user_module_idx').on(t.userId, t.moduleId)]);
//# sourceMappingURL=module_progress.js.map