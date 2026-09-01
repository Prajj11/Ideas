import { Link, useNavigate, useRouter, useLocation } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  LogOut,
  Phone,
  LayoutDashboard,
  Compass,
  Sparkles,
  CalendarDays,
  QrCode,
  LocateFixed,
  MapPin,
  Waves,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { GoogleTranslate } from "@/components/GoogleTranslate";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/map", label: "Map", icon: Compass },
  { to: "/explore", label: "Explore", icon: Sparkles },
  { to: "/itinerary", label: "Itinerary", icon: CalendarDays },
  { to: "/safety-tags", label: "SafeTags", icon: QrCode },
] as const;

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
  const location = useLocation();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 relative overflow-x-hidden pb-28 text-foreground">
      {/* Subtle Ambient Glowing Orbs */}
      <div className="pointer-events-none fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-coral/10 blur-[100px] z-0" />
      <div className="pointer-events-none fixed bottom-0 right-0 translate-x-1/3 translate-y-1/3 h-[550px] w-[550px] rounded-full bg-cyan/10 blur-[120px] z-0" />

      {/* Floating Top Glass Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-card/70 backdrop-blur-2xl shadow-sm transition-all">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            {back ? (
              <button
                onClick={() => router.history.back()}
                aria-label="Go back"
                className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-card/80 shadow-sm transition-all hover:scale-105 hover:bg-primary/10 hover:border-primary/30 active:scale-95"
              >
                <ChevronLeft className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ) : (
              <Link to="/dashboard" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-cyan to-coral shadow-sm transition-transform hover:scale-105">
                <Compass className="size-5 text-primary-foreground" />
              </Link>
            )}

            <div className="min-w-0">
              <h1 className="truncate text-lg sm:text-xl font-extrabold font-display tracking-tight text-foreground">
                {title}
              </h1>
              {subtitle && (
                <p className="truncate text-xs font-medium text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <GoogleTranslate />
            </div>

            <Button
              asChild
              size="icon"
              variant="ghost"
              className="rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all hover:scale-105"
              aria-label="Emergency 112 directory"
              title="Goa Emergency 112 Directory"
            >
              <Link to="/emergency">
                <Phone className="size-4" />
              </Link>
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="rounded-2xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all hover:scale-105"
              aria-label="Sign out"
              title="Sign out of Safr"
              onClick={signOut}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-6 sm:px-6">{children}</main>

      {/* Floating Bottom Navigation Dock (Mobile-First) */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md">
        <div className="flex items-center justify-around rounded-3xl border border-border/60 bg-card/80 p-2 shadow-2xl backdrop-blur-2xl">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.to || (item.to !== "/dashboard" && currentPath.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group relative flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className={`size-4 transition-transform group-hover:scale-110 ${isActive ? "text-primary-foreground" : ""}`} />
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
