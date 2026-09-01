import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  MapPinned,
  Phone,
  QrCode,
  Sparkles,
  Users,
  Palmtree,
  Sun,
  Waves,
  LocateFixed,
  Heart,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { WeatherWidget } from "@/components/WeatherWidget";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const TILES = [
  {
    to: "/map",
    icon: MapPinned,
    badge: "OSRM Engine",
    title: "Map & Safe Routing",
    text: "Turn-by-turn directions, fastest vs. safer routes, and 1-tap Google Maps GPS navigation.",
    color: "from-cyan/15 to-transparent text-cyan border-cyan/30 hover:border-cyan/60",
    iconBg: "bg-cyan/10 text-cyan group-hover:bg-cyan group-hover:text-cyan-foreground",
  },
  {
    to: "/explore",
    icon: Sparkles,
    badge: "Crowd & Transit",
    title: "Explore & Bucket List",
    text: "Live crowd levels, recommended visiting times, best mode of transport & saved places.",
    color: "from-coral/15 to-transparent text-coral border-coral/30 hover:border-coral/60",
    iconBg: "bg-coral/10 text-coral group-hover:bg-coral group-hover:text-coral-foreground",
  },
  {
    to: "/itinerary",
    icon: CalendarDays,
    badge: "AI Time-Budget",
    title: "AI Itinerary Planner",
    text: "A tailored schedule for the free hours you have with export-ready stop directions.",
    color: "from-amber/15 to-transparent text-amber border-amber/30 hover:border-amber/60",
    iconBg: "bg-amber/10 text-amber group-hover:bg-amber group-hover:text-amber-foreground",
  },
  {
    to: "/safety-tags",
    icon: QrCode,
    badge: "Zero-Knowledge",
    title: "QR Safety Wristbands",
    text: "Printable QR wristbands and OTP codes for kids and seniors traveling with you.",
    color: "from-emerald/15 to-transparent text-emerald border-emerald/30 hover:border-emerald/60",
    iconBg: "bg-emerald/10 text-emerald group-hover:bg-emerald group-hover:text-emerald-foreground",
  },
  {
    to: "/live-tracking",
    icon: LocateFixed,
    badge: "Live Radar",
    title: "Live GPS Family Radar",
    text: "Track family member locations on an interactive live radar with one-touch calling.",
    color: "from-primary/15 to-transparent text-primary border-primary/30 hover:border-primary/60",
    iconBg: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
  },
  {
    to: "/emergency",
    icon: Phone,
    badge: "24/7 Helpline",
    title: "Goa Emergency 112 Hub",
    text: "Instant dial to Police (100/112), Ambulance (108), Drishti Marine Lifeguards & Tourist Police.",
    color: "from-destructive/15 to-transparent text-destructive border-destructive/30 hover:border-destructive/60",
    iconBg: "bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground",
  },
] as const;

