import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PortalHeader } from "@/components/PortalHeader";
import { DeclarationDetail } from "@/components/DeclarationDetail";
import { Button } from "@/components/ui/button";
import { usePortalSession } from "@/lib/auth";
import { fetchDeclaration } from "@/lib/declarations";

export const Route = createFileRoute("/_authenticated/client/declaration/$id")({
  head: () => ({
    meta: [
      { title: "My Declaration | Customs Clearing Portal" },
      { name: "description", content: "Track the clearance progress of your import declaration." },
      { property: "og:title", content: "My Declaration | Customs Clearing Portal" },
      {
        property: "og:description",
        content: "Track the clearance progress of your import declaration.",
      },
    ],
  }),
  component: ClientDeclarationDetail,
});

function ClientDeclarationDetail() {
  const { id } = Route.useParams();
  const { email } = usePortalSession();
  const { data, isLoading, error } = useQuery({
    queryKey: ["declaration", id],
    queryFn: () => fetchDeclaration(id),
  });

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader email={email} role="Importer" homeTo="/client/dashboard" />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/client/dashboard">
            <ArrowLeft className="size-4" /> Back to my declarations
          </Link>
        </Button>
        {isLoading && <Loader2 className="size-6 animate-spin text-muted-foreground" />}
        {error && (
          <p className="text-sm text-destructive">
            This declaration is not available for your account.
          </p>
        )}
        {data && <DeclarationDetail declaration={data} />}
      </main>
    </div>
  );
}