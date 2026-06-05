import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated accessibility + behavioural gate. Runs axe-core against the key
 * routes and checks basic page structure (headings, key sections, content
 * presence) to catch rendering regressions before push.
 */
const routes: { name: string; path: string; assertions: (page: import("@playwright/test").Page) => Promise<void> }[] = [
  {
    name: "home — landing",
    path: "/",
    assertions: async (page) => {
      await expect(page.getByRole("heading", { level: 1, name: "Salar Weather" })).toBeVisible();
      await expect(page.getByLabel("Search for a city")).toBeVisible();
      await expect(page.getByText("Popular cities")).toBeVisible();
      await expect(page.getByRole("link", { name: "Browse countries" })).toBeVisible();
      await expect(page.getByRole("link", { name: "World map" })).toBeVisible();
    },
  },
  {
    name: "home — searched city",
    path: "/?q=London",
    assertions: async (page) => {
      await expect(page.getByRole("heading", { level: 1 })).toContainText("London");
      await expect(page.getByText("Feels like")).toBeVisible();
      await expect(page.getByText("Humidity")).toBeVisible();
      await expect(page.getByText("Wind")).toBeVisible();
      await expect(page.getByText("UV Index")).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: "5-Day Forecast" })).toBeVisible();
      await expect(page.locator('[role="listitem"]')).toHaveCount(5);
    },
  },
  {
    name: "day detail — today",
    path: "/day/0?lat=51.5074&lon=-0.1278&name=London&code=GB&tz=Europe%2FLondon",
    assertions: async (page) => {
      await expect(page.getByRole("heading", { level: 1 })).toContainText("London");
      await expect(page.getByRole("link", { name: "Today" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Tomorrow" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: "Hourly Forecast" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: "Best Times Outside" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: "What to Wear" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: "Compared to Last Year" })).toBeVisible();
      await expect(page.getByText("Right now")).toBeVisible();
    },
  },
  {
    name: "day detail — future day",
    path: "/day/3?lat=51.5074&lon=-0.1278&name=London&code=GB&tz=Europe%2FLondon",
    assertions: async (page) => {
      await expect(page.getByRole("heading", { level: 1 })).toContainText("London");
      await expect(page.getByRole("heading", { level: 2, name: "Hourly Forecast" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: "Best Times Outside" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: "What to Wear" })).toBeVisible();
      await expect(page.getByText("Right now")).not.toBeVisible();
    },
  },
  {
    name: "about",
    path: "/about",
    assertions: async (page) => {
      await expect(page.getByRole("heading", { level: 1, name: "Salar Weather" })).toBeVisible();
      await expect(page.getByText("Global city weather, beautifully presented.")).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: "Features" })).toBeVisible();
      await expect(page.locator('[class*="featureCard"]')).toHaveCount(10);
      await expect(page.getByRole("heading", { level: 2, name: "Data Sources" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: "Built with" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: "Security" })).toBeVisible();
    },
  },
  {
    name: "countries",
    path: "/countries",
    assertions: async (page) => {
      await expect(page.getByRole("heading", { level: 1, name: "All Countries" })).toBeVisible();
      await expect(page.getByLabel("Search countries or capitals")).toBeVisible();
      await expect(page.getByLabel("Filter countries by region")).toBeVisible();
      await expect(page.getByLabel("Jump to letter")).toBeVisible();
      // At least one country section renders (e.g. A).
      await expect(page.locator('section[id^="country-letter-"]').first()).toBeVisible();
    },
  },
  {
    name: "world map",
    path: "/map",
    assertions: async (page) => {
      await expect(page.getByRole("group", { name: "Map instructions" })).toBeVisible();
      await expect(page.getByText("Hover a country to see its cities")).toBeVisible();
    },
  },
];

for (const { name, path, assertions } of routes) {
  test(`${name} — a11y + behavioural`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });

    // Behavioural assertions — catch rendering regressions.
    await assertions(page);

    // Accessibility scan.
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    if (results.violations.length > 0) {
      console.log(
        `axe findings for ${name}:`,
        JSON.stringify(
          results.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.length,
            help: v.help,
          })),
          null,
          2,
        ),
      );
    }

    expect(blocking, `${blocking.length} serious/critical violation(s)`).toEqual([]);
  });
}
