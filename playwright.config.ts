import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the automated accessibility (axe) check.
 *
 * `npm run test:a11y` builds nothing itself — it expects a production build to
 * already exist (CI runs `npm run build` first), then starts `npm run start`
 * and runs the axe scan in `e2e/`. Locally, run `npm run build` first, or set
 * reuseExistingServer by leaving CI unset and starting the app yourself.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
