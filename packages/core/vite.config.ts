import path from "path";

import preact from "@preact/preset-vite";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

const coverage = 100;

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: "jsdom",
    coverage: {
      statements: coverage,
      functions: coverage,
      branches: coverage,
      lines: coverage,
    },
  },
  plugins: [preact(), dts({ insertTypesEntry: true })],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/core.ts"),
      name: "deepsignalcore",
      fileName: format => `lib.${format}.js`,
    },
    rollupOptions: { external: ["@preact/signals-core"] },
  },
});
