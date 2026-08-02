import { STATUS_DOT, STATUS_STYLES, type DeclarationStatus } from "@/lib/declarations";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: DeclarationStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        STATUS_STYLES[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {status}
    </span>
  );
}