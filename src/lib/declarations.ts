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

export interface DeclarationItem {
  id?: string;
  declaration_id?: string;
  position: number;
  description: string;
  hs_code: string | null;
  quantity: number | null;
  unit: string | null;
  unit_value: number | null;
  currency: string;
  country_of_origin: string | null;
}

export function emptyItem(position: number): DeclarationItem {
  return {
    position,
    description: "",
    hs_code: "",
    quantity: null,
    unit: "",
    unit_value: null,
    currency: "USD",
    country_of_origin: "",
  };
}

export function itemLineTotal(item: DeclarationItem) {
  if (item.quantity == null || item.unit_value == null) return null;
  return item.quantity * item.unit_value;
}

export function summarizeItems(items: DeclarationItem[]) {
  const named = items.map((item) => item.description.trim()).filter(Boolean);
  if (named.length === 0) return "";
  if (named.length === 1) return named[0]!;
  return `${named[0]} + ${named.length - 1} more item${named.length > 2 ? "s" : ""}`;
}

export const PAYMENT_BASES = ["Per truck", "Per declaration", "Other"] as const;
export type PaymentBasis = (typeof PAYMENT_BASES)[number];

export interface DeclarationPayment {
  id?: string;
  declaration_id?: string;
  position: number;
  amount_birr: number | null;
  basis: PaymentBasis;
  other_reason: string | null;
  collected_on: string;
  collected_by: string | null;
  note: string | null;
}

export function emptyPayment(position: number): DeclarationPayment {
  return {
    position,
    amount_birr: null,
    basis: "Per declaration",
    other_reason: "",
    collected_on: new Date().toISOString().slice(0, 10),
    collected_by: "",
    note: "",
  };
}

export function paymentsTotal(payments: DeclarationPayment[]) {
  return payments.reduce((sum, payment) => sum + (payment.amount_birr ?? 0), 0);
}

export function formatBirr(value: number | null | undefined) {
  if (value == null) return "—";
  return `ETB ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function paymentReason(payment: DeclarationPayment) {
  return payment.basis === "Other" ? payment.other_reason?.trim() || "Other" : payment.basis;
}

export async function saveDeclarationPayments(
  declarationId: string,
  payments: DeclarationPayment[],
) {
  const { error: deleteError } = await supabase
    .from("declaration_payments")
    .delete()
    .eq("declaration_id", declarationId);
  if (deleteError) throw deleteError;

  const rows = payments
    .filter((payment) => payment.amount_birr != null && payment.amount_birr > 0)
    .map((payment, index) => ({
      declaration_id: declarationId,
      position: index + 1,
      amount_birr: payment.amount_birr as number,
      basis: payment.basis,
      other_reason: payment.basis === "Other" ? payment.other_reason?.trim() || null : null,
      collected_on: payment.collected_on || new Date().toISOString().slice(0, 10),
      collected_by: payment.collected_by?.trim() || null,
      note: payment.note?.trim() || null,
    }));

  if (rows.length) {
    const { error } = await supabase.from("declaration_payments").insert(rows);
    if (error) throw error;
  }
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
  items?: DeclarationItem[];
  payments?: DeclarationPayment[];
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
    .select("*, declaration_items(*), declaration_payments(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Declaration not found");
  const { declaration_items, declaration_payments, ...row } = data as typeof data & {
    declaration_items?: DeclarationItem[];
    declaration_payments?: DeclarationPayment[];
  };
  const declaration = normalize([row])[0]!;
  declaration.items = (declaration_items ?? []).sort((a, b) => a.position - b.position);
  declaration.payments = (declaration_payments ?? []).sort((a, b) => a.position - b.position);
  return declaration;
}

export async function saveDeclarationItems(declarationId: string, items: DeclarationItem[]) {
  const { error: deleteError } = await supabase
    .from("declaration_items")
    .delete()
    .eq("declaration_id", declarationId);
  if (deleteError) throw deleteError;

  const rows = items
    .filter((item) => item.description.trim())
    .map((item, index) => ({
      declaration_id: declarationId,
      position: index + 1,
      description: item.description.trim(),
      hs_code: item.hs_code?.trim() || null,
      quantity: item.quantity,
      unit: item.unit?.trim() || null,
      unit_value: item.unit_value,
      currency: item.currency?.trim() || "USD",
      country_of_origin: item.country_of_origin?.trim() || null,
    }));

  if (rows.length) {
    const { error } = await supabase.from("declaration_items").insert(rows);
    if (error) throw error;
  }
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