import { cn } from "@/lib/utils";
import { statusTone } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize",
        statusTone(status)
      )}
    >
      {status}
    </span>
  );
}
