import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Clerk gates the staff/admin surfaces. Customer pages — including the
// slug-scoped /<slug>/t/<code> and /<slug>/to/<code> entry pages — are
// deliberately excluded. Realtime token issuance authenticates via the
// customer session cookie OR Clerk and is decided at the API route level.
const isProtected = createRouteMatcher([
  // Global routers / shims
  "/admin(.*)",
  "/server",
  "/onboarding(.*)",
  "/platform(.*)",
  "/after-sign-in(.*)",

  // Slug-prefixed staff surfaces. Customer paths (/<slug>/t/, /<slug>/to/)
  // are intentionally NOT listed here.
  "/:slug/admin(.*)",
  "/:slug/server",
  "/:slug/kitchen",

  // API
  "/api/admin(.*)",
  "/api/kitchen(.*)",
  "/api/server(.*)",
  "/api/platform(.*)",
  "/api/onboarding(.*)",
]);

const isPublicAuth = createRouteMatcher([
  "/admin/sign-in(.*)",
  "/admin/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req) && !isPublicAuth(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
