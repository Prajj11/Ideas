import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, MapPinned, Phone, QrCode, Sparkles, Users, Palmtree, Sun, Waves, LocateFixed } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { WeatherWidget } from "@/components/WeatherWidget";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const TILES = [
  { to: "/map", icon: MapPinned, title: "Map & safe routes", text: "Compare the quickest and the safer way" },
  { to: "/explore", icon: Sparkles, title: "Explore a place", text: "Food, sights, crowds, rules & warnings" },
  { to: "/itinerary", icon: CalendarDays, title: "AI itinerary", text: "A plan for the hours you have" },
  { to: "/safety-tags", icon: QrCode, title: "QR safety tags", text: "For kids and elders travelling with you" },
  { to: "/live-tracking", icon: LocateFixed, title: "Live tracking", text: "Track family members by phone number" },
  { to: "/emergency", icon: Phone, title: "Emergency contacts", text: "Police, ambulance, lifeguards" },
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
    <AppShell title="Your trip" subtitle={trip ? `${trip.destination} · ${trip.days} day(s)` : "Set up your trip"}>
      <div className="relative isolate">
        {/* Animated Background Elements */}
        <div className="absolute -top-6 -right-6 text-orange-400/20 animate-float hover:text-orange-400/80 transition-all duration-300 hover:scale-125 cursor-pointer -z-10" title="Sunny Goa!">
          <Sun className="w-32 h-32 animate-sway" />
        </div>
        <div className="absolute top-1/2 -left-8 text-emerald-600/10 animate-float-slow hover:text-emerald-600/60 transition-all duration-300 hover:scale-125 hover:rotate-12 cursor-pointer -z-10" title="Relax under the palm trees">
          <Palmtree className="w-40 h-40" />
        </div>
        <div className="absolute bottom-10 right-0 text-blue-500/10 animate-float hover:text-blue-500/60 transition-all duration-300 hover:scale-125 hover:-rotate-12 cursor-pointer -z-10" title="Hit the waves">
          <Waves className="w-24 h-24" />
        </div>

        <div className="relative z-10 flex flex-col gap-8">
          {/* Top Section: Trip Info & Weather */}
          <div className="flex flex-col gap-6">
            <div className="w-full">
              {isLoading ? (
                <div className="h-full min-h-[160px] animate-pulse rounded-3xl bg-primary/5 border border-primary/10" />
              ) : trip ? (
                <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl p-8 shadow-sm transition-all duration-300 hover:shadow-lg group">
                  <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_60%_at_100%_0%,var(--color-primary)_0%,transparent_100%)] opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                  
                  <div className="flex flex-col md:flex-row justify-between gap-6 md:items-start">
                    <div>
                      <p className="text-xs font-bold tracking-widest text-primary uppercase">
                        {trip.travel_style === "group" ? "Group trip" : "Solo trip"}
                      </p>
                      <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">{trip.destination}</h2>
                      <p className="mt-2 text-base font-medium text-muted-foreground/90">
                        {trip.traveller_name} · {trip.days} day{trip.days === 1 ? "" : "s"}
                        {trip.start_date ? ` from ${new Date(trip.start_date).toLocaleDateString()}` : ""}
                      </p>
                      {travellers.length > 0 && (
                        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                          <Users className="size-4" /> {travellers.length} travellers ·{" "}
                          {travellers.filter((t) => t.category === "kid").length} kids ·{" "}
                          {travellers.filter((t) => t.category === "senior").length} seniors
                        </p>
                      )}
                      <div className="mt-6">
                        <Button asChild variant="outline" size="sm" className="rounded-full font-semibold transition-transform hover:scale-105 active:scale-95">
                          <Link to="/setup">Edit trip</Link>
                        </Button>
                      </div>
                    </div>
                    <div className="flex-shrink-0 animate-in fade-in slide-in-from-right-4 duration-700 delay-150 ease-out">
                      <WeatherWidget />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 relative overflow-hidden rounded-3xl border border-primary/20 bg-card/40 backdrop-blur-md p-10 text-center shadow-lg shadow-primary/5 transition-all duration-300 hover:shadow-xl hover:border-primary/40 group">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,var(--color-primary)_0%,transparent_100%)] opacity-5 group-hover:opacity-10 transition-opacity duration-500" />
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Let's set up your trip</h2>
                    <p className="mt-3 text-base font-medium text-muted-foreground leading-relaxed">Tell us who's travelling so we can tailor safety advice.</p>
                    <Button asChild className="mt-6 h-12 px-8 rounded-full text-base font-semibold shadow-md transition-all hover:scale-105 active:scale-95">
                      <Link to="/setup">Start setup</Link>
                    </Button>
                  </div>
                  <div className="w-full lg:w-auto self-start animate-in fade-in slide-in-from-right-4 duration-700 delay-150 ease-out">
                    <WeatherWidget />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tiles Grid */}
          <div className="grid gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            {TILES.map((tile, i) => (
              <Link
                key={tile.to}
                to={tile.to}
                className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/60 backdrop-blur-md p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/40 hover:bg-card/90"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative z-10 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                  <tile.icon className="size-6" />
                </div>
                <h3 className="relative z-10 mt-5 text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">{tile.title}</h3>
                <p className="relative z-10 mt-2 text-sm font-medium leading-relaxed text-muted-foreground">{tile.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
