import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const out = "/home/user/ktamizen/ktamizen-website/screens-tmp";
for (const [w,h] of [[390,844],[1440,900]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, isMobile: w<600, hasTouch: w<600 })).newPage();
  const errs=[]; p.on("pageerror", e=>errs.push(e.message));
  await p.goto("http://localhost:3100/?ask=why", { waitUntil: "networkidle" });
  await p.waitForTimeout(5000);
  await p.screenshot({ path: `${out}/ask-deeplink-${w}.png` });
  const tests = ["wat does ktamizen mean", "how u come up w these lines", "fav quote?", "digital products refund", "asdkjh qwe", "why tho"];
  for (const t of tests) {
    await p.fill("#ask-input", t); await p.press("#ask-input", "Enter"); await p.waitForTimeout(400);
    const txt = (await p.locator("[aria-live=polite]").first().textContent()).replace(/\s+/g," ");
    console.log(w, JSON.stringify(t), "=>", txt.slice(0,110));
  }
  await p.fill("#ask-input", "how do you come up with these lines"); await p.press("#ask-input", "Enter"); await p.waitForTimeout(3500);
  await p.screenshot({ path: `${out}/ask-answer-${w}.png` });
  console.log("errors", errs);
}
await b.close();
