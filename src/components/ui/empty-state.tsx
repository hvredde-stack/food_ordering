import { cn } from "@/lib/utils";

// What the user sees when a list is empty. Default text-only "no results"
// copy looked like a bug; this gives the moment the same editorial
// treatment as everything else — eyebrow, display title, supporting copy,
// optional CTA.
interface Props {
  icon?: React.ReactNode;
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon, eyebrow, title, description, action, className,
}: Props) {
  return (
    <div
      className={cn(
        "border border-border rounded-sm py-16 px-6 text-center bg-bg-alt/40",
        className
      )}
    >
      {icon && (
        <div className="text-muted/60 mx-auto mb-6 flex justify-center">
          {icon}
        </div>
      )}
      {eyebrow && (
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted leading-none">
          {eyebrow}
        </div>
      )}
      <h3 className="font-display font-light text-2xl md:text-3xl tracking-tight mt-4 leading-tight">
        {title}
      </h3>
      {description && (
        <p className="text-muted mt-4 max-w-sm mx-auto leading-[1.7] text-[14px]">
          {description}
        </p>
      )}
      {action && <div className="mt-8 flex justify-center">{action}</div>}
    </div>
  );
}
