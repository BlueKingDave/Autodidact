import { CourseBlueprintSchema } from '@autodidact/schemas';
import {
  COURSE_BLUEPRINT_SYSTEM_PROMPT,
  buildCourseGenerationPrompt,
} from '@autodidact/prompts';
import type { ILLMProvider } from '@autodidact/providers';
import type { CourseGenerationStateType } from './state.js';

export function makeGenerateBlueprintNode(llm: ILLMProvider) {
  return async (state: CourseGenerationStateType): Promise<Partial<CourseGenerationStateType>> => {
    const prompt = buildCourseGenerationPrompt({
      topic: state.topic,
      difficulty: state.difficulty,
      moduleCount: state.moduleCount,
    });

    const structured = llm.withStructuredOutput(CourseBlueprintSchema);
    try {
      const blueprint = await structured.invoke([
        { role: 'system', content: COURSE_BLUEPRINT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ]);
      return { blueprint, validationErrors: [], retryCount: state.retryCount };
    } catch (err) {
      // Fall back to raw text + manual parse on next node
      const raw = await llm.chatOnce([
        { role: 'system', content: COURSE_BLUEPRINT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ]);
      return { rawResponse: raw, blueprint: null, retryCount: state.retryCount + 1 };
    }
  };
}

export function makeValidateBlueprintNode(_llm: ILLMProvider) {
  return async (state: CourseGenerationStateType): Promise<Partial<CourseGenerationStateType>> => {
    if (state.blueprint) return {};

    if (!state.rawResponse) {
      return { error: 'No response from LLM', validationErrors: ['empty response'] };
    }

    // Extract JSON from raw response
    const jsonMatch = state.rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        validationErrors: ['Could not find JSON in response'],
        blueprint: null,
      };
    }

    const result = CourseBlueprintSchema.safeParse(JSON.parse(jsonMatch[0]));
    if (result.success) {
      return { blueprint: result.data, validationErrors: [] };
    }

    return {
      validationErrors: result.error.errors.map((e) => e.message),
      blueprint: null,
    };
  };
}
