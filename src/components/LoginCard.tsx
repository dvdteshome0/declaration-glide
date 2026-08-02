import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Anchor, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

export function LoginCard({
  title,
  description,
  redirectTo,
  demoEmail,
}: {
  title: string;
  description: string;
  redirectTo: "/admin/dashboard" | "/client/dashboard";
  demoEmail: string;
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error("Invalid email or password.");
      return;
    }
    toast.success("Signed in.");
    navigate({ to: redirectTo });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-navy-foreground/80 hover:text-navy-foreground"
        >
          <ArrowLeft className="size-4" /> Back to home
        </Link>
        <Card className="shadow-elevated">
          <CardHeader className="space-y-3 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-navy text-gold">
              <Anchor className="size-6" />
            </span>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(errors["email"])}
                />
                {errors["email"] && <p className="text-xs text-destructive">{errors["email"]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(errors["password"])}
                />
                {errors["password"] && (
                  <p className="text-xs text-destructive">{errors["password"]}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                Sign in
              </Button>
            </form>
            <button
              type="button"
              onClick={() => {
                setEmail(demoEmail);
                setPassword("password123");
              }}
              className="mt-4 w-full rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Use demo credentials · {demoEmail}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}