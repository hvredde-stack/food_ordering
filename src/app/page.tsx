import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ScanLine, ChefHat, BarChart3, Utensils } from "lucide-react";
import { ScrollRevealInit } from "@/components/scroll-reveal-init";
import { CursorLight } from "@/components/cursor-light";
import { Logo } from "@/components/ui/logo";

// Public marketing landing. Where ads, social posts, and word-of-mouth land.
// Calm, editorial, one clear CTA per section. Sign-up flow is the goal.
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollRevealInit />
      <CursorLight />
      {/* Thin nav, transparent on hero, hairline border. */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-bg/85 border-b border-border/70">
        <nav className="max-w-[1400px] mx-auto px-[clamp(20px,5vw,60px)] h-[68px] flex items-center justify-between">
          <Link href="/" aria-label="TapServe — home" className="block">
            <Logo className="h-7 w-auto" />
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
                className="image-vignette relative w-full overflow-hidden rounded-sm border border-border"
                style={{ aspectRatio: "4 / 5" }}
              >
                {/* A plated dish on a candlelit surface — sits on the warmer
                    end of the palette so the brass type stays legible. */}
                <Image
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=1125&fit=crop&q=85&auto=format"
                  alt="A plated dish on a candlelit table"
                  fill
                  sizes="(max-width: 768px) 90vw, 540px"
                  className="object-cover ken-burns"
                  priority
                />
                {/* Scrim ensures eyebrow + display type read against any
                    region of the photo. Lives above the vignette gradient. */}
                <div
                  className="absolute inset-0 flex flex-col justify-between p-8 md:p-12"
                  style={{
                    zIndex: 4,
                    background:
                      "linear-gradient(to bottom, rgba(26,20,16,0.55) 0%, rgba(26,20,16,0) 30%, rgba(26,20,16,0) 55%, rgba(26,20,16,0.7) 100%)",
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-fg/85">
                      Plate № 04
                    </div>
                    <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-fg/85">
                      In service
                    </div>
                  </div>
                  <div>
                    <div
                      className="font-display italic font-light leading-[1.05] tracking-tight text-fg"
                      style={{ fontSize: "clamp(32px, 4.5vw, 56px)" }}
                    >
                      Slow food,
                      <br />
                      faster tickets.
                    </div>
                    <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-fg/75 mt-6 leading-relaxed">
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
            <div className="max-w-2xl observe">
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

            <div className="mt-16 grid md:grid-cols-3 gap-12 md:gap-8 observe-stagger observe">
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

        {/* Editorial photo bleed — a wide interior shot that resets the
            page emotionally between explainers and feature grid. The brass
            curtain peels off as the section enters view. */}
        <section className="observe border-t border-border overflow-hidden">
          <div
            className="image-curtain image-vignette relative w-full"
            style={{ aspectRatio: "21 / 9" }}
          >
            <Image
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=2400&h=1029&fit=crop&q=85&auto=format"
              alt="A dim, candlelit dining room"
              fill
              sizes="100vw"
              className="object-cover ken-burns"
            />
            <div
              className="absolute inset-0 flex items-end pointer-events-none"
              style={{ zIndex: 5 }}
            >
              <div className="max-w-[1400px] mx-auto px-[clamp(20px,5vw,60px)] py-12 md:py-20 w-full">
                <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-fg/80">
                  The room you don't have to staff
                </div>
                <div
                  className="font-display italic font-light leading-[1.05] tracking-tight mt-4 text-fg"
                  style={{ fontSize: "clamp(28px, 4vw, 56px)" }}
                >
                  Quiet floors.<br />
                  Loud <em className="not-italic font-normal text-accent">kitchens.</em>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="border-t border-border">
          <div className="max-w-[1400px] mx-auto px-[clamp(20px,5vw,60px)] py-24 md:py-32">
            <div className="grid md:grid-cols-[1fr,1.4fr] gap-12 md:gap-20 items-start observe">
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

              <div className="md:pl-8 grid sm:grid-cols-2 gap-x-12 gap-y-12 observe-stagger observe">
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

        {/* Closing CTA — full-bleed dim restaurant photo behind, with a
            heavy walnut wash so the type and CTA stay editorial. The photo
            drifts via ken burns; the wash is what keeps the contrast. */}
        <section className="relative border-t border-border overflow-hidden">
          <div className="absolute inset-0" style={{ zIndex: 0 }}>
            <Image
              src="https://images.unsplash.com/photo-1497644083578-611b798c60f3?w=2400&h=1200&fit=crop&q=85&auto=format"
              alt=""
              fill
              sizes="100vw"
              className="object-cover ken-burns"
              aria-hidden
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(26,20,16,0.92) 0%, rgba(26,20,16,0.85) 50%, rgba(26,20,16,0.95) 100%)",
              }}
            />
          </div>
          <div
            className="relative max-w-[1400px] mx-auto px-[clamp(20px,5vw,60px)] py-24 md:py-32 text-center observe"
            style={{ zIndex: 1 }}
          >
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
              <Logo className="h-6 w-auto" />
              <p className="text-sm text-muted mt-4 leading-relaxed max-w-[220px]">
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
    // Editorial step frame: hairline at the top, large light brass numeral,
    // breathing space between the number and the title. The hairline gives
    // each step a clear "pull-quote" feel without leaning on imagery.
    <div className="border-t border-border pt-10">
      <div className="font-display text-5xl tracking-tight text-accent-2 leading-none font-light">
        {no}
      </div>
      <h3 className="font-display text-3xl tracking-tight mt-8 leading-[1.1]">
        {title}
      </h3>
      <p className="text-muted mt-5 leading-[1.7] text-[15px]">{desc}</p>
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
