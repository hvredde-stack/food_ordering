import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, UtensilsCrossed, ListOrdered, BarChart3, Table2, Settings } from "lucide-react";
import { getRestaurantBySlug } from "@/lib/auth";

// Sidebar items for an authenticated admin. Built lazily per-slug so the
// owner of /marioscafe and the owner of /pellegrino share the same JSX
// without sharing tenant context.
function nav(slug: string) {
  return [
    { href: `/${slug}/admin`,           label: "Overview",  icon: LayoutDashboard },
    { href: `/${slug}/admin/menu`,      label: "Menu",      icon: UtensilsCrossed },
    { href: `/${slug}/admin/tables`,    label: "Tables",    icon: Table2 },
    { href: `/${slug}/admin/orders`,    label: "Orders",    icon: ListOrdered },
    { href: `/${slug}/admin/analytics`, label: "Analytics", icon: BarChart3 },
    { href: `/${slug}/admin/settings`,  label: "Settings",  icon: Settings },
  ];
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Slug existence + reservation are validated by the parent [slug]/layout,
  // so a null result here would indicate a race we shouldn't paper over.
  const restaurant = await getRestaurantBySlug(slug);
  const tenantName = restaurant?.name ?? "Admin";
  const items = nav(slug);

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex md:w-64 flex-col border-r border-border bg-card">
        <div className="p-6 border-b border-border">
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted leading-none">
            Restaurant
          </div>
          <div className="font-display text-xl mt-2 tracking-tight leading-tight truncate">
            {tenantName}
          </div>
          <div className="font-mono text-[10px] text-muted mt-2 truncate">/{slug}</div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {items.map(({ href, label, icon: Icon }) => (
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
            <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">Restaurant</div>
            <div className="font-display text-base mt-1 truncate">{tenantName}</div>
          </div>
          <UserButton />
        </div>
        <div className="md:hidden border-b border-border overflow-x-auto flex gap-1 px-3 py-2 bg-card">
          {items.map(({ href, label, icon: Icon }) => (
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
