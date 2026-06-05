import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Unit tests live in src/. The e2e/ axe specs use Playwright's runner, not
    // Vitest, so keep them out of the Vitest run.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/**", "e2e/**", ".next/**"],
    coverage: {
      provider: "v8",
      all: true,
      // The coverage gate targets the LOGIC layer — pure helpers, view-model
      // builders and data-fetch orchestration — where unit tests are meaningful.
      // Presentational Server/Client components and pages render JSX; their
      // correctness is verified by TypeScript, the production build, and the
      // Playwright axe/e2e suite (6 routes), which is the right tool for UI.
      include: [
        "src/lib/**/*.ts",
        "src/app/**/*View.ts", // homeView, dayView view-model builders
      ],
      exclude: ["**/*.test.{ts,tsx}", "**/*.d.ts"],
      reporter: ["text", "html", "json-summary"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
