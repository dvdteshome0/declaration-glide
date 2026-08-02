import { createFileRoute, Link } from "@tanstack/react-router";
import { Anchor, BellRing, FileCheck2, Lock, ShieldCheck, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroImage from "@/assets/port-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Customs Clearing Client Portal | Import Declaration Tracking" },
      {
        name: "description",
        content:
          "Secure portal for customs clearing agents and importers to manage and track import declarations from submission to port exit.",
      },
      {
        property: "og:title",
        content: "Customs Clearing Client Portal | Import Declaration Tracking",
      },
      {
        property: "og:description",
        content:
          "Secure portal for customs clearing agents and importers to manage and track import declarations from submission to port exit.",
      },
    ],
  }),
  component: Index,
});

const FEATURES = [
  {
    icon: FileCheck2,
    title: "Declaration management",
    body: "Create, update and archive import declarations with full document attachments and validation.",
  },
  {
    icon: Timer,
    title: "Real-time status tracking",
    body: "Follow every consignment from Submitted through Paid, bank clearance, customs clearance and port exit.",
  },
  {
    icon: BellRing,
    title: "Automatic client alerts",
    body: "Importers are notified the moment a declaration status changes, with a full history retained.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    body: "Agents manage all records; importers see only their own declarations, enforced at the database level.",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-md bg-gold text-gold-foreground">
              <Anchor className="size-5" />
            </span>
            <span className="text-sm font-semibold sm:text-base">Customs Clearing Portal</span>
          </div>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-navy-foreground">
              <Link to="/client-login">Importer login</Link>
            </Button>
            <Button asChild size="sm" variant="gold">
              <Link to="/admin-login">Agent login</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-hero text-navy-foreground">
        <img
          src={heroImage}
          alt="Container terminal at dusk with gantry cranes loading a cargo ship"
          width={1600}
          height={900}
          className="absolute inset-0 size-full object-cover opacity-25"
        />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-navy/40 px-3 py-1 text-xs font-medium text-gold">
            <Lock className="size-3.5" /> Secure client portal
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Import declarations, cleared and tracked with confidence
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-navy-foreground/80 sm:text-lg">
            One system for your clearing agents and your importers — record declarations, attach
            documents, update clearance milestones and keep every client informed.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="gold">
              <Link to="/admin-login">Agent login</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/client-login">Importer login</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Built for clearing agencies
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Everything your team needs to move consignments through customs, and everything your
          clients need to stay informed.
        </p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="shadow-card">
              <CardContent className="space-y-3 p-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-navy text-gold">
                  <feature.icon className="size-5" />
                </span>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} Customs Clearing Client Portal. All records are audit
          logged.
        </div>
      </footer>
    </div>
  );
}
