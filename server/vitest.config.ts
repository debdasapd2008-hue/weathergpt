import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const sharedEntry = fileURLToPath(new URL("../shared/src/index.ts", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@weathergpt/shared": sharedEntry,
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});