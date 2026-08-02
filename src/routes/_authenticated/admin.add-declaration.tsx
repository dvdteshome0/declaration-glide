import { createFileRoute } from "@tanstack/react-router";
import { PortalHeader } from "@/components/PortalHeader";
import { DeclarationForm } from "@/components/DeclarationForm";
import { usePortalSession } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin/add-declaration")({
  head: () => ({
    meta: [
      { title: "New Declaration | Customs Clearing Portal" },
      { name: "description", content: "Record a new import declaration for an importer." },
      { property: "og:title", content: "New Declaration | Customs Clearing Portal" },
      {
        property: "og:description",
        content: "Record a new import declaration for an importer.",
      },
    ],
  }),
  component: AddDeclaration,
});

function AddDeclaration() {
  const { email } = usePortalSession();
  return (
    <div className="min-h-screen bg-background">
      <PortalHeader email={email} role="Customs Agent" homeTo="/admin/dashboard" />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-bold">Add new declaration</h1>
        <DeclarationForm />
      </main>
    </div>
  );
}