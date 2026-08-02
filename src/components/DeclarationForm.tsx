import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
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
  ATTACHMENT_BUCKET,
  DECLARATION_STATUSES,
  STATUS_DOT,
  type Attachment,
  type Declaration,
  type DeclarationStatus,
} from "@/lib/declarations";
import { cn } from "@/lib/utils";

const schema = z.object({
  importer_name: z.string().trim().min(2, "Importer name is required").max(120),
  importer_tin: z.string().trim().min(3, "TIN is required").max(40),
  contact_phone: z.string().trim().min(6, "Contact phone is required").max(30),
  contact_email: z.string().trim().email("Enter a valid email address").max(255),
  commodity: z.string().trim().min(2, "Commodity is required").max(200),
  hs_code: z.string().trim().max(20).optional().or(z.literal("")),
  declaration_number: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{6}$/, "Use the format YYYY-NNNNNN (e.g. 2026-004521)"),
  bill_of_lading_number: z.string().trim().max(60).optional().or(z.literal("")),
  health_ministry_app_no: z.string().trim().max(60).optional().or(z.literal("")),
  trade_ministry_app_no: z.string().trim().max(60).optional().or(z.literal("")),
  declaration_status: z.enum(DECLARATION_STATUSES),
  national_bank_cleared_date: z.string().optional().or(z.literal("")),
  date_cleared_customs: z.string().optional().or(z.literal("")),
  date_exited_port: z.string().optional().or(z.literal("")),
  assigned_agent: z.string().trim().max(120).optional().or(z.literal("")),
  remarks: z.string().trim().max(2000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

function initialValues(declaration?: Declaration | null): FormValues {
  return {
    importer_name: declaration?.importer_name ?? "",
    importer_tin: declaration?.importer_tin ?? "",
    contact_phone: declaration?.contact_phone ?? "",
    contact_email: declaration?.contact_email ?? "",
    commodity: declaration?.commodity ?? "",
    hs_code: declaration?.hs_code ?? "",
    declaration_number: declaration?.declaration_number ?? "",
    bill_of_lading_number: declaration?.bill_of_lading_number ?? "",
    health_ministry_app_no: declaration?.health_ministry_app_no ?? "",
    trade_ministry_app_no: declaration?.trade_ministry_app_no ?? "",
    declaration_status: declaration?.declaration_status ?? "Submitted",
    national_bank_cleared_date: declaration?.national_bank_cleared_date ?? "",
    date_cleared_customs: declaration?.date_cleared_customs ?? "",
    date_exited_port: declaration?.date_exited_port ?? "",
    assigned_agent: declaration?.assigned_agent ?? "",
    remarks: declaration?.remarks ?? "",
  };
}

export function DeclarationForm({ declaration }: { declaration?: Declaration | null }) {
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>(() => initialValues(declaration));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Attachment[]>(declaration?.attachments ?? []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof FormValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const field = (key: keyof FormValues, label: string, required = false, type = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={key}
        type={type}
        value={values[key] ?? ""}
        onChange={(event) => set(key, event.target.value)}
        aria-invalid={Boolean(errors[key])}
      />
      {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
    </div>
  );

  const uploadFiles = async (declarationId: string) => {
    const uploaded: Attachment[] = [];
    for (const file of pendingFiles) {
      const path = `${declarationId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error } = await supabase.storage.from(ATTACHMENT_BUCKET).upload(path, file);
      if (error) throw error;
      uploaded.push({ path, name: file.name, size: file.size });
    }
    return uploaded;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      toast.error("Please correct the highlighted fields.");
      return;
    }
    if (
      parsed.data.declaration_status === "National Bank Cleared" &&
      !parsed.data.national_bank_cleared_date
    ) {
      setErrors({ national_bank_cleared_date: "Required for National Bank Cleared status" });
      toast.error("National Bank cleared date is required.");
      return;
    }
    setErrors({});
    setSaving(true);

    const payload = {
      ...parsed.data,
      hs_code: parsed.data.hs_code || null,
      bill_of_lading_number: parsed.data.bill_of_lading_number || null,
      health_ministry_app_no: parsed.data.health_ministry_app_no || null,
      trade_ministry_app_no: parsed.data.trade_ministry_app_no || null,
      national_bank_cleared_date: parsed.data.national_bank_cleared_date || null,
      date_cleared_customs: parsed.data.date_cleared_customs || null,
      date_exited_port: parsed.data.date_exited_port || null,
      assigned_agent: parsed.data.assigned_agent || null,
      remarks: parsed.data.remarks || null,
    };

    try {
      if (declaration) {
        const uploaded = await uploadFiles(declaration.id);
        const { error } = await supabase
          .from("import_declarations")
          .update({ ...payload, attachments: [...attachments, ...uploaded] })
          .eq("id", declaration.id);
        if (error) throw error;
        toast.success("Declaration updated.");
        navigate({ to: "/admin/declaration/$id", params: { id: declaration.id } });
      } else {
        const { data, error } = await supabase
          .from("import_declarations")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        const uploaded = await uploadFiles(data.id);
        if (uploaded.length) {
          await supabase
            .from("import_declarations")
            .update({ attachments: uploaded })
            .eq("id", data.id);
        }
        toast.success("Declaration created.");
        navigate({ to: "/admin/dashboard" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(
        message.includes("declaration_number")
          ? "That declaration number already exists."
          : message,
      );
    } finally {
      setSaving(false);
    }
  };

  const removeExisting = async (attachment: Attachment) => {
    setAttachments((prev) => prev.filter((item) => item.path !== attachment.path));
    await supabase.storage.from(ATTACHMENT_BUCKET).remove([attachment.path]);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Importer details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {field("importer_name", "Importer name", true)}
          {field("importer_tin", "Importer TIN", true)}
          {field("contact_phone", "Contact phone", true, "tel")}
          {field("contact_email", "Contact email", true, "email")}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Consignment &amp; documents</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {field("commodity", "Commodity", true)}
          {field("hs_code", "HS code")}
          {field("declaration_number", "Declaration number (YYYY-NNNNNN)", true)}
          {field("bill_of_lading_number", "Bill of lading number")}
          {field("health_ministry_app_no", "Health Ministry approval no.")}
          {field("trade_ministry_app_no", "Trade Ministry approval no.")}
          {field("assigned_agent", "Assigned agent")}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Clearance status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="declaration_status">
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={values.declaration_status}
              onValueChange={(value) => set("declaration_status", value as DeclarationStatus)}
            >
              <SelectTrigger id="declaration_status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DECLARATION_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    <span className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", STATUS_DOT[status])} />
                      {status}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {values.declaration_status === "National Bank Cleared" &&
            field("national_bank_cleared_date", "National Bank cleared date", true, "date")}
          {field("date_cleared_customs", "Date cleared customs", false, "date")}
          {field("date_exited_port", "Date exited port", false, "date")}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              rows={4}
              value={values.remarks ?? ""}
              onChange={(event) => set("remarks", event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label
            htmlFor="attachments"
            className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-4 py-6 text-sm text-muted-foreground hover:border-accent"
          >
            <Upload className="size-4" />
            Click to select files (multiple allowed)
          </Label>
          <input
            id="attachments"
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => setPendingFiles(Array.from(event.target.files ?? []))}
          />
          {attachments.map((attachment) => (
            <div
              key={attachment.path}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 truncate">
                <Paperclip className="size-4 text-muted-foreground" />
                {attachment.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeExisting(attachment)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
          {pendingFiles.map((file) => (
            <p key={file.name} className="text-xs text-muted-foreground">
              Ready to upload: {file.name}
            </p>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {declaration ? "Save changes" : "Create declaration"}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/dashboard" })}>
          Cancel
        </Button>
      </div>
    </form>
  );
}