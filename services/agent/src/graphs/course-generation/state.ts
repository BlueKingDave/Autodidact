import { Annotation } from '@langchain/langgraph';
import type { CourseBlueprint, DifficultyLevel } from '@autodidact/types';

export const CourseGenerationState = Annotation.Root({
  topic: Annotation<string>(),
  difficulty: Annotation<DifficultyLevel>(),
  moduleCount: Annotation<number>(),
  rawResponse: Annotation<string | null>(),
  blueprint: Annotation<CourseBlueprint | null>(),
  validationErrors: Annotation<string[]>(),
  retryCount: Annotation<number>(),
  error: Annotation<string | null>(),
});

export type CourseGenerationStateType = typeof CourseGenerationState.State;
