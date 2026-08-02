import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PortalHeader } from "@/components/PortalHeader";
import { DeclarationForm } from "@/components/DeclarationForm";
import { usePortalSession } from "@/lib/auth";
import { fetchDeclaration } from "@/lib/declarations";

export const Route = createFileRoute("/_authenticated/admin/edit/$id")({
  head: () => ({
    meta: [
      { title: "Edit Declaration | Customs Clearing Portal" },
      { name: "description", content: "Update declaration details, status and attachments." },
      { property: "og:title", content: "Edit Declaration | Customs Clearing Portal" },
      {
        property: "og:description",
        content: "Update declaration details, status and attachments.",
      },
    ],
  }),
  component: EditDeclaration,
});

function EditDeclaration() {
  const { id } = Route.useParams();
  const { email } = usePortalSession();
  const { data, isLoading } = useQuery({
    queryKey: ["declaration", id],
    queryFn: () => fetchDeclaration(id),
  });

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader email={email} role="Customs Agent" homeTo="/admin/dashboard" />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-bold">
          Edit declaration {data ? data.declaration_number : ""}
        </h1>
        {isLoading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <DeclarationForm declaration={data ?? null} />
        )}
      </main>
    </div>
  );
}