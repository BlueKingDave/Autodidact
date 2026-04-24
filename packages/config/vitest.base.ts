import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createBaseConfig(overrides: Record<string, any> = {}) {
  const { test: testOverrides = {}, ...restOverrides } = overrides;
  return defineConfig({
    plugins: [tsconfigPaths()],
    test: {
      globals: true,
      environment: 'node',
      reporters: ['verbose'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        exclude: [
          '**/dist/**',
          '**/__tests__/**',
          '**/vitest.config.ts',
          '**/vitest.workspace.ts',
          '**/node_modules/**',
        ],
      },
      ...testOverrides,
    },
    ...restOverrides,
  });
}
