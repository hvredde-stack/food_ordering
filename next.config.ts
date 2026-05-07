import type { NextConfig } from "next";

const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "**.b-cdn.net" },
      // Editorial photography on the marketing surfaces. Next/image proxies
      // and caches these locally on first hit, so Unsplash downtime won't
      // blank the hero after the first fetch in each region.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  // Permanent 301 redirects for the pre-slug-first URLs. Any printed QR
  // codes already in circulation will keep working forever; the new
  // canonical form is /<slug>/<feature>/<code>. Routes without a slug
  // segment in the original (/admin, /server) are handled in-app by tiny
  // shim pages that look up the signed-in user's restaurant.
  async redirects() {
    return [
      { source: "/kitchen/:slug",      destination: "/:slug/kitchen",      permanent: true },
      { source: "/t/:slug",            destination: "/:slug/t",            permanent: true },
      { source: "/t/:slug/:code",      destination: "/:slug/t/:code",      permanent: true },
      { source: "/to/:slug",           destination: "/:slug/to",           permanent: true },
      { source: "/to/:slug/:code",     destination: "/:slug/to/:code",     permanent: true },
    ];
  },
};

export default config;
