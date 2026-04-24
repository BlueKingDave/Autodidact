import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import type { ZodSchema } from 'zod';
import type { ILLMProvider, IStructuredLLMProvider, LLMMessage, LLMOptions } from '../../interfaces/llm.js';

function toLC(messages: LLMMessage[]) {
  return messages.map((m) => {
    if (m.role === 'system') return new SystemMessage(m.content);
    if (m.role === 'user') return new HumanMessage(m.content);
    return new AIMessage(m.content);
  });
}

export class OpenAILLMProvider implements ILLMProvider {
  private readonly model: ChatOpenAI;

  constructor(apiKey: string, modelName = 'gpt-4o') {
    this.model = new ChatOpenAI({ apiKey, model: modelName });
  }

  async *chat(messages: LLMMessage[], options?: LLMOptions): AsyncIterable<string> {
    const stream = await this.model
      .bind({ temperature: options?.temperature, maxTokens: options?.maxTokens })
      .stream(toLC(messages));

    for await (const chunk of stream) {
      const text = typeof chunk.content === 'string' ? chunk.content : '';
      if (text) yield text;
    }
  }

  async chatOnce(messages: LLMMessage[], options?: LLMOptions): Promise<string> {
    const result = await this.model
      .bind({ temperature: options?.temperature, maxTokens: options?.maxTokens })
      .invoke(toLC(messages));
    return typeof result.content === 'string' ? result.content : '';
  }

  withStructuredOutput<T>(schema: ZodSchema<T>): IStructuredLLMProvider<T> {
    const bound = this.model.withStructuredOutput(schema);
    return {
      async invoke(messages: LLMMessage[]) {
        return bound.invoke(toLC(messages)) as Promise<T>;
      },
    };
  }

  /** Expose the raw LangChain model for LangGraph node use */
  getRawModel(): ChatOpenAI {
    return this.model;
  }
}
