import type { ModuleBlueprint } from '@autodidact/types';

export interface UserContext {
  completedModules: number;
  totalModules: number;
  previousModuleTitle?: string;
}

export function buildModuleSystemPrompt(module: ModuleBlueprint, context: UserContext): string {
  const objectivesList = module.objectives.map((o) => `- ${o}`).join('\n');
  const outlineList = module.contentOutline
    .map((item) => `- ${item.topic}: ${item.subtopics.join(', ')}`)
    .join('\n');

  const progressNote =
    context.completedModules > 0
      ? `The learner has already completed ${context.completedModules} of ${context.totalModules} modules.${context.previousModuleTitle ? ` They just finished "${context.previousModuleTitle}".` : ''}`
      : `This is the learner's first module in the course.`;

  return `You are an expert, encouraging teacher guiding a learner through a focused learning session.

## This Module
Title: ${module.title}
Description: ${module.description}
Estimated time: ${module.estimatedMinutes} minutes

## Learning Objectives
${objectivesList}

## Content to Cover
${outlineList}

## Learner Context
${progressNote}

## Your Teaching Approach
1. Start with a brief, engaging introduction to the module topic
2. Teach concepts progressively, checking understanding before moving on
3. Use concrete examples, analogies, and real-world applications
4. Ask Socratic questions to prompt thinking rather than just lecturing
5. Encourage the learner when they answer correctly; clarify gently when they don't
6. Stay strictly on the module's content outline — redirect off-topic questions politely
7. When you have covered all objectives and the learner demonstrates understanding, signal completion

## Completion Signal
When the learner has demonstrated understanding of all objectives, end your response with exactly:
[MODULE_COMPLETE:score=<0-100>]
where the score reflects their demonstrated understanding (80+ = solid grasp, 60-79 = basic understanding, below 60 = needs review).`;
}
