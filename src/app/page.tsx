import Link from "next/link";
import { ArrowUpRight, ScanLine, ChefHat, BarChart3, Utensils } from "lucide-react";

// Public marketing landing. Where ads, social posts, and word-of-mouth land.
// Calm, editorial, one clear CTA per section. Sign-up flow is the goal.
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Thin nav, transparent on hero, hairline border. */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-bg/85 border-b border-border/70">
        <nav className="max-w-[1400px] mx-auto px-[clamp(20px,5vw,60px)] h-[68px] flex items-center justify-between">
          <Link href="/" className="font-display text-lg tracking-tight">
            Food Ordering
          </Link>
          <div className="flex items-center gap-8">
            <Link href="/admin/sign-in" className="nav-link hidden sm:inline-block">
              Sign in
            </Link>
            <Link
              href="/admin/sign-up"
              className="font-mono text-[11px] tracking-[0.2em] uppercase border-b border-fg pb-1 hover:text-accent-2 hover:border-accent-2 transition-colors duration-[350ms] ease-editorial"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero — value prop, lede, soft CTA. */}
        <section className="max-w-[1400px] mx-auto px-[clamp(20px,5vw,60px)] pt-16 md:pt-28 pb-24 md:pb-36">
          <div className="grid md:grid-cols-[1.1fr,1fr] gap-12 md:gap-20 items-center">
            <div>
              <div className="reveal reveal-1 font-mono text-[11px] tracking-[0.22em] uppercase text-muted">
                For independent restaurants
              </div>
              <h1
                className="reveal reveal-2 font-display font-light mt-8 tracking-[-0.025em] leading-[0.92]"
                style={{ fontSize: "clamp(56px, 9vw, 144px)" }}
              >
                Take orders.
                <br />
                Skip the<em className="italic font-light text-accent-2"> chaos.</em>
              </h1>
              <p className="reveal reveal-3 mt-10 max-w-[440px] text-[17px] leading-[1.7] text-muted">
                Customers scan a QR code, browse your menu, and order — without
                an app, without a sign-up. Your kitchen sees every order in real
                time. You see exactly what's selling. Setup takes ten minutes.
              </p>
              <div className="reveal reveal-4 mt-12 flex items-center gap-8 flex-wrap">
                <Link href="/admin/sign-up" className="text-link group">
                  <span>Start free — register your restaurant</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform duration-[350ms] ease-editorial group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
                <Link href="/admin/sign-in" className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted hover:text-accent-2 transition-colors">
                  Already a member? Sign in
                </Link>
              </div>
            </div>

            <aside className="reveal reveal-3">
              <div
                className="bg-bg-alt border border-border rounded-sm w-full overflow-hidden"
                style={{ aspectRatio: "4 / 5" }}
              >
                <div className="h-full flex flex-col justify-between p-8 md:p-12">
                  <div className="flex justify-between items-start">
                    <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
                      Plate № 04
                    </div>
                    <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
                      In service
                    </div>
                  </div>
                  <div>
                    <div
                      className="font-display italic font-light leading-[1.05] tracking-tight"
                      style={{ fontSize: "clamp(32px, 4.5vw, 56px)" }}
                    >
                      Slow food,
                      <br />
                      faster tickets.
                    </div>
                    <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mt-6 leading-relaxed">
                      Real-time kitchen queue · table or takeout · per-person attribution
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* How it works — three steps. */}
        <section className="bg-bg-warm border-t border-border">
          <div className="max-w-[1400px] mx-auto px-[clamp(20px,5vw,60px)] py-24 md:py-32">
            <div className="max-w-2xl">
              <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted">
                How it works
              </div>
              <h2
                className="font-display font-light mt-6 leading-[1.05] tracking-[-0.02em]"
                style={{ fontSize: "clamp(40px, 5vw, 72px)" }}
              >
                Ten minutes from <em className="italic font-light text-accent-2">sign-up</em> to taking orders.
              </h2>
            </div>

            <div className="mt-16 grid md:grid-cols-3 gap-12 md:gap-8">
              <Step
                no="01"
                title="Register your restaurant"
                desc="Sign up with your email. Tell us your restaurant's name and how many tables you have. We auto-generate everything else — slug, takeout code, table QR codes."
              />
              <Step
                no="02"
                title="Add your menu"
                desc="Categories, dishes, prices, descriptions, photos. Edit anytime. Customers see updates instantly. We even pre-fill iconography for famous dishes."
              />
              <Step
                no="03"
                title="Print your QR codes & open"
                desc="Each table gets its own QR code. There's a master QR for takeout. Customers scan, order, pay at the table. Kitchen sees the ticket within a second."
              />
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="border-t border-border">
          <div className="max-w-[1400px] mx-auto px-[clamp(20px,5vw,60px)] py-24 md:py-32">
            <div className="grid md:grid-cols-[1fr,1.4fr] gap-12 md:gap-20 items-start">
              <div>
                <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted">
                  What you get
                </div>
                <h2
                  className="font-display font-light mt-6 leading-[1.05] tracking-[-0.02em]"
                  style={{ fontSize: "clamp(40px, 5vw, 72px)" }}
                >
                  A full ordering<br />stack, <em className="italic font-light text-accent-2">included.</em>
                </h2>
                <p className="text-muted mt-8 leading-[1.7] max-w-[400px]">
                  Each restaurant gets four interfaces — for owners, kitchen,
                  servers, and customers. All built. All ready.
                </p>
              </div>

              <div className="md:pl-8 grid sm:grid-cols-2 gap-x-12 gap-y-12">
                <Feature
                  icon={<ScanLine className="w-5 h-5" />}
                  title="Customers scan & order"
                  desc="No app to download, no account to make. They scan a table QR, see your menu, place orders, get notified when ready."
                />
                <Feature
                  icon={<ChefHat className="w-5 h-5" />}
                  title="Kitchen in real time"
                  desc="Tickets appear instantly, grouped by table. Mark items preparing, ready, served. Each customer's name on every line."
                />
                <Feature
                  icon={<Utensils className="w-5 h-5" />}
                  title="Dine-in & takeout"
                  desc="Toggle either independently. Per-table QR for dine-in, master QR for takeout. Multiple customers per table or pickup group."
                />
                <Feature
                  icon={<BarChart3 className="w-5 h-5" />}
                  title="Analytics built in"
                  desc="Peak ordering hours, top dishes, revenue trends, customer sentiment, end-of-visit feedback. All on one screen."
                />
              </div>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-border bg-bg-warm">
          <div className="max-w-[1400px] mx-auto px-[clamp(20px,5vw,60px)] py-24 md:py-32 text-center">
            <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted">
              Ready when you are
            </div>
            <h2
              className="font-display font-light mt-6 leading-[1.02] tracking-[-0.02em]"
              style={{ fontSize: "clamp(48px, 7vw, 112px)" }}
            >
              Your restaurant,<br /><em className="italic font-light text-accent-2">online tonight.</em>
            </h2>
            <p className="text-muted mt-8 max-w-md mx-auto leading-[1.7]">
              Free during preview. No credit card required. Onboarding takes
              less time than a coffee break.
            </p>
            <div className="mt-12">
              <Link href="/admin/sign-up" className="text-link inline-flex group">
                <span>Register your restaurant</span>
                <ArrowUpRight className="w-4 h-4 transition-transform duration-[350ms] ease-editorial group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-[1400px] mx-auto px-[clamp(20px,5vw,60px)] py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div>
              <div className="font-display text-lg tracking-tight">Food Ordering</div>
              <p className="text-sm text-muted mt-3 leading-relaxed max-w-[220px]">
                A quietly built ordering platform for considered restaurants.
              </p>
            </div>
            <FooterCol heading="Get started" links={[
              { href: "/admin/sign-up", label: "Register your restaurant" },
              { href: "/admin/sign-in", label: "Sign in" },
            ]}/>
            <FooterCol heading="For staff" links={[
              { href: "/admin", label: "Restaurant admin" },
              { href: "/kitchen", label: "Kitchen dashboard" },
              { href: "/server", label: "Server app" },
            ]}/>
            <FooterCol heading="Made with" links={[
              { href: "https://nextjs.org", label: "Next.js 15" },
              { href: "https://supabase.com", label: "Supabase" },
              { href: "https://clerk.com", label: "Clerk" },
            ]}/>
          </div>

          <div className="border-t border-border mt-16 pt-8 flex flex-wrap items-center justify-between gap-3">
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted">
              © 2026 — Internal preview
            </div>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted">
              v3 · Linen
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Step({ no, title, desc }: { no: string; title: string; desc: string }) {
  return (
    <div>
      <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted">{no}</div>
      <h3 className="font-display text-3xl tracking-tight mt-4 leading-tight">{title}</h3>
      <p className="text-muted mt-4 leading-[1.7] text-[15px]">{desc}</p>
    </div>
  );
}

function Feature({
  icon, title, desc,
}: {
  icon: React.ReactNode; title: string; desc: string;
}) {
  return (
    <div>
      <div className="text-accent-2">{icon}</div>
      <h3 className="font-display text-xl tracking-tight mt-4">{title}</h3>
      <p className="text-muted mt-3 leading-[1.7] text-[15px]">{desc}</p>
    </div>
  );
}

function FooterCol({
  heading, links,
}: {
  heading: string; links: { href: string; label: string }[];
}) {
  return (
    <div>
      <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted">{heading}</div>
      <div className="mt-4 space-y-2">
        {links.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className="block text-sm transition-colors duration-[350ms] ease-editorial hover:text-accent-2"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
