import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { buildModuleSystemPrompt } from '@autodidact/prompts';
import type { ILLMProvider } from '@autodidact/providers';
import type { ModuleChatStateType } from './state.js';

const COMPLETION_REGEX = /\[MODULE_COMPLETE:score=(\d+)\]/;

export function makeTeacherNode(llm: ILLMProvider) {
  return async (state: ModuleChatStateType): Promise<Partial<ModuleChatStateType>> => {
    const systemPrompt = buildModuleSystemPrompt(state.moduleBlueprint, {
      completedModules: 0,
      totalModules: 1,
    });

    const systemMessage = new SystemMessage(systemPrompt);
    const allMessages = [systemMessage, ...state.messages];

    const lcMessages = allMessages.map((m) => {
      if (m._getType() === 'system') return new SystemMessage(m.content as string);
      if (m._getType() === 'human') return new HumanMessage(m.content as string);
      return new AIMessage(m.content as string);
    });

    let fullResponse = '';
    for await (const token of llm.chat(
      lcMessages.map((m) => ({
        role: m._getType() === 'system'
          ? 'system'
          : m._getType() === 'human'
          ? 'user'
          : 'assistant',
        content: m.content as string,
      })),
    )) {
      fullResponse += token;
    }

    const completionMatch = COMPLETION_REGEX.exec(fullResponse);
    const cleanResponse = fullResponse.replace(COMPLETION_REGEX, '').trim();

    if (completionMatch) {
      const score = parseInt(completionMatch[1]!, 10);
      return {
        messages: [new AIMessage(cleanResponse)],
        completionSignaled: true,
        completionScore: score,
      };
    }

    return {
      messages: [new AIMessage(cleanResponse)],
    };
  };
}
