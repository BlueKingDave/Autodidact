export type CourseStatus = 'pending' | 'generating' | 'ready' | 'failed';
export type ModuleStatus = 'locked' | 'available' | 'in_progress' | 'completed';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type JobStatus = 'pending' | 'active' | 'completed' | 'failed' | 'delayed';
export interface ContentSection {
    title: string;
    points: string[];
}
export interface ModuleBlueprint {
    id: string;
    position: number;
    title: string;
    description: string;
    objectives: string[];
    contentOutline: ContentSection[];
    estimatedMinutes: number;
}
export interface CourseBlueprint {
    title: string;
    description: string;
    difficulty: DifficultyLevel;
    estimatedHours: number;
    modules: ModuleBlueprint[];
}
//# sourceMappingURL=course.d.ts.map