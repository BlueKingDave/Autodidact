import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { toArray } from 'rxjs/operators';
import type { MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';

// ────────────────────────────────────────────────────────────────────────────
// Mock @autodidact/db
// ────────────────────────────────────────────────────────────────────────────

const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
const mockLimit = vi.fn();
const mockWhere = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockInsertValues = vi.fn();

vi.mock('@autodidact/db', () => ({
  getDb: vi.fn(() => ({
    select: mockSelect,
    update: mockUpdate,
    insert: mockInsert,
  })),
  chatSessions: { id: 'chatSessions.id', moduleId: 'chatSessions.moduleId' },
  modules: { id: 'modules.id', courseId: 'modules.courseId' },
  enrollments: {},
  moduleProgress: {},
  courses: {},
  eq: vi.fn((a: unknown, b: unknown) => ({ eq: [a, b] })),
  and: vi.fn((...args: unknown[]) => ({ and: args })),
  sql: vi.fn((s: TemplateStringsArray, ...v: unknown[]) => ({ sql: s, v })),
}));

vi.mock('uuid', () => ({ v4: vi.fn(() => 'test-uuid-123') }));

import { ChatService } from '../modules/chat/chat.service.js';

// ────────────────────────────────────────────────────────────────────────────

function makeSseStream(lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(`data: ${line}\n`));
      }
      controller.close();
    },
  });
}

async function collectEvents(obs: Observable<MessageEvent>): Promise<MessageEvent[]> {
  return firstValueFrom(obs.pipe(toArray()));
}

const sampleSession = {
  id: 'session-1',
  moduleId: 'module-1',
  threadId: 'thread-1',
  userId: 'user-1',
  messages: [],
};

const sampleModule = {
  id: 'module-1',
  position: 0,
  title: 'Variables',
  description: 'Learn variables.',
  objectives: ['Declare variables'],
  contentOutline: [{ title: 'Basics', points: ['Assignment'] }],
  estimatedMinutes: 30,
  courseId: 'course-1',
};

function makeProgressService() {
  return { completeModule: vi.fn().mockResolvedValue(undefined) };
}

function setupSelectMock(firstResult: unknown[], secondResult: unknown[] = [sampleModule]) {
  let callCount = 0;
  mockSelect.mockImplementation(() => {
    const resultForThisCall = callCount === 0 ? firstResult : secondResult;
    callCount++;
    return {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(resultForThisCall),
        }),
      }),
    };
  });
}

function setupUpdateMock() {
  mockUpdateWhere.mockResolvedValue(undefined);
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  mockUpdate.mockReturnValue({ set: mockUpdateSet });
}

describe('ChatService.streamMessage()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupUpdateMock();
  });

  describe('error cases', () => {
    it('emits an error event when the module is not found', async () => {
      // getSession returns session, module query returns []
      let call = 0;
      mockSelect.mockImplementation(() => {
        const res = call === 0 ? [sampleSession] : [];
        call++;
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(res),
            }),
          }),
        };
      });
      const progressSvc = makeProgressService();
      const service = new ChatService(progressSvc as never);
      const events = await collectEvents(service.streamMessage('session-1', 'user-1', 'hi', 'http://agent'));
      const errorEvent = events.find((e) => {
        const parsed = JSON.parse(e.data as string) as { type: string };
        return parsed.type === 'error';
      });
      expect(errorEvent).toBeDefined();
    });

    it('emits an error event when agent fetch fails (non-ok response)', async () => {
      let call = 0;
      mockSelect.mockImplementation(() => {
        const res = call === 0 ? [sampleSession] : [sampleModule];
        call++;
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(res),
            }),
          }),
        };
      });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, body: null, status: 500 }));
      const progressSvc = makeProgressService();
      const service = new ChatService(progressSvc as never);
      const events = await collectEvents(service.streamMessage('session-1', 'user-1', 'hi', 'http://agent'));
      const errorEvent = events.find((e) => {
        const parsed = JSON.parse(e.data as string) as { type: string };
        return parsed.type === 'error';
      });
      expect(errorEvent).toBeDefined();
    });
  });

  describe('token streaming', () => {
    it('forwards token events from the SSE stream', async () => {
      // First call: getSession; second call: module; third call: getSession again for assistant persist; fourth: module for completion
      let call = 0;
      const results = [[sampleSession], [sampleModule], [sampleSession], [sampleModule]];
      mockSelect.mockImplementation(() => {
        const res = results[call++] ?? [];
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(res),
            }),
          }),
        };
      });
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          body: makeSseStream([
            JSON.stringify({ type: 'token', content: 'Hello ' }),
            JSON.stringify({ type: 'token', content: 'World' }),
          ]),
        }),
      );
      const progressSvc = makeProgressService();
      const service = new ChatService(progressSvc as never);
      const events = await collectEvents(service.streamMessage('session-1', 'user-1', 'hi', 'http://agent'));
      const tokenEvents = events.filter((e) => {
        const p = JSON.parse(e.data as string) as { type: string };
        return p.type === 'token';
      });
      expect(tokenEvents).toHaveLength(2);
    });

    it('calls progressService.completeModule when score >= 60', async () => {
      let call = 0;
      const results = [[sampleSession], [sampleModule], [sampleSession], [sampleModule]];
      mockSelect.mockImplementation(() => {
        const res = results[call++] ?? [];
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(res),
            }),
          }),
        };
      });
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          body: makeSseStream([
            JSON.stringify({ type: 'token', content: 'Great work!' }),
            JSON.stringify({ type: 'complete', score: 80 }),
          ]),
        }),
      );
      const progressSvc = makeProgressService();
      const service = new ChatService(progressSvc as never);
      await collectEvents(service.streamMessage('session-1', 'user-1', 'hi', 'http://agent'));
      expect(progressSvc.completeModule).toHaveBeenCalledWith('user-1', 'module-1', 'course-1', 80);
    });

    it('does NOT call completeModule when score < 60', async () => {
      let call = 0;
      const results = [[sampleSession], [sampleModule], [sampleSession], [sampleModule]];
      mockSelect.mockImplementation(() => {
        const res = results[call++] ?? [];
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(res),
            }),
          }),
        };
      });
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          body: makeSseStream([
            JSON.stringify({ type: 'token', content: 'Keep going.' }),
            JSON.stringify({ type: 'complete', score: 45 }),
          ]),
        }),
      );
      const progressSvc = makeProgressService();
      const service = new ChatService(progressSvc as never);
      await collectEvents(service.streamMessage('session-1', 'user-1', 'hi', 'http://agent'));
      expect(progressSvc.completeModule).not.toHaveBeenCalled();
    });
  });
});
