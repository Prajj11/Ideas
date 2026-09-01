import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Compass, ArrowLeft, Loader2, Sparkles, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode?: "signin" | "signup" } => {
    return {
      mode: search["mode"] === "signup" ? "signup" : "signin",
    };
  },
  head: () => ({
    meta: [
      { title: "Sign In | Safr — AI Travel Safety Companion" },
      { name: "description", content: "Sign in or create an account to plan safer trips across Goa." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode || "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name.trim() || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          return;
        }
        navigate({ to: "/setup" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication error");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12 relative overflow-hidden text-foreground selection:bg-primary/20">
        <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-coral/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-cyan/15 blur-[130px]" />

        <div className="relative z-10 w-full max-w-sm rounded-3xl border border-border/60 bg-card/85 backdrop-blur-2xl p-8 text-center shadow-2xl">
          <div className="size-12 rounded-2xl bg-emerald/10 text-emerald flex items-center justify-center mx-auto mb-4">
            <Sparkles className="size-6" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">Check your email</h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            We sent a secure confirmation link to <span className="font-bold text-foreground">{email}</span>. Click it to finish setting up your account.
          </p>
          <Button variant="outline" className="mt-6 w-full rounded-full font-bold text-xs" onClick={() => setSent(false)}>
            Back to Sign In
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12 relative overflow-hidden text-foreground selection:bg-primary/20">
      {/* Ambient Lighting */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-coral/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-cyan/15 blur-[130px]" />

      <div className="relative z-10 w-full max-w-sm">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-4 rounded-full bg-secondary/80 px-3 py-1 border border-border/40"
        >
          <ArrowLeft className="size-3.5" /> Back to Safr Home
        </Link>

        <div className="rounded-3xl border border-border/60 bg-card/85 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="size-10 rounded-2xl bg-gradient-to-br from-primary via-cyan to-coral flex items-center justify-center shadow-sm">
              <Compass className="size-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-bold font-display tracking-tight">Safr</span>
              <span className="ml-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Goa</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "signin" ? "Sign in to access your Goa safety dashboard." : "One account to keep your family safe across India."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold uppercase text-muted-foreground">
                  Your Full Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  maxLength={60}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kaitlyn D'Souza"
                  className="rounded-xl bg-secondary/40 border-border/60"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-xl bg-secondary/40 border-border/60"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold uppercase text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="rounded-xl bg-secondary/40 border-border/60"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-full font-bold bg-primary text-primary-foreground shadow-md transition-all hover:scale-[1.02] active:scale-95 mt-4"
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : mode === "signin" ? (
                "Sign In"
              ) : (
                "Create Free Account"
              )}
            </Button>
          </form>

          <button
            type="button"
            className="mt-5 w-full text-center text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Don't have an account? Create one" : "Already registered? Sign in"}
          </button>
        </div>
      </div>
    </main>
  );
}
