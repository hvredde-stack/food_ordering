import Link from "next/link";

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Food Ordering</h1>
      <p className="mt-3 text-muted">Multi-tenant restaurant ordering platform.</p>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <Tile href="/admin" title="Admin portal" desc="Manage menu, orders, analytics" />
        <Tile href="/kitchen" title="Kitchen dashboard" desc="Real-time order queue" />
        <Tile href="/server" title="Server app" desc="Mark tables cleaned" />
        <Tile href="/t/demo/T-01" title="Customer demo" desc="Scan-to-order on table T-01" />
      </div>
    </main>
  );
}

function Tile({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-border bg-card p-5 hover:bg-muted transition"
    >
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-muted mt-1">{desc}</div>
    </Link>
  );
}
