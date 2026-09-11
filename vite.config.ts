import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    projects: [
      {
        extends: true,
        test: {
          name: 'astra',
          include: ['src/astra/**/*.test.{ts,tsx}'],
          setupFiles: ['./src/astra/test-setup.ts'],
          clearMocks: true,
          restoreMocks: true,
        },
      },
      {
        extends: true,
        test: {
          name: 'claude',
          include: ['src/claude/**/*.test.{ts,tsx}'],
          setupFiles: ['./src/test/setup.ts'],
          globals: true,
        },
      },
      {
        extends: true,
        test: {
          name: 'shell',
          include: ['src/*.test.{ts,tsx}'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
    ],
  },
});
