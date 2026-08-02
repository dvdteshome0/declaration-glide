import { Check } from "lucide-react";
import { STATUS_DOT, TIMELINE_STEPS, type DeclarationStatus } from "@/lib/declarations";
import { cn } from "@/lib/utils";

export function StatusTimeline({ status }: { status: DeclarationStatus }) {
  if (status === "Cancelled") {
    return (
      <div className="rounded-lg border border-status-cancelled/40 bg-status-cancelled/10 p-4 text-sm font-medium text-status-cancelled">
        This declaration was cancelled and is no longer being processed.
      </div>
    );
  }

  const currentIndex = TIMELINE_STEPS.indexOf(status);

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-2">
      {TIMELINE_STEPS.map((step, index) => {
        const done = index <= currentIndex;
        return (
          <li key={step} className="flex flex-1 gap-3 sm:flex-col sm:gap-2">
            <div className="flex flex-col items-center sm:w-full sm:flex-row">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold",
                  done
                    ? cn("border-transparent text-primary-foreground", STATUS_DOT[step])
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  "w-0.5 flex-1 sm:h-0.5 sm:w-full",
                  index === TIMELINE_STEPS.length - 1 ? "bg-transparent" : done ? "bg-accent" : "bg-border",
                )}
              />
            </div>
            <span
              className={cn(
                "pb-6 text-xs font-medium sm:pb-0",
                done ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}