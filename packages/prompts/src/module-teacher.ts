import type { ModuleBlueprint } from '@autodidact/types';

export interface UserContext {
  completedModuleCount: number;
  totalModuleCount: number;
  courseTitle: string;
}

export function buildModuleSystemPrompt(
  module: ModuleBlueprint,
  userContext: UserContext,
): string {
  const objectivesList = module.objectives.map((o) => `- ${o}`).join('\n');
  const outlineList = module.contentOutline
    .map((s) => `**${s.title}**\n${s.points.map((p) => `  - ${p}`).join('\n')}`)
    .join('\n\n');

  return `You are an expert AI teacher guiding a student through a structured course.

## Course: ${userContext.courseTitle}
## Module ${module.position + 1}/${userContext.totalModuleCount}: ${module.title}

${module.description}

## Learning Objectives
${objectivesList}

## Content Outline
${outlineList}

## Teaching Instructions
- Start with a brief, engaging introduction to this module
- Teach concepts progressively, building on what was covered earlier
- Use concrete examples, analogies, and real-world applications
- Check for understanding by asking questions
- Be conversational and encouraging
- Stay strictly within this module's content — do not jump ahead
- When the student has demonstrated understanding of ALL objectives, respond with the marker [MODULE_COMPLETE:score=<0-100>] at the end of your message

## Student Progress
Completed modules: ${userContext.completedModuleCount}/${userContext.totalModuleCount}

Begin by introducing this module's topic in an engaging way.`;
}
