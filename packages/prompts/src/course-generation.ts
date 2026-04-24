import type { DifficultyLevel } from '@autodidact/types';

export const COURSE_BLUEPRINT_SYSTEM_PROMPT = `You are an expert curriculum designer and instructional designer.
Your task is to create a structured course blueprint for any topic requested.

The blueprint must be well-organized, pedagogically sound, and broken into clearly scoped modules.
Each module should have a single focused learning goal that can be fully covered in one conversation session.

Always respond with valid JSON matching the required schema exactly. No preamble, no markdown fences.`;

export function buildCourseGenerationPrompt(params: {
  topic: string;
  difficulty: DifficultyLevel;
  moduleCount: number;
}): string {
  return `Create a complete course blueprint for the following:

Topic: "${params.topic}"
Difficulty: ${params.difficulty}
Number of modules: ${params.moduleCount}

Return a JSON object with this exact structure:
{
  "title": "Course title",
  "description": "2-3 sentence overview of what learners will achieve",
  "difficulty": "${params.difficulty}",
  "estimatedHours": <number>,
  "modules": [
    {
      "position": 0,
      "title": "Module title",
      "description": "What this module covers",
      "objectives": ["Learner will be able to...", "..."],
      "contentOutline": [
        { "topic": "Main topic", "subtopics": ["subtopic 1", "subtopic 2"] }
      ],
      "estimatedMinutes": <number>
    }
  ]
}

Requirements:
- Modules must build on each other progressively
- Each module should take 15-45 minutes to complete
- objectives should use action verbs (explain, demonstrate, apply, analyze)
- contentOutline should give enough detail for an AI teacher to guide a focused session`;
}
