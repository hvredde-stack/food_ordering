import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Building2, Shield } from "lucide-react";
import { getPlatformContext } from "@/lib/platform";

const NAV = [
  { href: "/platform",             label: "Overview",     icon: LayoutDashboard },
  { href: "/platform/restaurants", label: "Restaurants",  icon: Building2 },
  { href: "/platform/admins",      label: "Admins",       icon: Shield },
];

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getPlatformContext();
  if (!ctx) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">Platform admin only</h1>
        <p className="text-muted mt-2">
          You're signed in, but you're not a platform admin. Add your email to the{" "}
          <code className="text-xs px-1 py-0.5 rounded bg-muted">PLATFORM_ADMIN_EMAILS</code>{" "}
          env var, or ask an existing platform admin to invite you.
        </p>
        <Link href="/admin" className="inline-block mt-6 underline">
          Back to admin
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex md:w-60 flex-col border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <div className="text-xs uppercase tracking-wider text-muted">Platform</div>
          <div className="font-semibold">Food Ordering</div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted"
            >
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border flex items-center justify-between">
          <div className="text-xs text-muted truncate">{ctx.email ?? "platform admin"}</div>
          <UserButton />
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="md:hidden border-b border-border bg-card flex items-center justify-between px-4 py-3">
          <div className="font-semibold">Platform</div>
          <UserButton />
        </div>
        <div className="md:hidden border-b border-border overflow-x-auto flex gap-1 px-2 py-2 bg-card">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-md text-xs whitespace-nowrap inline-flex items-center gap-1 hover:bg-muted"
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </Link>
          ))}
        </div>
        {children}
      </main>
    </div>
  );
}
