import type { ModuleStatus } from './course.js';

export interface UserProfile {
  id: string;
  supabaseId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface ModuleProgressEntry {
  moduleId: string;
  moduleTitle: string;
  position: number;
  status: ModuleStatus;
  completionScore: number | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface UserProgress {
  courseId: string;
  enrolledAt: string;
  completedAt: string | null;
  lastAccessedAt: string | null;
  modules: ModuleProgressEntry[];
  completedCount: number;
  totalCount: number;
}

export interface AuthUser {
  id: string;
  supabaseId: string;
  email: string;
}
