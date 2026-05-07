// Mono-formatted price. Tabular numbers + tightly tracked. Used wherever
// a currency amount appears so the editorial type system stays consistent.

import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function Money({
  cents,
  currency = "USD",
  className,
  size = "md",
}: {
  cents: number;
  currency?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm" ? "text-xs"
    : size === "lg" ? "text-base"
    : "text-sm";
  return (
    <span
      className={cn(
        "font-mono tabular-nums tracking-tight",
        sizeClass,
        className
      )}
    >
      {formatMoney(cents, currency)}
    </span>
  );
}
