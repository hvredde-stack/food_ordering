import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Clerk gates the staff/admin surfaces. Customer pages and the
// /api/realtime/token endpoint are deliberately excluded — those flows
// authenticate via the customer session cookie OR Clerk, decided at the
// API route level.
const isProtected = createRouteMatcher([
  "/admin(.*)",
  "/api/admin(.*)",
  "/kitchen(.*)",
  "/api/kitchen(.*)",
  "/server(.*)",
  "/api/server(.*)",
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
