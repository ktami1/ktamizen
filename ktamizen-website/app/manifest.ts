import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KTAMIZEN",
    short_name: "KTAMIZEN",
    description: "no face, just the words. powered by God.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
