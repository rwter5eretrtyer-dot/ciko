import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'node', env: { ACCESS_TOKEN_SECRET: 'test-access-secret-of-minimum-32-characters', REFRESH_TOKEN_SECRET: 'test-refresh-secret-of-minimum-32-characters' }, coverage: { provider: 'v8', include: ['src/services/**/*.ts'], thresholds: { lines: 60, functions: 60, statements: 60 } } }
});
