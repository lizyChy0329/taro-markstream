import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    outDir: 'dist/vue',
    sourcemap: true,
    css: {
      fileName: 'index.css',
    },
  },
})
