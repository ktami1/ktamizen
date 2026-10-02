# KTAMIZEN landing site: PLAN

Status: waiting for approval. Nothing is scaffolded yet.

Source of truth: the build brief. No `design.md` exists in the project (checked the repo and Google Drive), so the tokens in brief section 3 are the design system. If you have a design.md, send it and it overrides this plan on visual details.

Everything marked **PROPOSED COPY** is written by me and needs your yes or your rewrite. Everything marked **DECISION** needs a one word answer from you.

---

## 1. Architecture

```
ktamizen-website/
  app/
    layout.tsx            fonts, metadata, JSON-LD Organization, analytics, grain, cursor
    page.tsx              the one scroll, server rendered
    api/ask/route.ts      unmatched question relay (see 6.3)
    api/og/route.tsx      stretch: 1080x1350 answer card + 1200x630 default card
    ask/[id]/page.tsx     share landing with its own OG image (see 6.4)
    sitemap.ts  robots.ts  manifest.ts  icon.tsx  apple-icon.tsx
    opengraph-image.tsx   1200x630 black card, wordmark, red rule
  config/site.ts          shop state, URLs, numbers, flags (showDrafts, debug)
  content/faq.ts          seed data, exact shape from brief section 9
  content/story.ts        five chapters + signature
  content/messages.ts     empty array, section hidden while empty
  lib/
    motion.ts             easing, durations, gsap registration, reduced motion guard
    smooth-scroll.ts      Lenis + ScrollTrigger sync
    device.ts             low end + touch + in-app browser detection
    ask/normalize.ts      lowercase, strip punctuation, slang map
    ask/match.ts          Fuse setup, keyword boost, score gate
    ask/match.test.ts     the 40+ phrase test table (vitest)
    analytics.ts          typed track() wrapper, no-op without provider
  components/             the 15 components from brief section 5.5
  scripts/
    lint-copy.ts          scans built HTML text nodes for bans (brief 2 and 12.3)
    budget.ts             fails the build if first load JS > 200 KB gz
  public/fonts/           Sloop Script Pro goes here when licensed
  PLAN.md  README.md  CONTENT_TODO.md
```

Rendering model:
1. `page.tsx` is a Server Component. All text (hero lines, numbers in their final state, five chapters, FAQ accordion, links) is in the HTML. With JS off the page is complete and readable, just static.
2. Animation lives in small client islands that receive the already rendered DOM and enhance it. No text is created by JS.
3. A `js` class is set on `<html>` by a tiny inline script before paint. Every hidden initial state (opacity 0, blur, clip) is scoped under `.js` and under `@media (prefers-reduced-motion: no-preference)`. JS off or reduced motion means final state, no flash, no layout shift.

## 2. Stack and libraries

| Package | Why | Approx gz |
|---|---|---|
| next (latest stable, App Router), react, typescript | brief | ~95 KB baseline |
| tailwindcss v4 | tokens via `@theme`, every token also a CSS variable | CSS only |
| gsap (ScrollTrigger, SplitText) | scroll choreography | ~45 KB |
| lenis | smooth scroll, desktop only (see risks) | ~4 KB |
| fuse.js | local fuzzy match, **lazy loaded** when the Ask section nears the viewport | ~8 KB, off the first load |
| @vercel/analytics or Plausible script | events | ~2 KB |
| vitest, @playwright/test | matching tests, screenshots at 390 and 1440 | dev only |

Target first load JS: about 150 to 170 KB gz, under the 200 KB budget, enforced by `scripts/budget.ts` in CI.

No three.js, no R3F, no Framer Motion, no UI kit. Fonts through `next/font/google` (Instrument Serif, Inter Tight 700) with `adjustFontFallback` so swapping does not shift layout. Sloop Script Pro through `next/font/local` once the file is in `/public/fonts/`, Instrument Serif italic until then.

## 3. Design tokens

Single file `app/tokens.css`, mirrored into Tailwind `@theme` so components only use names like `bg-ink`, `text-red`, `border-hair`.

| Token | Value | Use |
|---|---|---|
| color-ink | #000000 | canvas |
| color-paper | #FFFFFF | text, numbers section |
| color-red | #D30000 | the only accent |
| color-red-press | #A80000 | pressed state |
| color-raised | #0B0B0B | raised surface |
| color-hair | #1C1C1C | hairlines |
| color-mute | #8A8A8A | secondary text on black only |
| ease-out | cubic-bezier(0.22, 1, 0.36, 1) | everything |
| dur-enter | 700ms (range 500 to 900) | entrances |
| dur-hover | 400ms | hovers |
| space unit | 8px | all spacing |
| radius | 0, pill 9999px for chips only | |

