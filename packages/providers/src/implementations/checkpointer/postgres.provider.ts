import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import type { ICheckpointerProvider } from '../../interfaces/checkpointer.js';

export class PostgresCheckpointerProvider implements ICheckpointerProvider {
  private readonly saver: PostgresSaver;

  constructor(connectionString: string) {
    this.saver = PostgresSaver.fromConnString(connectionString);
  }

  getCheckpointer() {
    return this.saver;
  }

  async close(): Promise<void> {
    await this.saver.end();
  }
}
