import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "@": path.join(root, "src") },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Building the database from every migration takes a few seconds.
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
