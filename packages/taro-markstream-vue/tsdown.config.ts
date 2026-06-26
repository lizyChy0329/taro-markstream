import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  outDir: 'dist/vue',
  external: [
    'vue',
    '@tarojs/components',
    '@tarojs/taro',
    'markstream-core',
    'stream-markdown-parser',
  ],
})
