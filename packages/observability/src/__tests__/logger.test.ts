import { describe, it, expect, vi, afterEach } from 'vitest';
import { createLogger } from '../logger.js';

// Mock pino-pretty transport to avoid spawning worker threads in tests
vi.mock('pino-pretty', () => ({
  default: vi.fn(() => process.stdout),
}));

describe('createLogger()', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns an object with standard logger methods', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const logger = createLogger('test-service');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('passes the service name as the "name" field', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const logger = createLogger('my-service');
    expect(logger.bindings()['name']).toBe('my-service');
  });

  it('uses the LOG_LEVEL env var when set', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('LOG_LEVEL', 'debug');
    const logger = createLogger('svc');
    expect(logger.level).toBe('debug');
  });

  it('defaults to "info" level when LOG_LEVEL is not set', () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env['LOG_LEVEL'];
    const logger = createLogger('svc');
    expect(logger.level).toBe('info');
  });

  it('creates a logger without throwing when NODE_ENV is not "production"', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(() => createLogger('svc')).not.toThrow();
  });

  it('creates a logger without throwing in production mode', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => createLogger('svc')).not.toThrow();
  });
});
