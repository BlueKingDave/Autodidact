import { createBaseConfig } from '../config/vitest.base.ts';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Resolve .js extension imports to .ts sources for CJS require() calls in vite-node.
// This is needed because packages like @langchain/* are ESM-only and factory.ts uses
// static imports that get compiled to require() in vite-node's CJS transform.
const jsToTsPlugin = {
  name: 'js-to-ts-resolver',
  enforce: 'pre' as const,
  resolveId(id: string, importer: string | undefined) {
    if (!importer || !id.startsWith('.') || !id.endsWith('.js')) return;
    const tsPath = id.slice(0, -3) + '.ts';
    const importerDir = dirname(importer.replace(/\.(js|ts)$/, '.ts'));
    const resolved = resolve(importerDir, tsPath);
    if (existsSync(resolved)) return resolved;
  },
};

export default createBaseConfig({
  plugins: [jsToTsPlugin],
  test: {
    name: 'providers',
    include: ['src/__tests__/**/*.test.ts'],
  },
});
