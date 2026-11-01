import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    exclude: ["node_modules", ".next", "out", "dist", "packages"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["lib/**/*.ts", "lib/**/*.tsx"],
    },
  },
});
