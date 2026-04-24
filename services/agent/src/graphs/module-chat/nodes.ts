import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { buildModuleSystemPrompt, COMPLETION_EVALUATOR_SYSTEM_PROMPT, buildCompletionEvaluatorPrompt } from '@autodidact/prompts';
import type { ILLMProvider } from '@autodidact/providers';
import type { ModuleChatStateType } from './state.js';

export function makeTeacherNode(llmProvider: ILLMProvider) {
  return async (state: ModuleChatStateType): Promise<Partial<ModuleChatStateType>> => {
    const model = llmProvider.getModel();
    const systemPrompt = buildModuleSystemPrompt(state.moduleBlueprint, state.courseProgress);

    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      ...state.messages,
    ]);

    const content = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    // Check for completion signal
    const completionMatch = content.match(/\[MODULE_COMPLETE:score=(\d+)\]/);
    if (completionMatch) {
      const score = parseInt(completionMatch[1] ?? '0', 10);
      const cleanContent = content.replace(/\[MODULE_COMPLETE:score=\d+\]/, '').trim();
      return {
        messages: [new AIMessage(cleanContent)],
        completionSignaled: true,
        completionScore: score,
        teachingPhase: 'evaluation',
      };
    }

    return {
      messages: [new AIMessage(content)],
      completionSignaled: false,
    };
  };
}

export function makeEvaluationNode(llmProvider: ILLMProvider) {
  return async (state: ModuleChatStateType): Promise<Partial<ModuleChatStateType>> => {
    const model = llmProvider.getModel();

    const response = await model.invoke([
      new SystemMessage(COMPLETION_EVALUATOR_SYSTEM_PROMPT),
      ...state.messages,
      new HumanMessage(
        buildCompletionEvaluatorPrompt(state.moduleBlueprint.objectives),
      ),
    ]);

    const content = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    try {
      const result = JSON.parse(content) as { completed: boolean; score: number; feedback: string };
      return { completionScore: result.score };
    } catch {
      return { completionScore: state.completionScore ?? 75 };
    }
  };
}
