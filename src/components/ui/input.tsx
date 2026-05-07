import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-fg",
        "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent",
        className
      )}
      {...rest}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[80px] w-full rounded-lg border border-border bg-card p-3 text-sm text-fg",
        "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent",
        className
      )}
      {...rest}
    />
  )
);
Textarea.displayName = "Textarea";
