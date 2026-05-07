import { cn } from "@/lib/utils";

// TapServe brand lockup. The mark and wordmark share a single SVG so
// scaling stays in proportion automatically — set height via className,
// width follows the 4.5:1 aspect ratio of the lockup.
//
// Variants:
//   "dark"  — ivory wordmark + brass mark. The default. For walnut bg.
//   "light" — walnut wordmark + walnut mark. For ivory bg, light photos.
//   "seal"  — brass mark only, no wordmark. For social avatars,
//             watermarks, sealed-envelope moments.
//
// Per the brand book: brass is reserved for the mark and CTAs; the
// wordmark stays ivory (or walnut on light surfaces). Don't tint either
// from the consumer side.

interface Props {
  variant?: "dark" | "light" | "seal";
  className?: string;
  /** Accessible label. Defaults to "TapServe". */
  label?: string;
}

export function Logo({ variant = "dark", className, label = "TapServe" }: Props) {
  if (variant === "seal") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 80 80"
        role="img"
        aria-label={label}
        className={cn("h-9 w-auto", className)}
      >
        <title>{label}</title>
        <rect x="5" y="5" width="70" height="70" rx="3" fill="none" stroke="#C9A76E" strokeWidth="2" />
        <rect x="28" y="28" width="24" height="24" rx="1.5" fill="#C9A76E" />
      </svg>
    );
  }

  const isLight = variant === "light";
  const wordFill = isLight ? "#1A1410" : "#F4E9D6";
  const markStroke = isLight ? "#1A1410" : "#C9A76E";
  const markFill = isLight ? "#1A1410" : "#C9A76E";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 360 80"
      role="img"
      aria-label={label}
      className={cn("h-9 w-auto", className)}
    >
      <title>{label}</title>
      <rect x="3" y="5" width="70" height="70" rx="3" fill="none" stroke={markStroke} strokeWidth="2" />
      <rect x="26" y="28" width="24" height="24" rx="1.5" fill={markFill} />
      <text
        x="92"
        y="56"
        fontFamily="Fraunces, Georgia, ui-serif, serif"
        fontSize="48"
        fontWeight="400"
        fontStyle="italic"
        letterSpacing="-0.5"
        fill={wordFill}
      >
        TapServe
      </text>
    </svg>
  );
}
