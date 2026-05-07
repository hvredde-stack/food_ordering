import type { MetadataRoute } from "next";

// PWA manifest. Customers tap "Add to Home Screen" after scanning a table or
// takeout QR; iOS locks the saved tile to the URL they were on, so each
// saved icon is effectively a bookmark to a specific table or pickup counter.
// start_url is just the fallback when no context exists.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TapServe",
    short_name: "TapServe",
    description:
      "Scan, order from your table or for takeout — no app, no sign-up.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1A1410",
    theme_color: "#1A1410",
    categories: ["food", "lifestyle"],
    icons: [
      { src: "/icon", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon1", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
