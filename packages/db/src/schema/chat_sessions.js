"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatSessions = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_js_1 = require("./users.js");
const modules_js_1 = require("./modules.js");
exports.chatSessions = (0, pg_core_1.pgTable)('chat_sessions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_js_1.users.id),
    moduleId: (0, pg_core_1.uuid)('module_id')
        .notNull()
        .references(() => modules_js_1.modules.id),
    messages: (0, pg_core_1.jsonb)('messages').notNull().default('[]').$type(),
    threadId: (0, pg_core_1.text)('thread_id'),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
//# sourceMappingURL=chat_sessions.js.map