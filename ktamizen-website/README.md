# KTAMIZEN landing site

Holding site for KTAMIZEN while the shop is being built. Next.js App Router, TypeScript, Tailwind v4, GSAP (ScrollTrigger, SplitText, CustomEase), Lenis. One page, one scroll.

This is the **dummy version**: everything looks and moves like the final site, but nothing is sent anywhere yet. Ask the founder answers from local data, and the waitlist and send it to me forms only show a confirmation. See Placeholders below.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
npm run lint:copy    # after a build: scans the HTML for emoji, quotes, dashes, banned words
```

Debug: add `?debug` to the URL to see the ScrollTrigger markers.

Screenshots at 390 and 1440 (server must be running on port 3100):

```bash
npx next start -p 3100 &
node scripts/shots.mjs        # writes screens-tmp/
node scripts/ask-check.mjs    # asks real questions and prints the answers
```

Review screenshots live in `docs/screens/`.

## Page, in order

1. Preloader: first visit only, about 1.2s, skipped with reduced motion
2. Hero: pinned, red ember drawn as a Bayer dither that goes from coarse to fine as you scroll, then KTAMI + ZEN., POWERED BY GOD., two buttons
3. Statement strip: POWERED BY GOD wider than the screen, drifting with scroll speed
4. Numbers on white: 340k+, 16M+ (roughly), 100+, zero faces
5. Story: five pinned chapters, characters light up as you scroll, then the signature
6. Messages: hidden while `content/messages.ts` is empty
7. Ask the founder + FAQ accordion (server rendered, FAQPage JSON-LD)
8. What is coming: the one red section, waitlist
9. For brands
10. Footer

Everything is readable with JavaScript off and with reduced motion: the text is in the HTML, the animations only enhance it.

## How to

### Add or edit an answer
Open `content/faq.ts`. Every entry has `status`:
- `approved`: shown
- `draft`: shown only when `showDrafts: true` in `config/site.ts`
- `todo`: never shown while `answer` is empty

The six chips in Ask the founder are the first six visible entries. The accordion and the JSON-LD update from the same file.

### Flip the shop state
In `config/site.ts` set `shopState: "live"` and fill `shopUrl`. Every shop button, the red section and the shop-when answer switch automatically.

### Replace placeholders
All in `config/site.ts`, marked `PLACEHOLDER`:
- contact `email`
- `xUrl` (verify the handle)
- `collabstrUrl`
- `gumroadUrl`
- `shopUrl`
- `url` / `NEXT_PUBLIC_SITE_URL` (domain, assumed ktamizen.com)

### Sloop Script Pro
The signature Ktami uses Instrument Serif italic until the licensed file is in place. To switch:
1. Put the web font at `public/fonts/SloopScriptPro.woff2`
2. In `app/globals.css`, replace the Sloop comment with:

```css
@font-face {
  font-family: "Sloop Script Pro";
  src: url("/fonts/SloopScriptPro.woff2") format("woff2");
  font-display: swap;
}
```

### Make the dummy real (next step)
1. **Unanswered questions**: Web3Forms free does not accept server side calls, so the plan is a route at `/api/ask` sending mail with Resend (free tier), with honeypot and rate limit. Hook it into `NoMatch` in `components/AskTheFounder.tsx`.
2. **Waitlist**: same relay or Resend Audiences. Hook it into `WaitlistForm` in `components/Coming.tsx`.
3. **Matching**: `lib/ask.ts` is a simple token matcher. Swap for the Fuse.js version described in `PLAN.md` with the 40 phrase test table.
4. **Analytics**: Plausible recommended (Vercel Analytics custom events need the Pro plan). Events planned: ask_submitted, answer_shown, answer_shared, no_match, waitlist_joined, shop_clicked, instagram_clicked.

## Domain and DNS (Vercel)

1. Import the repo in Vercel, framework Next.js, no settings to change.
2. Project, Settings, Domains: add `ktamizen.com` and `www.ktamizen.com`.
3. At your registrar: `A` record for `@` to `76.76.21.21`, `CNAME` for `www` to `cname.vercel-dns.com`. Vercel shows the exact values if they change.
4. Set `NEXT_PUBLIC_SITE_URL=https://ktamizen.com` in the Vercel environment variables.
5. When the shop is ready on `shop.ktamizen.com`, add that `CNAME` to wherever the shop is hosted, then flip `shopState`.

## Budget

First load JS is about 184 KB gzipped (limit 200). GSAP and Lenis load after first paint. If they fail to load within 5 seconds, the page falls back to the static version.

## Fonts

Instrument Serif and Inter Tight come from Google Fonts via `next/font` (OFL). `assets/InstrumentSerif-Regular.ttf` is used only to draw the icons and share images.
