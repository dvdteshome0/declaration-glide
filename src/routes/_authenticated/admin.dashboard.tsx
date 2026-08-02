import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, FileWarning, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PortalHeader } from "@/components/PortalHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePortalSession } from "@/lib/auth";
import {
  DECLARATION_STATUSES,
  exportToCsv,
  fetchDeclarations,
  formatDate,
  formatDateTime,
} from "@/lib/declarations";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | Customs Clearing Portal" },
      {
        name: "description",
        content: "Manage import declarations, clearance status and client records.",
      },
      { property: "og:title", content: "Admin Dashboard | Customs Clearing Portal" },
      {
        property: "og:description",
        content: "Manage import declarations, clearance status and client records.",
      },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { email, isAdmin, loading } = usePortalSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["declarations", "admin"],
    queryFn: fetchDeclarations,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.filter((row) => {
      const matchesTerm =
        !term ||
        row.declaration_number.toLowerCase().includes(term) ||
        row.importer_name.toLowerCase().includes(term) ||
        row.importer_tin.toLowerCase().includes(term) ||
        row.commodity.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || row.declaration_status === statusFilter;
      const matchesFrom = !from || row.date_submitted >= from;
      const matchesTo = !to || row.date_submitted <= to;
      return matchesTerm && matchesStatus && matchesFrom && matchesTo;
    });
  }, [data, search, statusFilter, from, to]);

  const now = new Date();
  const summary = [
    {
      label: "Total active",
      value: data.filter((d) => !["Exited", "Cancelled"].includes(d.declaration_status)).length,
      tone: "text-primary",
    },
    {
      label: "Pending payment",
      value: data.filter((d) => d.declaration_status === "Submitted").length,
      tone: "text-status-submitted",
    },
    {
      label: "Awaiting bank clearance",
      value: data.filter((d) => d.declaration_status === "Paid").length,
      tone: "text-status-paid",
    },
    {
      label: "Cleared this month",
      value: data.filter(
        (d) =>
          d.date_cleared_customs &&
          new Date(d.date_cleared_customs).getMonth() === now.getMonth() &&
          new Date(d.date_cleared_customs).getFullYear() === now.getFullYear(),
      ).length,
      tone: "text-status-cleared",
    },
    {
      label: "Cancelled",
      value: data.filter((d) => d.declaration_status === "Cancelled").length,
      tone: "text-status-cancelled",
    },
  ];

  const remove = async (id: string) => {
    const { error } = await supabase.from("import_declarations").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Declaration deleted.");
    queryClient.invalidateQueries({ queryKey: ["declarations"] });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <FileWarning className="size-10 text-destructive" />
        <h1 className="text-xl font-semibold">Administrator access required</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This account is registered as an importer. Use the client portal to view your
          declarations.
        </p>
        <Button onClick={() => navigate({ to: "/client/dashboard" })}>Go to client portal</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader email={email} role="Customs Agent" homeTo="/admin/dashboard" />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Declarations overview</h1>
            <p className="text-sm text-muted-foreground">
              {data.length} declarations on file · {filtered.length} shown
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exportToCsv(filtered)}>
              <Download className="size-4" /> Export CSV
            </Button>
            <Button asChild>
              <Link to="/admin/add-declaration">
                <Plus className="size-4" /> Add new declaration
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {summary.map((card) => (
            <Card key={card.label} className="shadow-card">
              <CardContent className="p-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {card.label}
                </p>
                <p className={`mt-2 text-3xl font-bold ${card.tone}`}>{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-card">
          <CardContent className="grid gap-3 p-4 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search declaration #, importer or TIN"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {DECLARATION_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Declaration #</TableHead>
                  <TableHead>Importer</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Last updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      Loading declarations…
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No declarations match your filters.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-semibold">{row.declaration_number}</TableCell>
                    <TableCell>
                      <span className="block">{row.importer_name}</span>
                      <span className="text-xs text-muted-foreground">{row.importer_tin}</span>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">{row.commodity}</TableCell>
                    <TableCell>
                      <StatusBadge status={row.declaration_status} />
                    </TableCell>
                    <TableCell>{formatDate(row.date_submitted)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(row.last_updated)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" aria-label="View">
                          <Link to="/admin/declaration/$id" params={{ id: row.id }}>
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="icon" aria-label="Edit">
                          <Link to="/admin/edit/$id" params={{ id: row.id }}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete"
                          onClick={() => setPendingDelete(row.id)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={() => setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this declaration?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the record. The action is recorded in the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) void remove(pendingDelete);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}