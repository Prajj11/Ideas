import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Ban, Check, Loader2, Search, Users, Star, Map, Umbrella, Camera, Music, Coffee, Palmtree, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GOA_PLACES, type PlaceInsights } from "@/lib/goa-schemas";
import { getPlaceInsights } from "@/lib/goa.functions";

export const Route = createFileRoute("/_authenticated/explore")({
  component: Explore,
});

const bandStyles: Record<string, string> = {
  quiet: "bg-primary/10 text-primary",
  moderate: "bg-secondary text-secondary-foreground",
  busy: "bg-accent/15 text-accent",
  packed: "bg-destructive/10 text-destructive",
};

const ALL_FEATURED = [
  { name: "Baga Beach", desc: "Famous for nightlife, water sports, and vibrant shacks.", img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=60&w=400&auto=format&fit=crop" },
  { name: "Fort Aguada", desc: "17th-century Portuguese fort with stunning ocean views.", img: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=60&w=400&auto=format&fit=crop" },
  { name: "Dudhsagar Waterfalls", desc: "Majestic four-tiered waterfall surrounded by lush forests.", img: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=60&w=400&auto=format&fit=crop" },
  { name: "Anjuna Flea Market", desc: "Bohemian market offering clothes, jewelry, and live music.", img: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=60&w=400&auto=format&fit=crop" },
  { name: "Palolem Beach", desc: "Scenic, crescent-shaped beach known for its calm waters.", img: "https://picsum.photos/seed/palolem/400/250" },
  { name: "Basilica of Bom Jesus", desc: "UNESCO World Heritage site holding the mortal remains of St. Francis Xavier.", img: "https://picsum.photos/seed/basilica/400/250" },
  { name: "Chapora Fort", desc: "Iconic fort offering panoramic views of the Arabian Sea and Vagator beach.", img: "https://picsum.photos/seed/chapora/400/250" },
  { name: "Arambol Beach", desc: "Laid-back beach popular with backpackers and musicians.", img: "https://picsum.photos/seed/arambol/400/250" }
];

function Explore() {
  const [query, setQuery] = useState("");
  const [shuffledPlaces, setShuffledPlaces] = useState<string[]>([]);
  const [shuffledFeatured, setShuffledFeatured] = useState<typeof ALL_FEATURED>([]);
  const insightsFn = useServerFn(getPlaceInsights);

  useEffect(() => {
    shufflePlaces();
    shuffleFeatured();
  }, []);

  const shufflePlaces = () => {
    const shuffled = [...GOA_PLACES].sort(() => 0.5 - Math.random());
    setShuffledPlaces(shuffled.slice(0, 6)); // Show 6 places at a time
  };

  const shuffleFeatured = () => {
    const shuffled = [...ALL_FEATURED].sort(() => 0.5 - Math.random());
    setShuffledFeatured(shuffled.slice(0, 4));
  };

  const insights = useMutation({
    mutationFn: async (place: string) =>
      (await insightsFn({ data: { place, localTime: new Date().toString() } })) as PlaceInsights,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not load this place"),
  });

  const data = insights.data;

  return (
    <AppShell title="Explore a place" subtitle="Food, sights, crowds, rules and warnings" back>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const place = query.trim();
          if (place.length < 2) return;
          insights.mutate(place);
        }}
      >
        <Input
          value={query}
          maxLength={80}
          placeholder="Search a place…"
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" disabled={insights.isPending}>
          <Search className="size-4" />
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {shuffledPlaces.map((p) => (
          <button
            key={p}
            onClick={() => {
              setQuery(p);
              insights.mutate(p);
            }}
            className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {p}
          </button>
        ))}
        <button
          onClick={shufflePlaces}
          type="button"
          title="Refresh suggestions"
          className="flex items-center justify-center rounded-full bg-orange-100 p-1.5 text-orange-600 hover:bg-orange-200 transition-all hover:rotate-180 active:scale-95"
        >
          <RefreshCw className="size-3.5" />
        </button>
      </div>

      {/* Featured Empty State */}
      {!data && !insights.isPending && (
        <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Star className="text-orange-500 w-5 h-5 fill-orange-500" /> Featured destinations
              </h3>
              <button
                onClick={shuffleFeatured}
                type="button"
                title="Refresh destinations"
                className="flex items-center justify-center rounded-full bg-orange-100 p-1.5 text-orange-600 hover:bg-orange-200 transition-all hover:rotate-180 active:scale-95"
              >
                <RefreshCw className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {shuffledFeatured.map(place => (
                <div 
                  key={place.name} 
                  onClick={() => { setQuery(place.name); insights.mutate(place.name); }} 
                  className="group cursor-pointer relative overflow-hidden rounded-3xl border border-border/50 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                >
                   <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors z-10" />
                   <img src={place.img} alt={place.name} loading="lazy" decoding="async" className="w-full h-36 object-cover transition-transform duration-700 group-hover:scale-110 bg-secondary" />
                   <div className="absolute bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                     <h4 className="text-white font-bold">{place.name}</h4>
                     <p className="text-white/80 text-xs mt-1 line-clamp-1">{place.desc}</p>
                   </div>
                </div>
              ))}
            </div>
          </section>

          <section>
             <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <Map className="text-teal-500 w-5 h-5" /> Browse by vibe
            </h3>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: <Umbrella className="w-4 h-4" />, label: "Beaches", color: "bg-blue-100 text-blue-700 border-blue-200" },
                { icon: <Camera className="w-4 h-4" />, label: "Monuments", color: "bg-amber-100 text-amber-700 border-amber-200" },
                { icon: <Music className="w-4 h-4" />, label: "Nightlife", color: "bg-purple-100 text-purple-700 border-purple-200" },
                { icon: <Coffee className="w-4 h-4" />, label: "Cafes", color: "bg-rose-100 text-rose-700 border-rose-200" },
                { icon: <Palmtree className="w-4 h-4" />, label: "Nature", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
              ].map(cat => (
                <button 
                  key={cat.label} 
                  onClick={() => { setQuery(`Goa ${cat.label}`); insights.mutate(`Goa ${cat.label}`); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm transition-all hover:scale-105 active:scale-95 ${cat.color} hover:opacity-80`}
                >
                  {cat.icon} <span className="font-semibold text-sm">{cat.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {insights.isPending && (
        <div className="mt-16 flex flex-col items-center gap-3 text-muted-foreground animate-in fade-in">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Gathering intel on {query}…</p>
        </div>
      )}

      {data && !insights.isPending && (
        <div className="mt-6 space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-2xl font-semibold">{data.place}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{data.summary}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-semibold">
                <Users className="size-4 text-primary" /> How busy is it now?
              </h3>
              <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${bandStyles[data.crowd.band]}`}>
                {data.crowd.percent}% · {data.crowd.band}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-accent" style={{ width: `${data.crowd.percent}%` }} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{data.crowd.reason}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Quieter today:</span> {data.crowd.best_time_today}
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Calmer nearby</p>
              {data.crowd.alternatives.map((alt) => (
                <div key={alt.name} className="rounded-xl bg-secondary/60 p-3">
                  <p className="text-sm font-medium">
                    {alt.name} <span className="text-muted-foreground">· {alt.travel_time}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{alt.why}</p>
                </div>
              ))}
            </div>
          </section>

          {(
            [
              ["Where to eat", data.eat],
              ["Things to do", data.activities],
              ["Sights & monuments", data.sights],
            ] as const
          ).map(([heading, items]) => (
            <section key={heading} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold">{heading}</h3>
              <div className="mt-3 space-y-3">
                {items.map((item) => (
                  <div key={item.name}>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <p className="mt-0.5 text-sm text-primary">Tip: {item.tip}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold">Rules at {data.place}</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <ul className="space-y-1.5">
                {data.rules.allowed.map((r) => (
                  <li key={r} className="flex gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {r}
                  </li>
                ))}
              </ul>
              <ul className="space-y-1.5">
                {data.rules.not_allowed.map((r) => (
                  <li key={r} className="flex gap-2 text-sm">
                    <Ban className="mt-0.5 size-4 shrink-0 text-destructive" /> {r}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="size-4 text-destructive" /> Safety warnings
            </h3>
            {data.warnings.map((w) => (
              <div key={w.title} className={`rounded-2xl border-l-4 bg-card p-4 shadow-sm ${severityStyles[w.severity]}`}>
                <p className="font-medium">{w.title}</p>
                <p className="text-sm text-muted-foreground">{w.detail}</p>
              </div>
            ))}
          </section>

          <p className="pb-4 text-center text-xs text-muted-foreground">
            Crowd levels and warnings are AI estimates from typical patterns — always check locally.
          </p>
        </div>
      )}
    </AppShell>
  );
}
