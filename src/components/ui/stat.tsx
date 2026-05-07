import { cn } from "@/lib/utils";

// Editorial stat tile — a brass top-hairline anchors the eye, then a
// monospace eyebrow, then the headline number in display serif. The
// hairline is the most visible "brand moment" of the dashboards: it's the
// only place brass touches a card edge, so the dashboards never feel cold.
//
// Tabular-nums is essential — without it, "12,450" and "892" don't align
// in a row of stats and the editorial rhythm breaks.
interface Props {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}

export function Stat({ label, value, hint, className }: Props) {
  return (
    <div
      className={cn(
        "relative border-t border-border bg-card/60 px-5 py-6 transition-colors",
        // The brass top is rendered as a 2px ::before rather than a
        // border-top so a hover state can grow it without the card
        // jumping in height.
        "before:content-[''] before:absolute before:left-0 before:right-0 before:top-0",
        "before:h-px before:bg-accent/40 before:transition-all",
        "hover:before:h-[2px] hover:before:bg-accent/70",
        className
      )}
    >
      <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted leading-none">
        {label}
      </div>
      <div className="font-display font-light text-3xl md:text-[2.25rem] mt-4 tracking-tight tabular-nums leading-none">
        {value}
      </div>
      {hint && (
        <div className="font-mono text-[10px] text-muted mt-3 tracking-[0.14em]">
          {hint}
        </div>
      )}
    </div>
  );
}
