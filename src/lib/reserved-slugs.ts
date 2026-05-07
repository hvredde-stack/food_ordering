// Slugs we cannot allow restaurants to claim, because they collide with
// global routes (or planned global routes). The onboarding wizard validates
// against this set, and the [slug] layout uses it as a fast-fail before
// touching the database.
//
// If you add a new top-level route, add its first segment here.

const RESERVED = new Set<string>([
  // Existing top-level routes / route groups (URL-visible parts)
  "admin", "platform", "onboarding", "api", "after-sign-in",

  // Customer in-session paths (not slug-scoped — they live at root)
  "menu", "cart", "feedback", "session", "order",

  // Static assets / Next.js conventions
  "_next", "static", "favicon.ico", "robots.txt", "sitemap.xml",
  "manifest.webmanifest", "sw.js", "offline.html",
  "icon", "icon1", "apple-icon",

  // Planned / common-collision reservations
  "auth", "login", "logout", "signin", "sign-in", "signout", "sign-out",
  "signup", "sign-up",
  "r", "u", "t", "to", "kitchen", "server",
  "app", "www", "mail", "help", "support", "docs",
  "about", "terms", "privacy", "contact", "blog", "pricing",
  "tapserve", "platform-admin", "billing", "settings",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED.has(slug.toLowerCase());
}

/** Tip surfaced to the wizard when a user picks a reserved slug. */
export const RESERVED_SLUG_HINT =
  "That URL is used by the platform itself. Try adding a word — e.g. \"-cafe\" or \"-kitchen\".";
