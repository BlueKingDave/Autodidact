import type { DifficultyLevel } from './course.js';
export interface CourseGenerationJobData {
    courseId: string;
    userId: string;
    topic: string;
    difficulty: DifficultyLevel;
    moduleCount: number;
}
export interface EmbeddingJobData {
    courseId: string;
    topic: string;
}
//# sourceMappingURL=jobs.d.ts.map