Type scale (clamp between 390 and 1440 viewport):
display 56 to 160px, h1 40 to 96px, h2 28 to 56px, body 16 to 18px, caption 12 to 13px uppercase with +8% tracking. Serif at -6%, sans at -3%.

Contrast checks (computed, WCAG):
1. Red on black 3.8:1. Passes large text only, so red text only at 28px and above. Matches the brief.
2. White on red 5.6:1. Passes everything.
3. Gray #8A8A8A on black 6.1:1. Fine.
4. **Gray #8A8A8A on white is 3.4:1 and fails for small text.** In the white numbers section, the caption roughly and zero faces will be black, not gray. Flagging because it is a deviation.
5. Focus rings: red 2px on black and white sections. **On the red section a red ring is invisible, so focus there is a white ring.** Flagging as a deviation.

## 4. Sections and animation plan

Shared motion language: slow, heavy, quiet. One easing, no bounce, no spring, no rotation. Section changes are hard cuts or clip-path wipes, never black to white fades.

| # | Section | Desktop behavior | Mobile 390 | Reduced motion / JS off |
|---|---|---|---|---|
| 1 | Preloader | Wordmark letters appear with hard cuts (steps, no fade), red rule scales X from 0 to 1, screen wipes up with clip-path. Ends early when fonts and hero canvas are ready. Max 1.2s. Skipped if `sessionStorage` flag is set. | same, 0.9s | not rendered |
| 2 | Hero | Pinned about 250vh. DitherHero canvas: red ember blob, Bayer 8x8 dither at very low internal resolution, pixel size goes from coarse to fine with scroll progress, `image-rendering: pixelated`. Mouse parallax a few px. WordReveal on KTAMIZEN, then KTAMI + ZEN., then POWERED BY GOD., each 16px rise and blur 8 to 0, tied to scroll. Buttons arrive at the end of the pin. | pin about 150vh, no parallax, canvas at half resolution, dither stops when hero leaves view | static poster image of the ember, all lines and buttons visible |
| 3 | Statement strip | OversizedLine POWERED BY GOD, Inter Tight bold caps, red, wider than the viewport, horizontal drift driven by Lenis velocity, eases back with a lerp. Only use of this effect. | drift from native scroll velocity | static, centered, clipped |
| 4 | Numbers on white | Enters with a clip-path wipe from the bottom (hard edge). Three Instrument Serif figures count up once on enter. Count runs on the digits only, suffix k+ and M+ stays fixed so width does not jump (tabular figures, width reserved by the final string). | stacked vertically | final numbers |
| 5 | Story | Five pinned screens. CharacterScrub via SplitText chars, each from 15% opacity to 100% as scroll passes. One accent word per chapter (see 7). Then the signature Ktami in script, very large, with caption the founder. | pins shorter, larger type | all text at full opacity |
| 5b | Messages | Only if `content/messages.ts` has entries. Messages arrive one by one, stacked, previous ones dim. | same | list |
| 6 | Ask the founder | Full viewport. See section 6. Cursor shows ASK here. | chips scroll horizontally | input and FAQ work, no typed placeholder |
| 6b | FAQ accordion | Native `<details>` grouped by category. Works with JS off. | same | same |
| 7 | What is coming | Red full bleed, entered with a clip-path wipe. Headline the shop is coming. Three caption blocks. WaitlistForm or shop button depending on `shopState`. | stacked | static |
| 8 | For brands | Black. Short copy, numbers, buttons. | stacked | static |
| 9 | Footer | Wordmark, links, email, privacy note, products policy, powered by God. | same | same |

Global:
1. Grain: one small noise tile on a canvas, offset stepped at 8fps, opacity about 0.06, `pointer-events: none`. Off on reduced motion, low end devices and on touch devices with fewer than 4 cores or `saveData`.
2. Cursor: desktop with fine pointer only. White dot, becomes red ring on `[data-cursor]` elements, label ASK inside the Ask section.
3. MagneticButton: small pull (max 8px), 1.02 scale on hover, instant color swap, press goes to #A80000.
4. Debug: `?debug=1` turns on ScrollTrigger markers and an FPS meter.

## 5. Content layer

1. `config/site.ts`:
   - `shopState: 'coming-soon' | 'live'`, `shopUrl`, `gumroadUrl`
   - `instagramUrl: https://www.instagram.com/ktamizen`, `xUrl`, `email`, `collabstrUrl`
   - `numbers: { followers: '340k+', monthlyViews: '16M+', weeks: '100+', years: '2.5' }`
   - `showDrafts: false`, `siteUrl`
   - One helper `shopCta()` returns label, href and kind. Every shop CTA in the page and the shop-when answer go through it, so flipping `shopState` is the only edit needed.
