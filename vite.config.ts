import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import dts from 'vite-plugin-dts';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), dts({ insertTypesEntry: true })],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/store.ts'),
      name: 'preact-signal-store',
      fileName: (format) => `lib.${format}.js`
    },
    rollupOptions: { external: ['@preact/signals'] }
  },
});
