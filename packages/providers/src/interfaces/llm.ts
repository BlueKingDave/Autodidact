import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ILLMProvider {
  getModel(): BaseChatModel;
  getModelName(): string;
}
