import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    fileParallelism: false,                // Disable concurrent test file
    include: ['**/src/tests/*.test.ts'],
  },
})
