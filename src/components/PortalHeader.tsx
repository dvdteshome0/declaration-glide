import { Link, useNavigate } from "@tanstack/react-router";
import { Anchor, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function PortalHeader({
  email,
  role,
  homeTo,
}: {
  email: string | null;
  role: "Customs Agent" | "Importer";
  homeTo: "/admin/dashboard" | "/client/dashboard";
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-navy text-navy-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to={homeTo} className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md bg-gold text-gold-foreground">
            <Anchor className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold">Customs Clearing Portal</span>
            <span className="block text-[11px] text-navy-foreground/70">{role}</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-navy-foreground/80 sm:block">{email}</span>
          <Button variant="secondary" size="sm" onClick={signOut}>
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}