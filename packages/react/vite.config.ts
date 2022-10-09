import path from "path";

import react from "@vitejs/plugin-react";
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
  plugins: [react(), dts({ insertTypesEntry: true })],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/react.ts"),
      name: "deepsignalreact",
      fileName: format => `lib.${format}.js`,
    },
    rollupOptions: {
      external: ["@preact/signals-react", "react", "@deepsignal/core"],
    },
  },
});
