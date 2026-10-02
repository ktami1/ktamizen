// Single source of truth for links, numbers and shop state.
// Values marked PLACEHOLDER must be replaced before launch (see README).

export type ShopState = "coming-soon" | "live";

export const site = {
  name: "KTAMIZEN",
  tagline: "Powered by God",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ktamizen.com", // PLACEHOLDER: confirm domain
  description:
    "built from zero, one week after another. no face, just the words. powered by God.",

  shopState: "coming-soon" as ShopState,
  shopUrl: "https://shop.ktamizen.com", // PLACEHOLDER
  gumroadUrl: "https://gumroad.com", // PLACEHOLDER

  instagramUrl: "https://www.instagram.com/ktamizen",
  instagramHandle: "@ktamizen",
  xUrl: "https://x.com/ktamizen", // PLACEHOLDER: verify handle
  email: "hello@ktamizen.com", // PLACEHOLDER
  collabstrUrl: "https://collabstr.com", // PLACEHOLDER

  // Rounded and evergreen. Never show exact figures.
  numbers: {
    followers: { value: 340, suffix: "k+", label: "followers" },
    views: { value: 16, suffix: "M+", label: "monthly views", note: "roughly" },
    weeks: { value: 100, suffix: "+", label: "weeks in a row" },
    years: "2.5",
  },

  // Show FAQ entries with status draft. Off until he approves them.
  showDrafts: false,
} as const;

export function shopCta() {
  return site.shopState === "live"
    ? { label: "Open the shop", href: site.shopUrl, kind: "shop" as const }
    : { label: "Get notified when the shop opens", href: "#coming", kind: "waitlist" as const };
}
