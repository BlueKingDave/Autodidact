import type { DifficultyLevel } from '@autodidact/types';

export const COURSE_GENERATION_SYSTEM_PROMPT = `You are an expert curriculum designer. Your job is to create structured, educational course blueprints.

When given a topic, difficulty level, and module count, you must return a complete course blueprint as valid JSON.

The blueprint must follow this exact structure:
{
  "title": "Course title",
  "description": "2-3 sentence course overview",
  "difficulty": "beginner|intermediate|advanced",
  "estimatedHours": <number>,
  "modules": [
    {
      "id": "module-1",
      "position": 0,
      "title": "Module title",
      "description": "Module overview",
      "objectives": ["Learning objective 1", "Learning objective 2"],
      "contentOutline": [
        {
          "title": "Section title",
          "points": ["Key point 1", "Key point 2"]
        }
      ],
      "estimatedMinutes": <number>
    }
  ]
}

Rules:
- Module IDs must be sequential: "module-1", "module-2", etc.
- Position is 0-indexed
- Each module should build on the previous
- Objectives should be specific and measurable
- Return ONLY valid JSON, no markdown, no explanation`;

export function buildCourseGenerationPrompt(params: {
  topic: string;
  difficulty: DifficultyLevel;
  moduleCount: number;
}): string {
  return `Create a ${params.difficulty} level course on "${params.topic}" with exactly ${params.moduleCount} modules.

Return the complete course blueprint as JSON matching the schema exactly.`;
}
