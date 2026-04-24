import { StateGraph, START, END } from '@langchain/langgraph';
import { CourseGenerationState } from './state.js';
import { makeGenerateBlueprintNode } from './nodes.js';
import type { ILLMProvider } from '@autodidact/providers';

export function buildCourseGenerationGraph(llmProvider: ILLMProvider) {
  const generateBlueprint = makeGenerateBlueprintNode(llmProvider);

  const graph = new StateGraph(CourseGenerationState)
    .addNode('generateBlueprint', generateBlueprint)
    .addEdge(START, 'generateBlueprint')
    .addConditionalEdges('generateBlueprint', (state) => {
      if (state.blueprint) return END;
      if (state.retryCount < 3) return 'generateBlueprint';
      return END;
    });

  return graph.compile();
}
