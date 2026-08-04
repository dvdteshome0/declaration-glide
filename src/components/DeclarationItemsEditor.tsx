import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { emptyItem, itemLineTotal, type DeclarationItem } from "@/lib/declarations";

interface Props {
  items: DeclarationItem[];
  onChange: (items: DeclarationItem[]) => void;
  error?: string;
}

function toNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function DeclarationItemsEditor({ items, onChange, error }: Props) {
  const update = (index: number, patch: Partial<DeclarationItem>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const remove = (index: number) =>
    onChange(
      items.filter((_, i) => i !== index).map((item, i) => ({ ...item, position: i + 1 })),
    );

  const total = items.reduce((sum, item) => sum + (itemLineTotal(item) ?? 0), 0);

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Declared items</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            A single declaration can carry multiple items, each with its own HS code.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, emptyItem(items.length + 1)])}
        >
          <Plus className="size-4" />
          Add item
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-xs text-destructive">{error}</p>}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">No items added yet.</p>
        )}
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Item {index + 1}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <Label htmlFor={`item-desc-${index}`}>
                  Description <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`item-desc-${index}`}
                  value={item.description}
                  onChange={(event) => update(index, { description: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`item-hs-${index}`}>HS code</Label>
                <Input
                  id={`item-hs-${index}`}
                  value={item.hs_code ?? ""}
                  onChange={(event) => update(index, { hs_code: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`item-origin-${index}`}>Country of origin</Label>
                <Input
                  id={`item-origin-${index}`}
                  value={item.country_of_origin ?? ""}
                  onChange={(event) => update(index, { country_of_origin: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`item-qty-${index}`}>Quantity</Label>
                <Input
                  id={`item-qty-${index}`}
                  inputMode="decimal"
                  value={item.quantity ?? ""}
                  onChange={(event) => update(index, { quantity: toNumber(event.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`item-unit-${index}`}>Unit</Label>
                <Input
                  id={`item-unit-${index}`}
                  placeholder="kg, cartons, pcs"
                  value={item.unit ?? ""}
                  onChange={(event) => update(index, { unit: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`item-value-${index}`}>Unit value</Label>
                <Input
                  id={`item-value-${index}`}
                  inputMode="decimal"
                  value={item.unit_value ?? ""}
                  onChange={(event) => update(index, { unit_value: toNumber(event.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`item-currency-${index}`}>Currency</Label>
                <Input
                  id={`item-currency-${index}`}
                  value={item.currency}
                  onChange={(event) => update(index, { currency: event.target.value })}
                />
              </div>
            </div>
            {itemLineTotal(item) != null && (
              <p className="mt-3 text-xs text-muted-foreground">
                Line total: {itemLineTotal(item)!.toLocaleString()} {item.currency}
              </p>
            )}
          </div>
        ))}
        {total > 0 && (
          <p className="text-sm font-medium">
            Declared value total: {total.toLocaleString()} {items[0]?.currency ?? ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
