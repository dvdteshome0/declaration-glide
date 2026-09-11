import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PAYMENT_BASES,
  emptyPayment,
  formatBirr,
  paymentsTotal,
  type DeclarationPayment,
  type PaymentBasis,
} from "@/lib/declarations";

interface Props {
  payments: DeclarationPayment[];
  onChange: (payments: DeclarationPayment[]) => void;
  error?: string | undefined;
}

function toNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function DeclarationPaymentsEditor({ payments, onChange, error }: Props) {
  const update = (index: number, patch: Partial<DeclarationPayment>) =>
    onChange(payments.map((payment, i) => (i === index ? { ...payment, ...patch } : payment)));

  const remove = (index: number) =>
    onChange(
      payments.filter((_, i) => i !== index).map((payment, i) => ({ ...payment, position: i + 1 })),
    );

  const total = paymentsTotal(payments);

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Payment collected (Ethiopian Birr)</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Record each amount collected and what it was charged for.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...payments, emptyPayment(payments.length + 1)])}
        >
          <Plus className="size-4" />
          Add payment
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-xs text-destructive">{error}</p>}
        {payments.length === 0 && (
          <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
        )}
        {payments.map((payment, index) => (
          <div key={index} className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Payment {index + 1}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor={`pay-amount-${index}`}>Amount collected (ETB)</Label>
                <Input
                  id={`pay-amount-${index}`}
                  inputMode="decimal"
                  placeholder="0.00"
                  value={payment.amount_birr ?? ""}
                  onChange={(event) => update(index, { amount_birr: toNumber(event.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`pay-basis-${index}`}>Charged</Label>
                <Select
                  value={payment.basis}
                  onValueChange={(value) => update(index, { basis: value as PaymentBasis })}
                >
                  <SelectTrigger id={`pay-basis-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_BASES.map((basis) => (
                      <SelectItem key={basis} value={basis}>
                        {basis}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`pay-date-${index}`}>Date collected</Label>
                <Input
                  id={`pay-date-${index}`}
                  type="date"
                  value={payment.collected_on ?? ""}
                  onChange={(event) => update(index, { collected_on: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`pay-by-${index}`}>Collected by</Label>
                <Input
                  id={`pay-by-${index}`}
                  value={payment.collected_by ?? ""}
                  onChange={(event) => update(index, { collected_by: event.target.value })}
                />
              </div>
              {payment.basis === "Other" && (
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                  <Label htmlFor={`pay-reason-${index}`}>
                    Reason for collection <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id={`pay-reason-${index}`}
                    rows={2}
                    placeholder="Write the reason for this collection"
                    value={payment.other_reason ?? ""}
                    onChange={(event) => update(index, { other_reason: event.target.value })}
                  />
                </div>
              )}
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <Label htmlFor={`pay-note-${index}`}>Note (optional)</Label>
                <Input
                  id={`pay-note-${index}`}
                  value={payment.note ?? ""}
                  onChange={(event) => update(index, { note: event.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
        {total > 0 && (
          <p className="text-sm font-medium">Total collected: {formatBirr(total)}</p>
        )}
      </CardContent>
    </Card>
  );
}
