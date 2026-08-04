import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface AmendmentChange {
  label: string;
  before: string;
  after: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changes: AmendmentChange[];
  saving: boolean;
  onConfirm: () => void;
}

export function AmendmentPreview({ open, onOpenChange, changes, saving, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Amendment preview</DialogTitle>
          <DialogDescription>
            Review the changes below before they are recorded against this declaration.
          </DialogDescription>
        </DialogHeader>

        {changes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No field changes detected. Saving will only refresh the last-updated time and any new
            attachments.
          </p>
        ) : (
          <ul className="space-y-3">
            {changes.map((change) => (
              <li key={change.label} className="rounded-md border border-border p-3">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {change.label}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded bg-muted px-2 py-1 line-through opacity-70">
                    {change.before || "—"}
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                  <span className="rounded bg-accent/15 px-2 py-1 font-medium">
                    {change.after || "—"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Keep editing
          </Button>
          <Button type="button" onClick={onConfirm} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Confirm amendment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}