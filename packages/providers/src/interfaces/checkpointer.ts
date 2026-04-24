import type { BaseCheckpointSaver } from '@langchain/langgraph';

export interface ICheckpointerProvider {
  getCheckpointer(): BaseCheckpointSaver;
  close?(): Promise<void>;
}
