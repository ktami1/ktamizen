// Scans the built HTML for the hard bans: emoji, quotation marks, em dashes,
// double hyphens, double underscores and banned marketing words.
// Only visible text and human facing attributes are checked, so CSS variables
// and JSON-LD do not trip it. Apostrophes inside words are allowed.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = ".next/server/app";
// _global-error.html is the framework fallback, never served to visitors.
const files = readdirSync(dir).filter((f) => f.endsWith(".html") && !f.startsWith("_global-error"));
const bannedWords = ["unlock", "elevate", "journey", "empower", "transform your life"];
// Add the founder's surname, city or employer here so they can never ship.
const denylist = [];

const decode = (s) =>
  s
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;|&#xa0;/g, " ");

let hits = 0;
for (const f of files) {
  let html = readFileSync(join(dir, f), "utf8");
  html = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ");
  const attrs = [...html.matchAll(/\s(?:alt|title|aria-label|placeholder)="([^"]*)"/g)].map((m) => m[1]);
  const text = [...html.replace(/<[^>]+>/g, "\n").split("\n"), ...attrs].map(decode).map((s) => s.trim()).filter(Boolean);
  for (const t of text) {
    const problems = [];
    if (/\p{Extended_Pictographic}/u.test(t)) problems.push("emoji");
    if (/["“”«»„]/.test(t)) problems.push("quotation mark");
    if (/(^|\s)'|'(\s|$)|[‘’]/.test(t)) problems.push("single quote used as quotation");
    if (/[—–]/.test(t)) problems.push("dash");
    if (/--|__/.test(t)) problems.push("double hyphen or underscore");
    for (const w of [...bannedWords, ...denylist]) if (t.toLowerCase().includes(w)) problems.push(`banned: ${w}`);
    if (problems.length) {
      hits++;
      console.log(`${f}: ${problems.join(", ")}: ${t.slice(0, 120)}`);
    }
  }
}
console.log(hits ? `\n${hits} copy problem(s)` : `copy clean across ${files.length} page(s)`);
process.exit(hits ? 1 : 0);
