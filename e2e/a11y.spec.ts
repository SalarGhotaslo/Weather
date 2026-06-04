import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated accessibility gate. Runs axe-core against the key routes and fails
 * the build on any serious/critical WCAG 2.0/2.1 A & AA violation — the
 * category that included the colour-contrast issues this project set out to fix.
 *
 * Moderate/minor findings are reported (via console) but don't fail the build,
 * to avoid being blocked by third-party widgets (e.g. the SVG world map).
 */
const routes: { name: string; path: string }[] = [
  { name: "home — landing", path: "/" },
  { name: "home — searched city", path: "/?q=London" },
  {
    name: "day detail — today",
    path: "/day/0?lat=51.5074&lon=-0.1278&name=London&code=GB&tz=Europe%2FLondon",
  },
  {
    name: "day detail — future day",
    path: "/day/3?lat=51.5074&lon=-0.1278&name=London&code=GB&tz=Europe%2FLondon",
  },
  { name: "about", path: "/about" },
  { name: "countries", path: "/countries" },
];

for (const { name, path } of routes) {
  test(`${name} has no serious/critical a11y violations`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    if (results.violations.length > 0) {
      // Surface everything for debugging, even non-blocking findings.
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
