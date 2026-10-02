import type { Faq } from "@/content/faq";

// Dummy matcher: token overlap with a little typo tolerance. Swap for the
// Fuse.js version described in PLAN.md when the real system is built.

const SLANG: Record<string, string> = {
  u: "you",
  ur: "your",
  r: "are",
  y: "why",
  wyd: "what are you doing",
  fr: "",
  pls: "",
  plz: "",
  bro: "",
  bruh: "",
  rn: "now",
  ig: "instagram",
  insta: "instagram",
  merch: "shop",
};

const STOP = new Set([
  "the",
  "a",
  "an",
  "is",
  "do",
  "does",
  "to",
  "of",
  "and",
  "i",
  "me",
  "my",
  "it",
  "this",
  "that",
  "for",
  "on",
  "in",
  "be",
  "are",
  "you",
  "your",
  "what",
  "how",
  "can",
  "will",
]);

export function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w in SLANG ? SLANG[w] : w))
    .join(" ")
    .trim();
}

function tokens(s: string) {
  return normalize(s)
    .split(" ")
    .filter((w) => w.length > 1 && !STOP.has(w));
}

function close(a: string, b: string) {
  if (a === b) return true;
  if (Math.min(a.length, b.length) >= 3 && (a.startsWith(b) || b.startsWith(a))) return true;
  if (Math.abs(a.length - b.length) > 1 || a.length < 5) return false;
  // One edit apart
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

export function match(input: string, list: Faq[]): Faq | null {
  const q = tokens(input);
  if (!q.length) return null;
  let best: Faq | null = null;
  let bestScore = 0;
  for (const f of list) {
    for (const phrase of [f.question, ...f.aliases]) {
      const p = tokens(phrase);
      if (!p.length) continue;
      const hit = p.filter((w) => q.some((x) => close(x, w))).length;
      const score = hit / p.length - (phrase === f.question ? 0 : 0.05);
      if (score > bestScore) {
        bestScore = score;
        best = f;
      }
    }
  }
  return bestScore >= 0.6 ? best : null;
}

export function related(current: Faq, list: Faq[], n = 2) {
  const same = list.filter((f) => f.id !== current.id && f.category === current.category);
  const rest = list.filter((f) => f.id !== current.id && f.category !== current.category);
  return [...same, ...rest].slice(0, n);
}
