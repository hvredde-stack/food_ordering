// Editorial wordmark for app headers. Tenant-aware: shows the restaurant
// name (large serif) on tenant pages, "Platform" on platform pages,
// "Food Ordering" everywhere else.

import Link from "next/link";

interface Props {
  /** The label to render. Restaurants pass their name; platform passes "Platform". */
  label: string;
  /** Small caps eyebrow above the label, e.g. "RESTAURANT", "PLATFORM", "KITCHEN". */
  context?: string;
  /** Optional href; renders a Link when set, plain div otherwise. */
  href?: string;
  className?: string;
}

export function Wordmark({ label, context, href, className }: Props) {
  const inner = (
    <div className={className}>
      {context && (
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted leading-none">
          {context}
        </div>
      )}
      <div className="font-display text-lg leading-tight tracking-tight mt-1">
        {label}
      </div>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
