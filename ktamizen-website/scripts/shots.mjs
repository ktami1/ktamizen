// Scrolls the page step by step and saves screenshots at 390 and 1440.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.env.URL ?? "http://localhost:3100";
const out = process.env.OUT ?? "screens-tmp";
const widths = (process.env.WIDTHS ?? "390,1440").split(",").map(Number);
const reduce = process.env.REDUCE === "1";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME ?? "/opt/pw-browsers/chromium" });
for (const w of widths) {
  const h = w < 600 ? 844 : 900;
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    hasTouch: w < 600,
    isMobile: w < 600,
    reducedMotion: reduce ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(base + (process.env.QS ?? ""), { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = Number(process.env.STEP ?? h * 0.9);
  let i = 0;
  for (let y = 0; y < total; y += step) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}/${w}-${String(i++).padStart(2, "0")}.png` });
  }
  console.log(w, "height", total, "shots", i, "errors", errors);
  await ctx.close();
}
await browser.close();
