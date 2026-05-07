import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { LayoutDashboard, UtensilsCrossed, ListOrdered, BarChart3, Table2, Settings } from "lucide-react";

const NAV = [
  { href: "/admin",           label: "Overview",  icon: LayoutDashboard },
  { href: "/admin/menu",      label: "Menu",      icon: UtensilsCrossed },
  { href: "/admin/tables",    label: "Tables",    icon: Table2 },
  { href: "/admin/orders",    label: "Orders",    icon: ListOrdered },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings",  label: "Settings",  icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  // Sign-in/up pages render outside this layout because middleware allows them.
  // If a user lands here without auth, middleware has already redirected.
  if (!userId) return <>{children}</>;

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex md:w-60 flex-col border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <div className="text-xs uppercase tracking-wider text-muted">Admin</div>
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
          <UserButton />
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="md:hidden border-b border-border bg-card flex items-center justify-between px-4 py-3">
          <div className="font-semibold">Admin</div>
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
