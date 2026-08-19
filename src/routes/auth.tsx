import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode?: "signin" | "signup" } => {
    return {
      mode: search.mode === "signup" ? "signup" : "signin",
    };
  },
  head: () => ({
    meta: [
      { title: "Sign in — Safr — AI travel safety companion" },
      { name: "description", content: "Sign in or create an account to plan safer trips." },
      { property: "og:title", content: "Sign in — Safr — AI travel safety companion" },
      { property: "og:description", content: "Sign in to plan safer trips." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50/40 via-orange-50/20 to-teal-50/30 px-5 relative overflow-hidden">
        {/* Subtle Ambient Background Elements */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-orange-400/10 blur-[80px] pointer-events-none z-0" />
        <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 h-[600px] w-[600px] rounded-full bg-teal-400/10 blur-[100px] pointer-events-none z-0" />
        
        <div className="relative z-10 w-full max-w-sm rounded-3xl border border-border/50 bg-card/60 p-8 text-center shadow-xl backdrop-blur-xl">
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Open it to finish creating your account.
          </p>
          <Button variant="outline" className="mt-6 w-full rounded-full h-11" onClick={() => setSent(false)}>
            Back
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50/40 via-orange-50/20 to-teal-50/30 px-5 py-10 relative overflow-hidden">
      {/* Subtle Ambient Background Elements */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-orange-400/10 blur-[80px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 h-[600px] w-[600px] rounded-full bg-teal-400/10 blur-[100px] pointer-events-none z-0" />
      
      <div className="relative z-10 w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2">
          &larr; Back home
        </Link>
        <div className="mt-2 rounded-3xl border border-border/50 bg-card/60 p-8 shadow-xl backdrop-blur-xl">
          <h1 className="text-2xl font-bold tracking-tight">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to pick up your trip." : "One account for your whole trip."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Kaitlyn" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <Button type="submit" className="w-full rounded-full h-11 text-base font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-95 bg-gradient-to-r from-orange-500 to-rose-500 border-0 text-white" disabled={busy}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <button
            type="button"
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </main>
  );
}
