import type { ZodSchema } from 'zod';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface ILLMProvider {
  chat(messages: LLMMessage[], options?: LLMOptions): AsyncIterable<string>;
  chatOnce(messages: LLMMessage[], options?: LLMOptions): Promise<string>;
  withStructuredOutput<T>(schema: ZodSchema<T>): IStructuredLLMProvider<T>;
}

export interface IStructuredLLMProvider<T> {
  invoke(messages: LLMMessage[], options?: LLMOptions): Promise<T>;
}
