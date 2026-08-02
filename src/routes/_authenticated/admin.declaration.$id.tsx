import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";
import { PortalHeader } from "@/components/PortalHeader";
import { DeclarationDetail } from "@/components/DeclarationDetail";
import { Button } from "@/components/ui/button";
import { usePortalSession } from "@/lib/auth";
import { fetchDeclaration } from "@/lib/declarations";

export const Route = createFileRoute("/_authenticated/admin/declaration/$id")({
  head: () => ({
    meta: [
      { title: "Declaration Details | Customs Clearing Portal" },
      { name: "description", content: "Full declaration record, timeline and documents." },
      { property: "og:title", content: "Declaration Details | Customs Clearing Portal" },
      {
        property: "og:description",
        content: "Full declaration record, timeline and documents.",
      },
    ],
  }),
  component: AdminDeclarationDetail,
});

function AdminDeclarationDetail() {
  const { id } = Route.useParams();
  const { email } = usePortalSession();
  const { data, isLoading, error } = useQuery({
    queryKey: ["declaration", id],
    queryFn: () => fetchDeclaration(id),
  });

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader email={email} role="Customs Agent" homeTo="/admin/dashboard" />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/dashboard">
              <ArrowLeft className="size-4" /> Back to dashboard
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/admin/edit/$id" params={{ id }}>
              <Pencil className="size-4" /> Edit
            </Link>
          </Button>
        </div>
        {isLoading && <Loader2 className="size-6 animate-spin text-muted-foreground" />}
        {error && <p className="text-sm text-destructive">Declaration not found.</p>}
        {data && <DeclarationDetail declaration={data} />}
      </main>
    </div>
  );
}