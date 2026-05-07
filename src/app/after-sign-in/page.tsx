// Post-signin router. Clerk's default fallback URL points here, so we
// can route platform admins to /platform and restaurant admins to /admin
// without /admin ever sitting in browser history (which made the back
// button take platform admins to the restaurant view).

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getPlatformContext } from "@/lib/platform";

export const dynamic = "force-dynamic";

export default async function AfterSignIn() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");

  const platform = await getPlatformContext();
  if (platform) redirect("/platform");
  redirect("/admin");
}
