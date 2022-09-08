import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";
import dts from "vite-plugin-dts";
import path from "path";

const coverage = 100;

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    coverage: {
      statements: coverage,
      functions: coverage,
      branches: coverage,
      lines: coverage
    }
  },
  plugins: [preact(), dts({ insertTypesEntry: true })],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/store.ts"),
      name: "preact-signal-store",
      fileName: (format) => `lib.${format}.js`
    },
    rollupOptions: { external: ["@preact/signals"] }
  },
});
