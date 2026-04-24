"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.difficultyEnum = exports.moduleStatusEnum = exports.courseStatusEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.courseStatusEnum = (0, pg_core_1.pgEnum)('course_status', [
    'pending',
    'generating',
    'ready',
    'failed',
]);
exports.moduleStatusEnum = (0, pg_core_1.pgEnum)('module_status', [
    'locked',
    'available',
    'in_progress',
    'completed',
]);
exports.difficultyEnum = (0, pg_core_1.pgEnum)('difficulty_level', [
    'beginner',
    'intermediate',
    'advanced',
]);
//# sourceMappingURL=enums.js.map