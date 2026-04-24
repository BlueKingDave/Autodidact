import type { ChatMessage, ModuleBlueprint } from '@autodidact/types';

export interface CompletionEvaluation {
  completed: boolean;
  score: number;
  feedback: string;
}

export function buildCompletionEvaluatorPrompt(
  module: ModuleBlueprint,
  messages: ChatMessage[],
): string {
  const transcript = messages
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const objectives = module.objectives.map((o) => `- ${o}`).join('\n');

  return `You are evaluating whether a learner has successfully completed a learning module.

## Module: ${module.title}
## Objectives:
${objectives}

## Conversation Transcript:
${transcript}

## Your Task
Evaluate whether the learner demonstrated sufficient understanding of the module objectives based on the conversation.

Respond with a JSON object:
{
  "completed": <true|false>,
  "score": <0-100>,
  "feedback": "Brief feedback for the learner (1-2 sentences)"
}

Scoring guide:
- 90-100: Excellent, clear mastery demonstrated
- 75-89: Good understanding with minor gaps
- 60-74: Basic understanding, could benefit from review
- 0-59: Insufficient engagement or understanding

Only mark completed=true if score >= 60.`;
}
