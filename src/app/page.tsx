import Link from "next/link";
import { Utensils, ChefHat, Hammer, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Food Ordering</h1>
      <p className="mt-3 text-muted">Multi-tenant restaurant ordering platform.</p>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <Tile
          href="/admin"
          icon={<ShieldCheck className="w-4 h-4" />}
          title="Admin portal"
          desc="Manage menu, tables, settings, analytics"
        />
        <Tile
          href="/kitchen"
          icon={<ChefHat className="w-4 h-4" />}
          title="Kitchen dashboard"
          desc="Real-time order queue (staff login)"
        />
        <Tile
          href="/server"
          icon={<Hammer className="w-4 h-4" />}
          title="Server app"
          desc="Scan a table QR to mark cleaned (staff login)"
        />
        <div className="rounded-xl border border-dashed border-border bg-card p-5">
          <div className="font-semibold flex items-center gap-1.5">
            <Utensils className="w-4 h-4" /> Customers
          </div>
          <div className="text-sm text-muted mt-1">
            Customers reach the menu by scanning a QR generated in <code className="text-xs px-1 py-0.5 rounded bg-muted">Admin → Tables</code>{" "}
            or the master takeout QR in <code className="text-xs px-1 py-0.5 rounded bg-muted">Admin → Settings</code>.
          </div>
        </div>
      </div>
    </main>
  );
}

function Tile({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-border bg-card p-5 hover:bg-muted transition"
    >
      <div className="font-semibold flex items-center gap-1.5">
        {icon} {title}
      </div>
      <div className="text-sm text-muted mt-1">{desc}</div>
    </Link>
  );
}
