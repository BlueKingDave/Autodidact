import type { ModuleStatus } from './course.js';
export interface UserProfile {
    id: string;
    supabaseId: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    createdAt: string;
}
export interface AuthUser {
    id: string;
    supabaseId: string;
    email: string;
}
export interface ModuleProgressItem {
    moduleId: string;
    status: ModuleStatus;
    startedAt: string | null;
    completedAt: string | null;
    completionScore: number | null;
}
export interface UserProgress {
    courseId: string;
    enrolledAt: string;
    completedAt: string | null;
    modules: ModuleProgressItem[];
}
//# sourceMappingURL=user.d.ts.map