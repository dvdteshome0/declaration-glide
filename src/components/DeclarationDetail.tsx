import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadAttachment, formatDate, formatDateTime, type Declaration } from "@/lib/declarations";

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="text-sm font-medium break-words">{value || "—"}</p>
    </div>
  );
}

export function DeclarationDetail({ declaration }: { declaration: Declaration }) {
  const download = async (index: number) => {
    try {
      await downloadAttachment(declaration.attachments[index]!);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open file");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{declaration.declaration_number}</h1>
          <p className="text-sm text-muted-foreground">
            {declaration.importer_name} · {declaration.commodity}
          </p>
        </div>
        <StatusBadge status={declaration.declaration_status} />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Clearance progress</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTimeline status={declaration.declaration_status} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Importer</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Row label="Importer name" value={declaration.importer_name} />
            <Row label="TIN" value={declaration.importer_tin} />
            <Row label="Contact email" value={declaration.contact_email} />
            <Row label="Contact phone" value={declaration.contact_phone} />
            <Row label="Assigned agent" value={declaration.assigned_agent} />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Consignment</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Row label="Commodity" value={declaration.commodity} />
            <Row label="HS code" value={declaration.hs_code} />
            <Row label="Bill of lading" value={declaration.bill_of_lading_number} />
            <Row label="Health Ministry app. no" value={declaration.health_ministry_app_no} />
            <Row label="Trade Ministry app. no" value={declaration.trade_ministry_app_no} />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Key dates</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Row label="Date submitted" value={formatDate(declaration.date_submitted)} />
            <Row
              label="National Bank cleared"
              value={formatDate(declaration.national_bank_cleared_date)}
            />
            <Row label="Cleared customs" value={formatDate(declaration.date_cleared_customs)} />
            <Row label="Exited port" value={formatDate(declaration.date_exited_port)} />
            <Row label="Last updated" value={formatDateTime(declaration.last_updated)} />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Attachments &amp; remarks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {declaration.attachments.length === 0 && (
              <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
            )}
            {declaration.attachments.map((attachment, index) => (
              <Button
                key={attachment.path}
                variant="outline"
                className="w-full justify-start"
                onClick={() => download(index)}
              >
                <Paperclip className="size-4" />
                <span className="truncate">{attachment.name}</span>
              </Button>
            ))}
            <div className="pt-2">
              <Row label="Remarks" value={declaration.remarks} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}