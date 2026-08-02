import { supabase } from "@/integrations/supabase/client";

export const DECLARATION_STATUSES = [
  "Submitted",
  "Paid",
  "National Bank Cleared",
  "Cleared",
  "Exited",
  "Cancelled",
] as const;

export type DeclarationStatus = (typeof DECLARATION_STATUSES)[number];

export interface Attachment {
  [key: string]: string | number | undefined;
  path: string;
  name: string;
  size?: number;
}

export interface Declaration {
  id: string;
  importer_name: string;
  importer_tin: string;
  contact_phone: string;
  contact_email: string;
  commodity: string;
  hs_code: string | null;
  declaration_number: string;
  bill_of_lading_number: string | null;
  health_ministry_app_no: string | null;
  trade_ministry_app_no: string | null;
  declaration_status: DeclarationStatus;
  national_bank_cleared_date: string | null;
  date_cleared_customs: string | null;
  date_exited_port: string | null;
  date_submitted: string;
  last_updated: string;
  assigned_agent: string | null;
  remarks: string | null;
  attachments: Attachment[];
}

export const STATUS_STYLES: Record<DeclarationStatus, string> = {
  Submitted: "bg-status-submitted/15 text-status-submitted border-status-submitted/40",
  Paid: "bg-status-paid/15 text-status-paid border-status-paid/40",
  "National Bank Cleared": "bg-status-bank/15 text-status-bank border-status-bank/40",
  Cleared: "bg-status-cleared/15 text-status-cleared border-status-cleared/40",
  Exited: "bg-status-exited/15 text-status-exited border-status-exited/40",
  Cancelled: "bg-status-cancelled/15 text-status-cancelled border-status-cancelled/40",
};

export const STATUS_DOT: Record<DeclarationStatus, string> = {
  Submitted: "bg-status-submitted",
  Paid: "bg-status-paid",
  "National Bank Cleared": "bg-status-bank",
  Cleared: "bg-status-cleared",
  Exited: "bg-status-exited",
  Cancelled: "bg-status-cancelled",
};

export const TIMELINE_STEPS: DeclarationStatus[] = [
  "Submitted",
  "Paid",
  "National Bank Cleared",
  "Cleared",
  "Exited",
];

export const ATTACHMENT_BUCKET = "declaration-attachments";

function normalize(rows: unknown[]): Declaration[] {
  return (rows as Declaration[]).map((row) => ({
    ...row,
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
  }));
}

export async function fetchDeclarations(): Promise<Declaration[]> {
  const { data, error } = await supabase
    .from("import_declarations")
    .select("*")
    .order("last_updated", { ascending: false });
  if (error) throw error;
  return normalize(data ?? []);
}

export async function fetchDeclaration(id: string): Promise<Declaration> {
  const { data, error } = await supabase
    .from("import_declarations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Declaration not found");
  return normalize([data])[0]!;
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function downloadAttachment(attachment: Attachment) {
  const { data, error } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .createSignedUrl(attachment.path, 120, { download: attachment.name });
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener");
}

const CSV_COLUMNS: (keyof Declaration)[] = [
  "declaration_number",
  "importer_name",
  "importer_tin",
  "contact_email",
  "contact_phone",
  "commodity",
  "hs_code",
  "bill_of_lading_number",
  "health_ministry_app_no",
  "trade_ministry_app_no",
  "declaration_status",
  "national_bank_cleared_date",
  "date_cleared_customs",
  "date_exited_port",
  "date_submitted",
  "last_updated",
  "assigned_agent",
  "remarks",
];

export function exportToCsv(rows: Declaration[], filename = "import-declarations.csv") {
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [
    CSV_COLUMNS.join(","),
    ...rows.map((row) => CSV_COLUMNS.map((col) => escape(row[col])).join(",")),
  ].join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}