import { MemorySaver } from '@langchain/langgraph';
import type { ICheckpointerProvider } from '../../interfaces/checkpointer.js';

export class MemoryCheckpointerProvider implements ICheckpointerProvider {
  private readonly saver = new MemorySaver();

  getCheckpointer() {
    return this.saver;
  }
}
