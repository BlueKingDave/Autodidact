import { describe, it, expect, vi, beforeEach } from 'vitest';

// ────────────────────────────────────────────────────────────────────────────
// Capture the BullMQ Worker processor function
// ────────────────────────────────────────────────────────────────────────────

let capturedProcessorFn: ((job: Record<string, unknown>) => Promise<void>) | undefined;

vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation((_queue: string, fn: (job: unknown) => Promise<void>) => {
    capturedProcessorFn = fn as (job: Record<string, unknown>) => Promise<void>;
    return { close: vi.fn() };
  }),
}));

// ────────────────────────────────────────────────────────────────────────────
// Mock @autodidact/db
// ────────────────────────────────────────────────────────────────────────────

const mockExecute = vi.fn().mockResolvedValue(undefined);

vi.mock('@autodidact/db', () => ({
  getDb: vi.fn(() => ({ execute: mockExecute })),
  courses: {},
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
    type: 'sql',
    strings,
    values,
    toString: () => strings.join('?'),
  })),
}));

const { createEmbeddingWorker } = await import('../processors/embedding.processor.js');

// ────────────────────────────────────────────────────────────────────────────

function makeAgentClient(vector = [0.1, 0.2, 0.3]) {
  return { generateEmbedding: vi.fn().mockResolvedValue(vector), generateCourse: vi.fn() };
}

function makeLogger() {
  return { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() };
}

describe('createEmbeddingWorker — processor function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedProcessorFn = undefined;
    mockExecute.mockResolvedValue(undefined);
  });

  it('calls agentClient.generateEmbedding with the job topic', async () => {
    const agent = makeAgentClient();
    createEmbeddingWorker({} as never, agent as never, makeLogger() as never);
    expect(capturedProcessorFn).toBeDefined();
    await capturedProcessorFn!({ data: { courseId: 'c-1', topic: 'Python' } });
    expect(agent.generateEmbedding).toHaveBeenCalledWith('Python');
  });

  it('executes a SQL UPDATE that includes the ::vector cast', async () => {
    const agent = makeAgentClient([0.1, 0.2, 0.3]);
    createEmbeddingWorker({} as never, agent as never, makeLogger() as never);
    await capturedProcessorFn!({ data: { courseId: 'c-1', topic: 'Python' } });
    expect(mockExecute).toHaveBeenCalledOnce();
    // The SQL template strings should contain ::vector
    const sqlArg = mockExecute.mock.calls[0]?.[0] as { strings: TemplateStringsArray };
    const sqlText = sqlArg.strings.join('?');
    expect(sqlText).toContain('::vector');
  });

  it('constructs the correct vector literal from the embedding', async () => {
    const vector = [0.1, 0.2, 0.3];
    const agent = makeAgentClient(vector);
    createEmbeddingWorker({} as never, agent as never, makeLogger() as never);
    await capturedProcessorFn!({ data: { courseId: 'c-1', topic: 'Python' } });
    // The vectorLiteral "[0.1,0.2,0.3]" is passed as a template param to sql``
    const sqlArg = mockExecute.mock.calls[0]?.[0] as { values: unknown[] };
    const vectorLiteral = sqlArg.values[0] as string;
    expect(vectorLiteral).toBe('[0.1,0.2,0.3]');
  });

  it('passes courseId as the WHERE clause parameter', async () => {
    const agent = makeAgentClient();
    createEmbeddingWorker({} as never, agent as never, makeLogger() as never);
    await capturedProcessorFn!({ data: { courseId: 'course-uuid-99', topic: 'Rust' } });
    const sqlArg = mockExecute.mock.calls[0]?.[0] as { values: unknown[] };
    expect(sqlArg.values).toContain('course-uuid-99');
  });
});
