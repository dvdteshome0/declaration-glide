import { createFileRoute } from "@tanstack/react-router";
import { LoginCard } from "@/components/LoginCard";

export const Route = createFileRoute("/client-login")({
  head: () => ({
    meta: [
      { title: "Importer Sign In | Customs Clearing Portal" },
      { name: "description", content: "Importers sign in to track their import declarations." },
      { property: "og:title", content: "Importer Sign In | Customs Clearing Portal" },
      {
        property: "og:description",
        content: "Importers sign in to track their import declarations.",
      },
    ],
  }),
  component: () => (
    <LoginCard
      title="Importer sign in"
      description="Track the clearance progress of your shipments."
      redirectTo="/client/dashboard"
      demoEmail="client@goldenafrica.com"
    />
  ),
});