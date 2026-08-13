import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const alias = {
  "@": fileURLToPath(new URL("./src", import.meta.url)),
  "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
};

const serverEnv = {
  NODE_ENV: "test",
  DATA_DIR: "./data/test",
  SESSION_SECRET: "test-secret",
};

/**
 * Two projects: the server suites need a real Node environment and SQLite, the
 * component suites need a DOM. Keeping them apart means neither has to carry
 * the other's setup.
 */
export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "server",
          environment: "node",
          include: ["tests/*.test.ts"],
          env: serverEnv,
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["tests/ui/**/*.test.tsx"],
          setupFiles: ["./tests/ui/setup.ts"],
          env: serverEnv,
        },
      },
    ],
  },
});