2. `content/faq.ts`: the exact seed from the brief. A selector `visibleFaqs()` returns approved entries, plus drafts when `showDrafts` is true, and never entries with an empty answer.
3. `content/story.ts`: the five chapters verbatim from the brief with an `accent` field naming the one word to style.
4. `content/messages.ts`: `export const messages: string[] = []`.

## 6. Ask the founder system

### 6.1 Experience
Exactly as the brief: caption, giant serif input with red rule and blinking red caret, rotating typed placeholder every 3s from approved questions, six chips, AnswerCard with word reveal and red marker, Skip, two related chips, Share this answer, no match state with the send form.

Accessibility: `<form role="search">`, a real `<label>` (visually hidden), chips are `<button>`, the answer region is `aria-live="polite"` and receives the full text at once (screen readers get the final text, the visual reveal is decorative), Skip is focusable, Escape clears.

Related questions: same category first, then nearest by Fuse score, never the same entry.

### 6.2 Matching
1. Normalize: lowercase, strip punctuation, collapse spaces, expand a small slang map (u to you, ur to your, wyd to what are you doing, fr to for real, rn to right now, bro and pls removed, kya and hai style Hinglish fillers removed).
2. Keyword boost first: if the normalized text contains a boost token (face, shop, shipping, refund, collab, sponsor, name, meaning, god, atheist, money, billionaire, contact, dm), that intent becomes a candidate with a fixed strong score.
3. Fuse over question 0.5, aliases 0.4, answer 0.1, `ignoreLocation`, threshold 0.38, `minMatchCharLength` 3, `includeScore`.
4. Accept the best result only if score is at or under a gate (starting value 0.32, tuned by the test table). Otherwise no match.
5. If the winner is a todo entry or a hidden draft, show no match, so the question still reaches you. That is how the inbox tells you which todo answers to write first.
6. Test table: at least 40 phrases in `match.test.ts`, every approved question in 3+ phrasings, typos, slang, Hinglish, and 8+ nonsense inputs that must return no match. Results get reported back into this file after the build.

### 6.3 Unanswered question logging
**Finding: Web3Forms free plan does not allow server side API calls**, only browser form posts. A route handler forwarding to Web3Forms would need their paid plan.

**DECISION A**, pick one:
1. (recommended) Keep `/api/ask` for the honeypot, length checks and rate limit, then send the email with Resend free tier (3,000 emails a month, server side allowed, key in env). Same result in your inbox, zero cost.
2. Post from the browser straight to Web3Forms free. Works, but no server side rate limit and the access key is visible in the page (Web3Forms says that is fine by design).
3. Web3Forms paid plan behind `/api/ask`, exactly as the brief.

Either way: fields are question, optional email, timestamp. No IP, no user agent, no storage. The in memory rate limit is best effort on Vercel because each serverless instance has its own memory; good enough against casual spam, documented in README.

### 6.4 Share links
`/?ask=how-lines` works as specified: on load it scrolls to Ask and plays that answer.

Problem: a link with a query string cannot have its own OG image without making the whole home page dynamic, which costs speed. **Proposal:** the Share button copies `ktamizen.com/ask/how-lines`. That route is statically generated per answer, has its own title and OG image (the stretch card), and immediately redirects to `/?ask=how-lines` for humans. Instagram previews show the answer card, the home page stays static. **DECISION B:** yes or keep plain `/?ask=`.

### 6.5 Analytics
**Finding: Vercel Web Analytics custom events need the Pro plan** (Hobby has page views only). Plausible supports custom events and custom properties on every plan, about 9 USD a month, no cookies.

**DECISION C:** Plausible (recommended, gives no_match text as a property) or Vercel Analytics (needs Vercel Pro for events).

Events: ask_submitted, answer_shown {id}, answer_shared {id}, no_match {q}, waitlist_joined, shop_clicked, instagram_clicked. `track()` is a typed no-op until the provider is configured.

### 6.6 Waitlist
Brief says one email field and Tell me first, but no provider is named. **DECISION D:** where do waitlist emails go? Options: Resend Audiences (free, same key as 6.3, recommended), Mailchimp, ConvertKit, or the same email inbox as the questions. Default if you do not answer: same relay as 6.3 into your inbox.

## 7. Proposed copy (needs approval)

Everything below is not in the brief. Voice: short, dry, lowercase where it is microcopy.

