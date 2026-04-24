import { createBaseConfig } from '../config/vitest.base.ts';

export default createBaseConfig({
  test: {
    name: 'schemas',
    include: ['src/__tests__/**/*.test.ts'],
  },
});
