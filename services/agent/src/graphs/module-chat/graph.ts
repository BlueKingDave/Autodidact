import { StateGraph, START, END } from '@langchain/langgraph';
import { ModuleChatState } from './state.js';
import { makeTeacherNode, makeEvaluationNode } from './nodes.js';
import type { ILLMProvider, ICheckpointerProvider } from '@autodidact/providers';

export function buildModuleChatGraph(
  llmProvider: ILLMProvider,
  checkpointerProvider: ICheckpointerProvider,
) {
  const teacherNode = makeTeacherNode(llmProvider);
  const evaluationNode = makeEvaluationNode(llmProvider);
  const checkpointer = checkpointerProvider.getCheckpointer();

  const graph = new StateGraph(ModuleChatState)
    .addNode('teacher', teacherNode)
    .addNode('evaluator', evaluationNode)
    .addEdge(START, 'teacher')
    .addConditionalEdges('teacher', (state) =>
      state.completionSignaled ? 'evaluator' : END,
    )
    .addEdge('evaluator', END);

  return graph.compile({ checkpointer });
}
