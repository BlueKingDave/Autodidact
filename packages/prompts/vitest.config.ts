import { createBaseConfig } from '../config/vitest.base.ts';

export default createBaseConfig({
  test: {
    name: 'prompts',
    include: ['src/__tests__/**/*.test.ts'],
  },
});
