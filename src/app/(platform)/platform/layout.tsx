import Link from "next/link";
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
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">Restricted</div>
        <h1 className="font-display text-4xl tracking-tight mt-4">Platform admin only</h1>
        <p className="text-muted mt-4 leading-relaxed">
          You're signed in, but you're not a platform admin. Add your email to the{" "}
          <code className="text-xs px-1.5 py-0.5 rounded bg-bg-alt">PLATFORM_ADMIN_EMAILS</code>{" "}
          env var, or ask an existing platform admin to invite you.
        </p>
        <Link href="/admin" className="inline-block mt-8 nav-link">
          Back to admin
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex md:w-64 flex-col border-r border-border bg-card">
        <div className="p-6 border-b border-border">
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted leading-none">
            Console
          </div>
          <div className="font-display text-xl mt-2 tracking-tight leading-tight">
            Platform
          </div>
          <div className="font-mono text-[10px] text-muted mt-2 truncate">{ctx.email ?? "platform admin"}</div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-bg-alt transition"
            >
              <Icon className="w-4 h-4 text-muted" />
              <span className="font-mono text-xs tracking-[0.14em] uppercase">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border flex items-center justify-between">
          <UserButton />
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="md:hidden border-b border-border bg-card px-5 py-4 flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">Console</div>
            <div className="font-display text-base mt-1">Platform</div>
          </div>
          <UserButton />
        </div>
        <div className="md:hidden border-b border-border overflow-x-auto flex gap-1 px-3 py-2 bg-card">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-md whitespace-nowrap inline-flex items-center gap-1 hover:bg-bg-alt"
            >
              <Icon className="w-3.5 h-3.5 text-muted" />
              <span className="font-mono text-[11px] tracking-[0.14em] uppercase">{label}</span>
            </Link>
          ))}
        </div>
        {children}
      </main>
    </div>
  );
}
