import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ────────────────────────────────────────────────────────────────────────────
// Mock @autodidact/db
// ────────────────────────────────────────────────────────────────────────────

const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
const mockOnConflictDoNothing = vi.fn().mockResolvedValue(undefined);
const mockReturning = vi.fn().mockResolvedValue([]);
const mockInsertValues = vi.fn().mockReturnValue({
  returning: mockReturning,
  onConflictDoUpdate: mockOnConflictDoUpdate,
  onConflictDoNothing: mockOnConflictDoNothing,
});
const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });

const mockExecute = vi.fn().mockResolvedValue({ rows: [] });
const mockOrderBy = vi.fn().mockResolvedValue([]);
const mockLimit = vi.fn().mockResolvedValue([]);
const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy, limit: mockLimit });
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

vi.mock('@autodidact/db', () => ({
  getDb: vi.fn(() => ({
    insert: mockInsert,
    select: mockSelect,
    execute: mockExecute,
  })),
  courses: {},
  modules: { courseId: {}, position: {} },
  enrollments: { userId: {}, courseId: {} },
  moduleProgress: {},
  chatSessions: {},
  eq: vi.fn((a, b) => ({ eq: [a, b] })),
  and: vi.fn((...args: unknown[]) => ({ and: args })),
  sql: vi.fn((s: TemplateStringsArray, ...v: unknown[]) => ({ sql: s, v })),
  desc: vi.fn((a: unknown) => ({ desc: a })),
}));

import { CoursesService } from '../modules/courses/courses.service.js';

// ────────────────────────────────────────────────────────────────────────────

function makeMockAgentClient(embedding: number[] = [0.1, 0.2, 0.3]) {
  return { generateEmbedding: vi.fn().mockResolvedValue(embedding) };
}

function makeMockQueueProvider(jobId = 'job-1') {
  return { enqueue: vi.fn().mockResolvedValue(jobId), getJobStatus: vi.fn(), close: vi.fn() };
}

describe('CoursesService.enrollUser()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnConflictDoUpdate.mockResolvedValue(undefined);
    mockOnConflictDoNothing.mockResolvedValue(undefined);
    mockInsertValues.mockReturnValue({
      returning: mockReturning,
      onConflictDoUpdate: mockOnConflictDoUpdate,
      onConflictDoNothing: mockOnConflictDoNothing,
    });
    mockInsert.mockReturnValue({ values: mockInsertValues });
    mockWhere.mockReturnValue({ orderBy: mockOrderBy, limit: mockLimit });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  it('assigns status="available" to the position-0 module', async () => {
    mockOrderBy.mockResolvedValue([
      { id: 'mod-0', position: 0 },
      { id: 'mod-1', position: 1 },
      { id: 'mod-2', position: 2 },
    ]);
    const service = new CoursesService(makeMockAgentClient() as never, makeMockQueueProvider() as never);
    await service.enrollUser('user-1', 'course-1');

    const calls = mockInsertValues.mock.calls;
    // First call is the enrollment upsert (no status field)
    const progressCalls = calls.slice(1);
    expect(progressCalls[0]?.[0].status).toBe('available');
  });

  it('assigns status="locked" to all modules with position > 0', async () => {
    mockOrderBy.mockResolvedValue([
      { id: 'mod-0', position: 0 },
      { id: 'mod-1', position: 1 },
      { id: 'mod-2', position: 2 },
    ]);
    const service = new CoursesService(makeMockAgentClient() as never, makeMockQueueProvider() as never);
    await service.enrollUser('user-1', 'course-1');

    const progressCalls = mockInsertValues.mock.calls.slice(1);
    expect(progressCalls[1]?.[0].status).toBe('locked');
    expect(progressCalls[2]?.[0].status).toBe('locked');
  });

  it('creates a moduleProgress row for every module in the course', async () => {
    const mods = [
      { id: 'mod-0', position: 0 },
      { id: 'mod-1', position: 1 },
      { id: 'mod-2', position: 2 },
      { id: 'mod-3', position: 3 },
    ];
    mockOrderBy.mockResolvedValue(mods);
    const service = new CoursesService(makeMockAgentClient() as never, makeMockQueueProvider() as never);
    await service.enrollUser('user-1', 'course-1');

    // 1 enrollment insert + N moduleProgress inserts
    const progressCalls = mockInsertValues.mock.calls.slice(1);
    expect(progressCalls).toHaveLength(mods.length);
  });

  it('calls onConflictDoNothing for each moduleProgress insert', async () => {
    mockOrderBy.mockResolvedValue([
      { id: 'mod-0', position: 0 },
      { id: 'mod-1', position: 1 },
    ]);
    const service = new CoursesService(makeMockAgentClient() as never, makeMockQueueProvider() as never);
    await service.enrollUser('user-1', 'course-1');
    // onConflictDoNothing called once per module
    expect(mockOnConflictDoNothing).toHaveBeenCalledTimes(2);
  });

  it('does nothing for a course with no modules', async () => {
    mockOrderBy.mockResolvedValue([]);
    const service = new CoursesService(makeMockAgentClient() as never, makeMockQueueProvider() as never);
    await service.enrollUser('user-1', 'course-empty');
    // Only the enrollment upsert, no moduleProgress inserts
    expect(mockInsertValues).toHaveBeenCalledTimes(1);
    expect(mockOnConflictDoNothing).not.toHaveBeenCalled();
  });
});

describe('CoursesService.createOrReuse() — similarity routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrderBy.mockResolvedValue([]);
    mockLimit.mockResolvedValue([]);
    mockWhere.mockReturnValue({ orderBy: mockOrderBy, limit: mockLimit });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });
    mockOnConflictDoUpdate.mockResolvedValue(undefined);
    mockOnConflictDoNothing.mockResolvedValue(undefined);
    mockInsertValues.mockReturnValue({
      returning: mockReturning,
      onConflictDoUpdate: mockOnConflictDoUpdate,
      onConflictDoNothing: mockOnConflictDoNothing,
    });
    mockInsert.mockReturnValue({ values: mockInsertValues });
  });

  it('returns reused:true and does NOT enqueue when similar course found', async () => {
    mockExecute.mockResolvedValue({ rows: [{ id: 'existing-id', title: 'Python', similarity: 0.95 }] });
    const queue = makeMockQueueProvider();
    const service = new CoursesService(makeMockAgentClient() as never, queue as never);
    const result = await service.createOrReuse('user-1', { topic: 'Python', difficulty: 'beginner', moduleCount: 5 });
    expect(result.reused).toBe(true);
    expect(result.courseId).toBe('existing-id');
    expect(queue.enqueue).not.toHaveBeenCalled();
  });

  it('returns reused:false and enqueues when no similar course exists', async () => {
    mockExecute.mockResolvedValue({ rows: [] });
    mockReturning.mockResolvedValue([{ id: 'new-id' }]);
    mockInsertValues.mockReturnValue({ returning: mockReturning, onConflictDoUpdate: mockOnConflictDoUpdate, onConflictDoNothing: mockOnConflictDoNothing });
    const queue = makeMockQueueProvider('new-job');
    const service = new CoursesService(makeMockAgentClient() as never, queue as never);
    const result = await service.createOrReuse('user-1', { topic: 'Rust', difficulty: 'intermediate', moduleCount: 8 });
    expect(result.reused).toBe(false);
    expect(result.jobId).toBe('new-job');
    expect(queue.enqueue).toHaveBeenCalledOnce();
  });
});
