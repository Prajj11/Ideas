import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, LogOut, Phone } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { GoogleTranslate } from "@/components/GoogleTranslate";

export function AppShell({
  title,
  subtitle,
  back,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-orange-50/20 to-teal-50/30 selection:bg-orange-500/20 relative overflow-hidden pb-20">
      {/* Subtle Ambient Background Elements */}
      <div className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-orange-400/10 blur-[80px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 translate-x-1/3 translate-y-1/3 h-[500px] w-[500px] rounded-full bg-teal-400/10 blur-[100px] pointer-events-none z-0" />

      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/50 backdrop-blur-2xl shadow-sm transition-all duration-300">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-5 py-4">
          {back && (
            <button
              onClick={() => router.history.back()}
              aria-label="Go back"
              className="group flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-card/50 shadow-sm transition-all hover:scale-105 hover:bg-primary/10 hover:border-primary/30 active:scale-95"
            >
              <ChevronLeft className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="truncate text-sm font-medium text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="hidden sm:block">
            <GoogleTranslate />
          </div>
          <Button asChild size="icon" variant="ghost" aria-label="Emergency contacts">
            <Link to="/emergency">
              <Phone className="size-5 text-destructive" />
            </Link>
          </Button>
          <Button size="icon" variant="ghost" aria-label="Sign out" onClick={signOut}>
            <LogOut className="size-5" />
          </Button>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-5">{children}</main>
    </div>
  );
}
