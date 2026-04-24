import { MemorySaver } from '@langchain/langgraph';
import type { BaseCheckpointSaver } from '@langchain/langgraph';
import type { ICheckpointerProvider } from '../../interfaces/checkpointer.js';

export class MemoryCheckpointerProvider implements ICheckpointerProvider {
  private readonly saver = new MemorySaver();

  getCheckpointer(): BaseCheckpointSaver {
    return this.saver;
  }
}
