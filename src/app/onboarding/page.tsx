// Self-serve onboarding wizard. Reached after Clerk sign-up via
// /after-sign-in when the user has no restaurant yet. Editorial layout
// matching the marketing landing — calm, focused, one task.

import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getOwnedRestaurant } from "@/lib/auth";
import { getPlatformContext } from "@/lib/platform";
import { OnboardingWizard } from "./wizard";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");

  // Already onboarded? Off to admin.
  const existing = await getOwnedRestaurant(userId);
  if (existing) redirect("/admin");

  // Platform admins don't need a restaurant.
  const platform = await getPlatformContext();
  if (platform) redirect("/platform");

  const u = await currentUser();
  const greeting =
    u?.firstName ||
    u?.username ||
    u?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
    "there";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-[1400px] mx-auto px-[clamp(20px,5vw,60px)] h-[68px] flex items-center justify-between">
          <div className="font-display text-lg tracking-tight">TapServe</div>
          <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted">
            Step 1 of 1 · Restaurant setup
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[760px] mx-auto px-[clamp(20px,5vw,60px)] py-16 md:py-24 w-full">
        <div className="reveal reveal-1 font-mono text-[11px] tracking-[0.22em] uppercase text-muted">
          Welcome
        </div>
        <h1
          className="reveal reveal-2 font-display font-light mt-6 leading-[0.95] tracking-[-0.02em]"
          style={{ fontSize: "clamp(48px, 7vw, 96px)" }}
        >
          Hello, {greeting}.<br />
          <em className="italic font-light text-accent-2">Tell us about</em> your restaurant.
        </h1>
        <p className="reveal reveal-3 mt-8 text-[17px] leading-[1.7] text-muted max-w-md">
          Just a few details. We'll auto-generate your tables, takeout QR,
          and a starter menu so every URL works the moment you're done.
        </p>

        <div className="reveal reveal-4 mt-12">
          <OnboardingWizard />
        </div>
      </main>
    </div>
  );
}
