import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { PortalHeader } from "@/components/PortalHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePortalSession } from "@/lib/auth";
import { DECLARATION_STATUSES, fetchDeclarations, formatDate } from "@/lib/declarations";

export const Route = createFileRoute("/_authenticated/client/dashboard")({
  head: () => ({
    meta: [
      { title: "My Declarations | Customs Clearing Portal" },
      { name: "description", content: "View the live clearance status of your import shipments." },
      { property: "og:title", content: "My Declarations | Customs Clearing Portal" },
      {
        property: "og:description",
        content: "View the live clearance status of your import shipments.",
      },
    ],
  }),
  component: ClientDashboard,
});

function ClientDashboard() {
  const { email } = usePortalSession();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data = [], isLoading } = useQuery({
    queryKey: ["declarations", "client"],
    queryFn: fetchDeclarations,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.filter((row) => {
      const matchesTerm =
        !term ||
        row.declaration_number.toLowerCase().includes(term) ||
        row.commodity.toLowerCase().includes(term);
      return matchesTerm && (statusFilter === "all" || row.declaration_status === statusFilter);
    });
  }, [data, search, statusFilter]);

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader email={email} role="Importer" homeTo="/client/dashboard" />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold">My declarations</h1>
          <p className="text-sm text-muted-foreground">
            Read-only view of every declaration filed on your behalf.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search declaration # or commodity"
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
        </div>

        {isLoading && <Loader2 className="size-6 animate-spin text-muted-foreground" />}
        {!isLoading && filtered.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No declarations found for your account yet.
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((row) => (
            <Card key={row.id} className="shadow-card transition-shadow hover:shadow-elevated">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold">{row.declaration_number}</p>
                    <p className="text-sm text-muted-foreground">{row.commodity}</p>
                  </div>
                  <StatusBadge status={row.declaration_status} />
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <dt>Submitted</dt>
                    <dd className="font-medium text-foreground">
                      {formatDate(row.date_submitted)}
                    </dd>
                  </div>
                  <div>
                    <dt>Cleared customs</dt>
                    <dd className="font-medium text-foreground">
                      {formatDate(row.date_cleared_customs)}
                    </dd>
                  </div>
                </dl>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/client/declaration/$id" params={{ id: row.id }}>
                    View details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}