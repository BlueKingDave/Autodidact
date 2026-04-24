import { ChatAnthropic } from '@langchain/anthropic';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { ILLMProvider } from '../../interfaces/llm.js';

export class AnthropicLLMProvider implements ILLMProvider {
  private readonly model: ChatAnthropic;

  constructor(config: { apiKey: string; model?: string; temperature?: number }) {
    this.model = new ChatAnthropic({
      apiKey: config.apiKey,
      model: config.model ?? 'claude-opus-4-7',
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
