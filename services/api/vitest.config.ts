import { createBaseConfig } from '../../packages/config/vitest.base.ts';

export default createBaseConfig({
  test: {
    name: 'api',
    include: ['src/__tests__/**/*.test.ts'],
    setupFiles: ['reflect-metadata'],
    testTimeout: 30000,
    hookTimeout: 60000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
