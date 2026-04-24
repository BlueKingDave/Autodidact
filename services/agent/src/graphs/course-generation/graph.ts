import { StateGraph, START, END } from '@langchain/langgraph';
import { CourseGenerationState } from './state.js';
import { makeGenerateBlueprintNode, makeValidateBlueprintNode } from './nodes.js';
import type { ILLMProvider } from '@autodidact/providers';

export function buildCourseGenerationGraph(llm: ILLMProvider) {
  const generateBlueprint = makeGenerateBlueprintNode(llm);
  const validateBlueprint = makeValidateBlueprintNode(llm);

  const graph = new StateGraph(CourseGenerationState)
    .addNode('generate', generateBlueprint)
    .addNode('validate', validateBlueprint)
    .addEdge(START, 'generate')
    .addEdge('generate', 'validate')
    .addConditionalEdges('validate', (state) => {
      if (state.blueprint) return 'done';
      if (state.retryCount < 3) return 'retry';
      return 'done';
    }, {
      done: END,
      retry: 'generate',
    });

  return graph.compile();
}