function Dashboard() {
  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*, travellers(*)")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const travellers = (trip?.travellers ?? []) as Array<{ id: string; category: string }>;

  return (
    <AppShell
      title="Trip Command Center"
      subtitle={trip ? `${trip.destination} · ${trip.days} Day Trip` : "Personalized Goan Safety Intelligence"}
    >
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Top Bento Row: Separated Trip Overview Box & Standalone Weather Station Box */}
        <div className="w-full">
          {isLoading ? (
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2 h-44 rounded-3xl shimmer-skeleton border border-border/50" />
              <div className="lg:col-span-1 h-44 rounded-3xl shimmer-skeleton border border-border/50" />
            </div>
          ) : trip ? (
            <div className="grid gap-5 lg:grid-cols-3 items-stretch">
              {/* Box 1: Trip Overview Card */}
              <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 backdrop-blur-2xl p-6 sm:p-8 shadow-sm transition-all hover:shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/25 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wider shadow-xs">
                      <Compass className="size-3.5" />
                      {trip.travel_style === "group" ? "Group Expedition" : "Solo Voyager"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 border border-border/60 px-3.5 py-1 text-xs font-bold text-foreground/80 shadow-xs">
                      <Calendar className="size-3.5 text-coral" />
                      {trip.days} Day{trip.days === 1 ? "" : "s"} Plan
                    </span>
                  </div>

                  <h2 className="mt-3 text-3xl sm:text-4xl font-black font-display tracking-tight text-foreground">
                    {trip.destination}
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-muted-foreground">
                    Lead Traveler: <span className="text-foreground font-bold">{trip.traveller_name}</span>
                    {trip.start_date && (
                      <span> · Starts {new Date(trip.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    )}
                  </p>

                  {travellers.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 px-3 py-1 text-xs font-bold text-secondary-foreground">
                        <Users className="size-3.5 text-primary" /> {travellers.length} Travelers
                      </span>
                      {travellers.filter((t) => t.category === "kid").length > 0 && (
                        <span className="rounded-full bg-coral/10 text-coral border border-coral/20 px-2.5 py-0.5 text-xs font-bold">
                          {travellers.filter((t) => t.category === "kid").length} Kids
                        </span>
                      )}
                      {travellers.filter((t) => t.category === "senior").length > 0 && (
                        <span className="rounded-full bg-amber/10 text-amber border border-amber/20 px-2.5 py-0.5 text-xs font-bold">
                          {travellers.filter((t) => t.category === "senior").length} Seniors
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full border-border/70 bg-card/60 font-bold text-xs hover:border-primary/40 transition-transform hover:scale-105"
                  >
                    <Link to="/setup">Modify Trip Details</Link>
                  </Button>
                </div>
              </div>

              {/* Box 2: Separated Standalone Weather Station Box */}
              <div className="lg:col-span-1 flex flex-col justify-center">
                <WeatherWidget />
              </div>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-3 items-stretch">
              <div className="lg:col-span-2 rounded-3xl border border-primary/20 bg-card/75 backdrop-blur-2xl p-8 sm:p-10 shadow-sm transition-all hover:border-primary/40">
                <span className="rounded-full bg-primary/10 text-primary px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
                  Setup Your Trip
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl font-bold font-display text-foreground">
                  Ready to explore Goa safely?
                </h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-lg">
                  Tell us who's travelling (solo, friends, kids, seniors) and where you're heading so we can calculate personalized safety routes and crowd tips.
                </p>
                <Button
                  asChild
                  className="mt-6 rounded-full font-bold px-7 bg-primary text-primary-foreground shadow-md transition-all hover:scale-105 active:scale-95"
                >
                  <Link to="/setup">Start Trip Planner</Link>
                </Button>
              </div>

              <div className="lg:col-span-1 flex flex-col justify-center">
                <WeatherWidget />
              </div>
            </div>
          )}
        </div>

        {/* Bento Grid: 6 Core Modules */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold font-display tracking-tight text-foreground flex items-center gap-2">
              <Compass className="size-5 text-primary" /> Safety & Navigation Modules
            </h3>
            <span className="text-xs text-muted-foreground font-medium">Select a tool to launch</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TILES.map((tile, i) => {
              const Icon = tile.icon;
              return (
                <Link
                  key={tile.to}
                  to={tile.to}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-card/70 backdrop-blur-xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${tile.color}`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="size-5" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <div className={`flex size-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${tile.iconBg}`}>
                        <Icon className="size-6" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-secondary/80 px-2.5 py-0.5 text-muted-foreground group-hover:text-foreground transition-colors">
                        {tile.badge}
                      </span>
                    </div>

                    <h4 className="mt-5 text-lg font-bold font-display text-foreground group-hover:text-primary transition-colors">
                      {tile.title}
                    </h4>
                    <p className="mt-2 text-xs font-medium leading-relaxed text-muted-foreground">
                      {tile.text}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border/30 flex items-center text-xs font-bold group-hover:underline">
                    <span>Launch Module</span>
                    <ArrowUpRight className="size-3.5 ml-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
