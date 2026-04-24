import { StateGraph, START, END } from '@langchain/langgraph';
import { ModuleChatState } from './state.js';
import { makeTeacherNode } from './nodes.js';
import type { ILLMProvider, ICheckpointerProvider } from '@autodidact/providers';

export function buildModuleChatGraph(llm: ILLMProvider, checkpointer: ICheckpointerProvider) {
  const teacherNode = makeTeacherNode(llm);

  const graph = new StateGraph(ModuleChatState)
    .addNode('teacher', teacherNode)
    .addEdge(START, 'teacher')
    .addConditionalEdges('teacher', (state) =>
      state.completionSignaled ? END : END,
    );

  return graph.compile({ checkpointer: checkpointer.getCheckpointer() });
}
