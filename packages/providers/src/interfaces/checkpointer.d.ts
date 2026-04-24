import type { BaseCheckpointSaver } from '@langchain/langgraph';
export interface ICheckpointerProvider {
    getCheckpointer(): BaseCheckpointSaver;
}
//# sourceMappingURL=checkpointer.d.ts.map