import { ChatOpenAI } from '@langchain/openai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { ILLMProvider } from '../../interfaces/llm.js';

export class OpenAILLMProvider implements ILLMProvider {
  private readonly model: ChatOpenAI;

  constructor(config: { apiKey: string; model?: string; temperature?: number }) {
    this.model = new ChatOpenAI({
      apiKey: config.apiKey,
      model: config.model ?? 'gpt-4o',
      temperature: config.temperature ?? 0.7,
    });
  }

  getModel(): BaseChatModel {
    return this.model as BaseChatModel;
  }

  getModelName(): string {
    return this.model.model;
  }
}
