import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "/tmp/wx-shots";
mkdirSync(OUT, { recursive: true });

const base = "http://localhost:3000";
const pages = [
  { name: "home-newyork-day", url: `/?q=New York` },
  { name: "home-tehran-night", url: `/?q=Tehran` },
  { name: "home-losangeles", url: `/?q=Los Angeles` },
  { name: "day-newyork", url: `/day/0?lat=40.7128&lon=-74.006&name=New York, US&code=US&tz=America/New_York` },
  { name: "day-tehran-night", url: `/day/0?lat=35.6944&lon=51.4215&name=Tehran, Iran&code=IR&tz=Asia/Tehran` },
  { name: "countries", url: `/countries` },
  { name: "home-landing", url: `/` },
];

const browser = await chromium.launch();
for (const vp of [{ w: 1280, h: 900, tag: "desktop" }, { w: 390, h: 844, tag: "mobile" }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  for (const p of pages) {
    try {
      await page.goto(base + encodeURI(p.url), { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${OUT}/${p.name}-${vp.tag}.png`, fullPage: true });
      console.log(`ok  ${p.name}-${vp.tag}`);
    } catch (e) {
      console.log(`ERR ${p.name}-${vp.tag}: ${e.message}`);
    }
  }
  await ctx.close();
}
await browser.close();
console.log("done →", OUT);
