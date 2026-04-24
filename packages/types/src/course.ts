export type CourseStatus = 'pending' | 'generating' | 'ready' | 'failed';
export type ModuleStatus = 'locked' | 'available' | 'in_progress' | 'completed';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LearningObjective {
  id: string;
  description: string;
}

export interface ModuleBlueprint {
  position: number;
  title: string;
  description: string;
  objectives: string[];
  contentOutline: ContentOutlineItem[];
  estimatedMinutes: number;
}

export interface ContentOutlineItem {
  topic: string;
  subtopics: string[];
}

export interface CourseBlueprint {
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  estimatedHours: number;
  modules: ModuleBlueprint[];
}