1. Meta description: built from zero, one week after another. no face, just the words. powered by God. (101 chars)
2. Story accent words, one per chapter: hardest (red), back (italic), nobody (red), timing (italic), whole (italic).
3. Hero scroll cue label: scroll
4. Ask input label for screen readers: ask the founder anything
5. Skip button: skip. Share button: share this answer. After copy: link copied.
6. No match confirm after send: got it. if it's a good one, you'll see it here.
7. Waitlist success: you're on the list. Waitlist error: that email looks off. try again.
8. Ask error (network): didn't go through. try again in a minute.
9. For brands headline: one page. no face. real reach.
10. For brands body: 340k+ followers. roughly 16M+ views a month. people who come for the words and stay for them. if your brand fits that, email me.
11. For brands buttons: email me, collabstr, instagram
12. Footer privacy note: no cookies. no tracking you. if you send a question or your email, it only reaches me.
13. Footer digital products line: digital products are for personal use. no refunds, except if i made a mistake.
14. Messages section caption (only renders when messages exist): what you send me
15. Numbers labels: followers, monthly views (with caption roughly), weeks in a row. Fourth line: zero faces.
16. 404 page: nothing here. go back.

## 8. Placeholders I will leave

All live in `config/site.ts` or `.env.example` and are listed again in README.md.

1. Contact email
2. X URL (verify handle)
3. Collabstr URL
4. Gumroad URL
5. Shop URL (for when shop flips to live)
6. Site URL and domain (assumed ktamizen.com, confirm)
7. Email relay key (Resend or Web3Forms, per decision A) and receiving address
8. Analytics domain or token (per decision C)
9. Sloop Script Pro font file and license
10. OG image (generated in code by default, replaceable with a designed PNG)
11. Hero static fallback image (generated from the dither canvas at build time)
12. FAQ entries with status todo: face, money, shipping, repost
13. FAQ entries with status draft: who, how-long, regret, atheist, billionaire, shop-when, what-sell, collab, contact
14. `content/messages.ts` (empty until you have real messages with consent)

## 9. Build order and milestones (one commit each)

1. Scaffold, tokens, fonts, global styles, `js` class strategy, copy lint script, bundle budget script
2. Layout, Lenis + ScrollTrigger, reduced motion and device guards, debug param
3. Content layer: config, faq, story, messages, selectors
4. Ask the founder: normalize, match, test table green, UI, share links, `/api/ask`
5. Preloader and hero (dither canvas, WordReveal, buttons)
6. Statement strip, numbers, story and signature, messages
7. What is coming, waitlist, for brands, footer, cursor, grain, magnetic buttons
8. Performance pass, accessibility pass, SEO (metadata, JSON-LD FAQPage and Organization, sitemap, robots, icons, manifest)
9. Stretch: `/api/og` answer cards
10. README, CONTENT_TODO.md, final copy lint, Lighthouse mobile report

After every section: dev server, Playwright screenshots at 390 and 1440, compare against the brief, fix, then commit. The screenshots get committed to `/docs/screens/` so you can review them on GitHub from your phone.

## 10. Risks and how I handle them

1. **Instagram in-app browser.** Pinning with a collapsing address bar can jump. I use `svh` units, `ScrollTrigger.config({ ignoreMobileResize: true })`, `normalizeScroll` off, and Lenis only on desktop (native touch scroll feels better and is more reliable in WebViews). I test with a WebView user agent in Playwright.
2. **Preloader vs LCP and no JS.** The preloader is an overlay drawn in CSS from the server HTML, only shown under `.js`, and its wordmark is real text so LCP lands immediately. Hard cap 1.2s.
3. **Blur on many words** is expensive on phones. Blur is used only on the few hero words and the answer card, never on the story (that uses opacity only).
4. **JS budget.** GSAP, Lenis and Next together sit near the limit, so Fuse and the Ask UI load lazily, and the budget script fails the build above 200 KB gz.
5. **Copy lint vs code.** The ban scanner reads only visible text nodes and attribute text like alt and aria-label in the built HTML, so CSS variables (which use double hyphens by syntax) do not trip it. Apostrophes inside words (i'm, that's) are allowed because they are not quotation marks; straight and curly double quotes and paired single quotes are flagged.
6. **Founder privacy.** The lint script also fails on a small denylist you can fill (surname, city, employer) so nothing slips into the build.

## 11. Decisions needed from you

| | Question | My recommendation |
|---|---|---|
| A | Unanswered questions relay | Resend free behind `/api/ask` |
| B | Share links with own OG image via `/ask/[id]` | yes |
| C | Analytics | Plausible |
| D | Waitlist destination | Resend Audiences |
| E | Domain | ktamizen.com, confirm |
| F | Proposed copy in section 7 | approve or rewrite line by line |
| G | Gray captions on white become black, white focus ring on red | approve |
