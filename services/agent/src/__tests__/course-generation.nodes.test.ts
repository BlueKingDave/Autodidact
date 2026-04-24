import { describe, it, expect, vi } from 'vitest';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { makeGenerateBlueprintNode } from '../graphs/course-generation/nodes.js';
import type { CourseGenerationStateType } from '../graphs/course-generation/state.js';

function makeMockProvider(responseContent: string) {
  const mockModel = {
    invoke: vi.fn().mockResolvedValue({ content: responseContent }),
  };
  return {
    getModel: vi.fn().mockReturnValue(mockModel),
    getModelName: vi.fn().mockReturnValue('mock'),
    _mockModel: mockModel,
  };
}

const validBlueprintJson = JSON.stringify({
  title: 'Python Basics',
  description: 'Learn Python from scratch.',
  difficulty: 'beginner',
  estimatedHours: 10,
  modules: [
    {
      position: 0,
      title: 'Intro',
      description: 'Getting started',
      objectives: ['Understand Python syntax'],
      contentOutline: [{ title: 'Setup', points: ['Install Python'] }],
      estimatedMinutes: 60,
    },
  ],
});

const baseState: CourseGenerationStateType = {
  topic: 'Python',
  difficulty: 'beginner',
  moduleCount: 1,
  blueprint: null,
  retryCount: 0,
  error: null,
};

describe('makeGenerateBlueprintNode()', () => {
  describe('JSON extraction from LLM response', () => {
    it('extracts JSON from a ```json ... ``` markdown block', async () => {
      const provider = makeMockProvider(`\`\`\`json\n${validBlueprintJson}\n\`\`\``);
      const node = makeGenerateBlueprintNode(provider as never);
      const result = await node(baseState);
      expect(result.blueprint).not.toBeNull();
      expect(result.blueprint?.title).toBe('Python Basics');
    });

    it('extracts raw JSON from a { ... } block when there is no markdown wrapper', async () => {
      const provider = makeMockProvider(validBlueprintJson);
      const node = makeGenerateBlueprintNode(provider as never);
      const result = await node(baseState);
      expect(result.blueprint).not.toBeNull();
    });

    it('extracts JSON from a ``` (no language tag) markdown block', async () => {
      const provider = makeMockProvider(`\`\`\`\n${validBlueprintJson}\n\`\`\``);
      const node = makeGenerateBlueprintNode(provider as never);
      const result = await node(baseState);
      expect(result.blueprint).not.toBeNull();
    });
  });

  describe('successful schema parse', () => {
    it('sets blueprint on valid CourseBlueprintSchema input', async () => {
      const provider = makeMockProvider(validBlueprintJson);
      const node = makeGenerateBlueprintNode(provider as never);
      const result = await node(baseState);
      expect(result.blueprint).not.toBeNull();
      expect(result.retryCount).toBe(0);
    });

    it('retryCount is unchanged on success', async () => {
      const provider = makeMockProvider(validBlueprintJson);
      const node = makeGenerateBlueprintNode(provider as never);
      const stateWithRetries: CourseGenerationStateType = { ...baseState, retryCount: 2 };
      const result = await node(stateWithRetries);
      expect(result.retryCount).toBe(2);
    });
  });

  describe('Zod validation failure', () => {
    it('returns blueprint: null when the schema is missing required fields', async () => {
      const provider = makeMockProvider(JSON.stringify({ title: 'bad', modules: [] }));
      const node = makeGenerateBlueprintNode(provider as never);
      const result = await node(baseState);
      expect(result.blueprint).toBeNull();
    });

    it('increments retryCount by 1 on validation failure', async () => {
      const provider = makeMockProvider(JSON.stringify({ invalid: true }));
      const node = makeGenerateBlueprintNode(provider as never);
      const result = await node(baseState);
      expect(result.retryCount).toBe(1);
    });

    it('increments retryCount from an existing value', async () => {
      const provider = makeMockProvider(JSON.stringify({ invalid: true }));
      const node = makeGenerateBlueprintNode(provider as never);
      const stateAt2: CourseGenerationStateType = { ...baseState, retryCount: 2 };
      const result = await node(stateAt2);
      expect(result.retryCount).toBe(3);
    });

    it('returns a non-null error message on validation failure', async () => {
      const provider = makeMockProvider(JSON.stringify({ title: 'oops' }));
      const node = makeGenerateBlueprintNode(provider as never);
      const result = await node(baseState);
      expect(typeof result.error).toBe('string');
      expect((result.error as string).length).toBeGreaterThan(0);
    });
  });

  describe('model invocation', () => {
    it('invokes the model with a SystemMessage and HumanMessage', async () => {
      const provider = makeMockProvider(validBlueprintJson);
      const node = makeGenerateBlueprintNode(provider as never);
      await node(baseState);
      const invokeArgs = provider._mockModel.invoke.mock.calls[0][0] as unknown[];
      expect(invokeArgs[0]).toBeInstanceOf(SystemMessage);
      expect(invokeArgs[1]).toBeInstanceOf(HumanMessage);
    });
  });
});
