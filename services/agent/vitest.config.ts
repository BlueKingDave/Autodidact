import { createBaseConfig } from '../../packages/config/vitest.base.ts';

export default createBaseConfig({
  test: {
    name: 'agent',
    include: ['src/__tests__/**/*.test.ts'],
  },
});
