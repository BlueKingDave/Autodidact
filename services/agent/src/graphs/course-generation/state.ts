import { Annotation } from '@langchain/langgraph';
import type { DifficultyLevel, CourseBlueprint } from '@autodidact/types';

export const CourseGenerationState = Annotation.Root({
  topic: Annotation<string>(),
  difficulty: Annotation<DifficultyLevel>(),
  moduleCount: Annotation<number>(),
  blueprint: Annotation<CourseBlueprint | null>(),
  retryCount: Annotation<number>(),
  error: Annotation<string | null>(),
});

export type CourseGenerationStateType = typeof CourseGenerationState.State;
