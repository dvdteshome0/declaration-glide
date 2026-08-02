import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface PortalSession {
  loading: boolean;
  session: Session | null;
  email: string | null;
  isAdmin: boolean;
}

export async function fetchIsAdmin(userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return Boolean(data);
}

export function usePortalSession(): PortalSession {
  const [state, setState] = useState<PortalSession>({
    loading: true,
    session: null,
    email: null,
    isAdmin: false,
  });

  useEffect(() => {
    let active = true;

    const resolve = async (session: Session | null) => {
      if (!session?.user) {
        if (active) setState({ loading: false, session: null, email: null, isAdmin: false });
        return;
      }
      const isAdmin = await fetchIsAdmin(session.user.id);
      if (active) {
        setState({
          loading: false,
          session,
          email: session.user.email ?? null,
          isAdmin,
        });
      }
    };

    supabase.auth.getSession().then(({ data }) => resolve(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void resolve(session);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}