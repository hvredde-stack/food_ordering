import { cn } from "@/lib/utils";

// Editorial page header used across every admin / platform / customer
// surface so the chrome reads consistently. Always: small monospace
// eyebrow, large display title, optional supporting copy underneath, and
// optional actions on the right that align to the bottom of the title.
//
// Skipping the eyebrow is allowed but unusual; missing one creates a "the
// page just starts" feeling and that's exactly what the unified pass was
// trying to fix. Keep one even when it's just the section name.
interface Props {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, lede, actions, className }: Props) {
  return (
    <div
      className={cn(
        "mb-10 md:mb-14 flex items-end justify-between gap-6 flex-wrap",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted leading-none">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display font-light text-4xl md:text-5xl mt-4 tracking-tight leading-[1.05]">
          {title}
        </h1>
        {lede && (
          <p className="text-muted mt-4 max-w-md text-[15px] leading-[1.7]">
            {lede}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
