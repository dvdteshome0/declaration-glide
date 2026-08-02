import { createFileRoute } from "@tanstack/react-router";
import { LoginCard } from "@/components/LoginCard";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Agent Sign In | Customs Clearing Portal" },
      { name: "description", content: "Secure sign in for customs clearing agency staff." },
      { property: "og:title", content: "Agent Sign In | Customs Clearing Portal" },
      {
        property: "og:description",
        content: "Secure sign in for customs clearing agency staff.",
      },
    ],
  }),
  component: () => (
    <LoginCard
      title="Agent sign in"
      description="Access the internal declaration management console."
      redirectTo="/admin/dashboard"
      demoEmail="admin@customsportal.com"
    />
  ),
});