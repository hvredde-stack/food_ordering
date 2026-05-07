import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Thin, quiet nav — letter-spaced caps, underline-on-hover via .nav-link */}
      <header className="border-b border-border">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-lg tracking-tight">
            <span className="opacity-90">Food Ordering</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/admin"    className="nav-link">Admin</Link>
            <Link href="/kitchen"  className="nav-link">Kitchen</Link>
            <Link href="/server"   className="nav-link">Server</Link>
            <Link href="/platform" className="nav-link">Platform</Link>
          </div>
        </nav>
      </header>

      {/* Hero — oversized display type, generous whitespace, mono accents */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-32 md:pb-40">
          <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted">
            № 001 — A multi-tenant ordering platform
          </div>
          <h1 className="font-display mt-8 text-[14vw] md:text-[9vw] leading-[0.92] tracking-[-0.02em] max-w-5xl">
            Quiet ordering,
            <span className="italic font-light"> served</span> at the table.
          </h1>
          <p className="mt-10 max-w-xl text-base md:text-[17px] leading-[1.7] text-muted">
            Customers scan, browse, and order without an account. Kitchen sees
            every ticket in real time. Restaurant owners manage their menu,
            tables, and analytics from one place. You — the operator — onboard
            new restaurants from the platform console.
          </p>
        </section>

        {/* Surface index — editorial directory of every entry point */}
        <section className="border-t border-border bg-bg-alt">
          <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
            <div className="grid gap-y-16 md:grid-cols-12">
              <div className="md:col-span-4">
                <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted">
                  Surfaces
                </div>
                <h2 className="font-display text-4xl md:text-5xl mt-4 leading-tight">
                  Four roles, four<br />distinct entrances.
                </h2>
              </div>

              <div className="md:col-span-8 md:pl-12">
                <div className="divide-y divide-border">
                  <Row
                    no="01"
                    href="/admin"
                    title="Restaurant admin"
                    desc="Owners curate the menu, tables, takeout QR, and read analytics."
                  />
                  <Row
                    no="02"
                    href="/kitchen"
                    title="Kitchen dashboard"
                    desc="Real-time queue grouped by table and takeout group. Mark items preparing → ready → served."
                  />
                  <Row
                    no="03"
                    href="/server"
                    title="Server app"
                    desc="Staff scan a table QR to mark it cleaned and reset for the next party."
                  />
                  <Row
                    no="04"
                    href="/platform"
                    title="Platform console"
                    desc="Onboard restaurants. View cross-tenant metrics. Suspend, reactivate, monitor."
                  />
                </div>

                <p className="mt-12 text-sm text-muted leading-relaxed max-w-md">
                  Customers reach the menu only by scanning a QR code printed
                  by their restaurant — generated on the Tables page after the
                  owner adds a table.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between text-xs text-muted">
          <div className="font-mono tracking-[0.18em] uppercase">
            Food Ordering — internal preview
          </div>
          <div className="font-mono tracking-[0.18em] uppercase opacity-70">
            v3
          </div>
        </div>
      </footer>
    </div>
  );
}

function Row({
  no,
  href,
  title,
  desc,
}: {
  no: string;
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group grid grid-cols-[40px,1fr,auto] gap-6 py-7 items-baseline transition"
    >
      <div className="font-mono text-xs text-muted tracking-[0.18em]">{no}</div>
      <div>
        <div className="font-display text-2xl md:text-3xl group-hover:italic transition-all">
          {title}
        </div>
        <div className="text-sm text-muted mt-2 leading-relaxed max-w-md">
          {desc}
        </div>
      </div>
      <div className="font-mono text-xs text-muted opacity-0 group-hover:opacity-100 transition-opacity">
        ↗
      </div>
    </Link>
  );
}
