import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Ban,
  Bookmark,
  Bus,
  Car,
  Check,
  ChevronRight,
  Clock,
  Compass,
  DollarSign,
  Heart,
  Info,
  Loader2,
  Map,
  MapPin,
  Navigation,
  ParkingCircle,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Ship,
  Sparkles,
  Star,
  Trash2,
  Users,
  Camera,
  Music,
  Coffee,
  Palmtree,
  Umbrella,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GOA_PLACES, type PlaceInsights } from "@/lib/goa-schemas";
import { getPlaceInsights } from "@/lib/goa.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/explore")({
  component: Explore,
});

const bandStyles: Record<string, string> = {
  quiet: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
  moderate: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30",
  busy: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30",
  packed: "bg-destructive/15 text-destructive border border-destructive/30",
};

const severityStyles: Record<string, string> = {
  low: "border-l-blue-500",
  medium: "border-l-amber-500",
  high: "border-l-destructive",
};

const ALL_FEATURED = [
  { name: "Baga Beach", desc: "Famous for nightlife, water sports, and vibrant shacks.", img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=60&w=400&auto=format&fit=crop", category: "beach" },
  { name: "Fort Aguada", desc: "17th-century Portuguese fort with stunning ocean views.", img: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=60&w=400&auto=format&fit=crop", category: "monument" },
  { name: "Dudhsagar Waterfalls", desc: "Majestic four-tiered waterfall surrounded by lush forests.", img: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=60&w=400&auto=format&fit=crop", category: "nature" },
  { name: "Anjuna Flea Market", desc: "Bohemian market offering clothes, jewelry, and live music.", img: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=60&w=400&auto=format&fit=crop", category: "market" },
  { name: "Palolem Beach", desc: "Scenic, crescent-shaped beach known for its calm waters.", img: "https://picsum.photos/seed/palolem/400/250", category: "beach" },
  { name: "Basilica of Bom Jesus", desc: "UNESCO World Heritage site holding the mortal remains of St. Francis Xavier.", img: "https://picsum.photos/seed/basilica/400/250", category: "heritage" },
  { name: "Chapora Fort", desc: "Iconic fort offering panoramic views of the Arabian Sea and Vagator beach.", img: "https://picsum.photos/seed/chapora/400/250", category: "monument" },
  { name: "Arambol Beach", desc: "Laid-back beach popular with backpackers and musicians.", img: "https://picsum.photos/seed/arambol/400/250", category: "beach" },
];

function getTransportIcon(mode?: string) {
  switch (mode) {
    case "car":
      return <Car className="size-5 text-blue-500" />;
    case "bus":
      return <Bus className="size-5 text-emerald-500" />;
    case "ferry":
      return <Ship className="size-5 text-teal-500" />;
    case "walk":
      return <Navigation className="size-5 text-purple-500" />;
    case "scooter":
    default:
      return <Compass className="size-5 text-orange-500" />;
  }
}

type SavedPlace = {
  id: string;
  place_name: string;
  category: string;
  notes: string | null;
  image_url: string | null;
  created_at: string;
};

function Explore() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"explore" | "saved">("explore");
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
    setShuffledPlaces(shuffled.slice(0, 6));
  };

  const shuffleFeatured = () => {
    const shuffled = [...ALL_FEATURED].sort(() => 0.5 - Math.random());
    setShuffledFeatured(shuffled.slice(0, 4));
  };

  // Fetch saved places from Supabase
  const { data: savedPlaces = [] } = useQuery({
    queryKey: ["saved-places"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_places")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("Could not fetch saved places from supabase, fallback to empty", error);
        return [];
      }
      return data as SavedPlace[];
    },
  });

  const toggleSavePlace = useMutation({
    mutationFn: async ({ name, category, imageUrl }: { name: string; category?: string; imageUrl?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Please sign in to save places to your bucket list.");
        return;
      }

      const existing = savedPlaces.find((p) => p.place_name.toLowerCase() === name.toLowerCase());
      if (existing) {
        const { error } = await supabase.from("saved_places").delete().eq("id", existing.id);
        if (error) throw error;
        toast.info(`Removed ${name} from your bucket list`);
      } else {
        const { error } = await supabase.from("saved_places").insert({
          user_id: userData.user.id,
          place_name: name,
          category: category || "sight",
          image_url: imageUrl || null,
        });
        if (error) throw error;
        toast.success(`Saved ${name} to your bucket list ❤️`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-places"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update saved place"),
  });

  const isSaved = (name: string) => {
    return savedPlaces.some((p) => p.place_name.toLowerCase() === name.toLowerCase());
  };

  const insights = useMutation({
    mutationFn: async (place: string) =>
      (await insightsFn({ data: { place, localTime: new Date().toString() } })) as PlaceInsights,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not load this place"),
  });

  const data = insights.data;

  return (
    <AppShell title="Explore Goa" subtitle="Food, sights, crowd levels, transport & saved places" back>
      {/* View Switcher Tabs: Explore vs Saved Bucket List */}
      <div className="flex gap-2 p-1 bg-secondary/50 rounded-full w-fit mb-5 border border-border/40">
        <button
          onClick={() => setActiveTab("explore")}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all ${
            activeTab === "explore"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Compass className="size-4" /> Explore Destinations
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all ${
            activeTab === "saved"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart className={`size-4 ${savedPlaces.length > 0 ? "fill-rose-500 text-rose-500" : ""}`} />
          Saved Bucket List ({savedPlaces.length})
        </button>
      </div>

      {/* SAVED PLACES BUCKET LIST TAB */}
      {activeTab === "saved" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Heart className="size-5 fill-rose-500 text-rose-500" /> Your Goa Bucket List
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Places you've liked and saved to visit during your trip.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setActiveTab("explore")}
              >
                <Plus className="size-4" /> Add more
              </Button>
            </div>

            {savedPlaces.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-border/70 p-8 text-center bg-secondary/20">
                <Bookmark className="size-10 mx-auto text-muted-foreground/40 mb-3" />
                <h4 className="text-base font-bold">No saved places yet</h4>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Click the heart icon on any destination in the Explore tab to build your personalized travel wishlist.
                </p>
                <Button
                  onClick={() => setActiveTab("explore")}
                  className="mt-5 rounded-full font-semibold px-6"
                >
                  Explore popular spots
                </Button>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {savedPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/80 backdrop-blur-md p-5 shadow-sm transition-all hover:shadow-xl hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                          {place.category}
                        </span>
                        <h4 className="text-lg font-bold text-foreground mt-2">{place.place_name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Saved on {new Date(place.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleSavePlace.mutate({ name: place.place_name })}
                        className="rounded-full bg-rose-500/10 p-2 text-rose-600 hover:bg-rose-500/20 transition-colors"
                        title="Remove from saved"
                      >
                        <Heart className="size-4 fill-rose-500" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border/40">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setActiveTab("explore");
                          setQuery(place.place_name);
                          insights.mutate(place.place_name);
                        }}
                        className="flex-1 rounded-full text-xs font-bold"
                      >
                        View Details
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        className="flex-1 rounded-full text-xs font-bold bg-primary text-primary-foreground"
                      >
                        <Link to="/map" search={{ dest: place.place_name }}>
                          <Navigation className="size-3.5 mr-1" /> Get Directions
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXPLORE PLACES TAB */}
      {activeTab === "explore" && (
        <>
          {/* Search Form */}
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
              placeholder="Search beaches, forts, markets in Goa…"
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 text-base rounded-full bg-card/70 border-border/50"
            />
            <Button type="submit" disabled={insights.isPending} className="h-12 px-6 rounded-full">
              <Search className="size-4" />
            </Button>
          </form>

          {/* Quick Suggestions Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {shuffledPlaces.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setQuery(p);
                  insights.mutate(p);
                }}
                className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all"
              >
                {p}
              </button>
            ))}
            <button
              onClick={shufflePlaces}
              type="button"
              title="Refresh suggestions"
              className="flex items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/40 p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-200 transition-all hover:rotate-180 active:scale-95"
            >
              <RefreshCw className="size-3.5" />
            </button>
          </div>

          {/* Featured Destinations & Categories (Empty Search State) */}
          {!data && !insights.isPending && (
            <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <Star className="text-orange-500 w-5 h-5 fill-orange-500" /> Featured Destinations
                  </h3>
                  <button
                    onClick={shuffleFeatured}
                    type="button"
                    title="Refresh destinations"
                    className="flex items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/40 p-1.5 text-orange-600 hover:bg-orange-200 transition-all hover:rotate-180 active:scale-95"
                  >
                    <RefreshCw className="size-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {shuffledFeatured.map((place) => {
                    const saved = isSaved(place.name);
                    return (
                      <div
                        key={place.name}
                        className="group relative overflow-hidden rounded-3xl border border-border/50 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                      >
                        <div
                          onClick={() => {
                            setQuery(place.name);
                            insights.mutate(place.name);
                          }}
                          className="cursor-pointer"
                        >
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors z-10" />
                          <img
                            src={place.img}
                            alt={place.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-40 object-cover transition-transform duration-700 group-hover:scale-110 bg-secondary"
                          />
                          <div className="absolute bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                            <h4 className="text-white font-bold">{place.name}</h4>
                            <p className="text-white/80 text-xs mt-1 line-clamp-1">{place.desc}</p>
                          </div>
                        </div>
                        {/* Bookmark Heart Action */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSavePlace.mutate({
                              name: place.name,
                              category: place.category,
                              imageUrl: place.img,
                            });
                          }}
                          className={`absolute top-3 right-3 z-30 rounded-full p-2 backdrop-blur-md transition-all hover:scale-110 ${
                            saved
                              ? "bg-rose-500 text-white shadow-md shadow-rose-500/30"
                              : "bg-black/40 text-white hover:bg-black/60"
                          }`}
                          title={saved ? "Saved in bucket list" : "Save to bucket list"}
                        >
                          <Heart className={`size-4 ${saved ? "fill-white" : ""}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
                  <Map className="text-teal-500 w-5 h-5" /> Browse by Vibe
                </h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: <Umbrella className="w-4 h-4" />, label: "Beaches", color: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
                    { icon: <Camera className="w-4 h-4" />, label: "Monuments", color: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
                    { icon: <Music className="w-4 h-4" />, label: "Nightlife", color: "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
                    { icon: <Coffee className="w-4 h-4" />, label: "Cafes", color: "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800" },
                    { icon: <Palmtree className="w-4 h-4" />, label: "Nature", color: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
                  ].map((cat) => (
                    <button
                      key={cat.label}
                      onClick={() => {
                        setQuery(`Goa ${cat.label}`);
                        insights.mutate(`Goa ${cat.label}`);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm transition-all hover:scale-105 active:scale-95 ${cat.color} hover:opacity-80`}
                    >
                      {cat.icon} <span className="font-semibold text-sm">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Loading Indicator */}
          {insights.isPending && (
            <div className="mt-16 flex flex-col items-center gap-3 text-muted-foreground animate-in fade-in">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Gathering travel intel on {query}…</p>
            </div>
          )}

          {/* PLACE INSIGHT RESULTS */}
          {data && !insights.isPending && (
            <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
              {/* Place Overview Header Card */}
              <section className="rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold tracking-widest text-primary uppercase">Destination Insights</span>
                    <h2 className="text-3xl font-extrabold tracking-tight text-foreground mt-1">{data.place}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Save to Bucket List Button */}
                    <button
                      onClick={() => toggleSavePlace.mutate({ name: data.place })}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold shadow-sm transition-all hover:scale-105 active:scale-95 ${
                        isSaved(data.place)
                          ? "bg-rose-500 text-white shadow-rose-500/20"
                          : "bg-secondary text-foreground hover:bg-rose-500/10 hover:text-rose-600 border border-border/50"
                      }`}
                    >
                      <Heart className={`size-4 ${isSaved(data.place) ? "fill-white" : ""}`} />
                      {isSaved(data.place) ? "Saved in Bucket List" : "Save to Bucket List"}
                    </button>

                    {/* Get Directions Button */}
                    <Button asChild className="rounded-full font-bold shadow-md gap-1.5">
                      <Link to="/map" search={{ dest: data.place }}>
                        <Navigation className="size-4" /> Get Directions
                      </Link>
                    </Button>
                  </div>
                </div>

                <p className="mt-4 text-base text-muted-foreground leading-relaxed">{data.summary}</p>
              </section>

              {/* BEST MODE OF TRANSPORT CARD (Feature 1) */}
              {data.transport_advice && (
                <section className="rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                      {getTransportIcon(data.transport_advice.best_mode)}
                      Best Mode of Transport: {data.transport_advice.title}
                    </h3>
                    <span className="rounded-full bg-primary/10 text-primary text-xs font-bold px-3 py-1 uppercase tracking-wider">
                      Recommended
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-foreground/90 leading-relaxed">
                    {data.transport_advice.description}
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border/40 bg-secondary/30 p-4">
                      <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <DollarSign className="size-3.5 text-emerald-500" /> Estimated Cost
                      </span>
                      <p className="text-sm font-bold text-foreground mt-1">{data.transport_advice.estimated_cost}</p>
                    </div>

                    <div className="rounded-2xl border border-border/40 bg-secondary/30 p-4">
                      <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <ParkingCircle className="size-3.5 text-blue-500" /> Parking Availability
                      </span>
                      <p className="text-sm font-bold text-foreground mt-1 capitalize">
                        {data.transport_advice.parking_ease}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{data.transport_advice.parking_tip}</p>
                    </div>

                    <div className="rounded-2xl border border-border/40 bg-secondary/30 p-4">
                      <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <Compass className="size-3.5 text-orange-500" /> Road Conditions
                      </span>
                      <p className="text-xs font-medium text-foreground mt-1">{data.transport_advice.road_condition}</p>
                    </div>
                  </div>

                  {data.transport_advice.safety_tips.length > 0 && (
                    <div className="mt-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                        Transit & Road Safety Tips
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-amber-900/90 dark:text-amber-300">
                        {data.transport_advice.safety_tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span>•</span> <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {data.transport_advice.public_transit && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Bus className="size-4 text-primary shrink-0" />
                      <span>{data.transport_advice.public_transit}</span>
                    </div>
                  )}
                </section>
              )}

              {/* Crowd Level & Smart Alternatives */}
              <section className="rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 font-bold text-lg">
                    <Users className="size-5 text-primary" /> Live Crowd Level
                  </h3>
                  <span className={`rounded-full px-3.5 py-1 text-xs font-bold capitalize ${bandStyles[data.crowd.band]}`}>
                    {data.crowd.percent}% full · {data.crowd.band}
                  </span>
                </div>

                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 via-orange-500 to-rose-500 transition-all duration-1000"
                    style={{ width: `${data.crowd.percent}%` }}
                  />
                </div>

                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{data.crowd.reason}</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  <span className="text-primary font-bold">Best visiting time today:</span> {data.crowd.best_time_today}
                </p>

                <div className="mt-5 space-y-2.5">
                  <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Quieter nearby alternatives</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {data.crowd.alternatives.map((alt) => (
                      <div
                        key={alt.name}
                        onClick={() => {
                          setQuery(alt.name);
                          insights.mutate(alt.name);
                        }}
                        className="rounded-2xl border border-border/40 bg-secondary/40 p-4 cursor-pointer hover:border-primary/40 hover:bg-secondary/70 transition-all"
                      >
                        <p className="text-sm font-bold text-foreground flex items-center justify-between">
                          <span>{alt.name}</span>
                          <span className="text-xs text-muted-foreground font-normal">{alt.travel_time}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{alt.why}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Recommendations Bento: Eat, Do, Sights */}
              {(
                [
                  ["Where to Eat & Beach Shacks", data.eat, "🍤"],
                  ["Things to Do & Water Sports", data.activities, "🎯"],
                  ["Sights & Cultural Landmarks", data.sights, "🏛️"],
                ] as const
              ).map(([heading, items, emoji]) => (
                <section key={heading} className="rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl p-6 shadow-sm">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <span>{emoji}</span> {heading}
                  </h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {items.map((item) => (
                      <div
                        key={item.name}
                        className="rounded-2xl border border-border/40 bg-secondary/30 p-4 flex flex-col justify-between"
                      >
                        <div>
                          <p className="font-bold text-sm text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                        </div>
                        <p className="mt-3 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg w-fit">
                          Tip: {item.tip}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              {/* Local Rules & Safety Warnings */}
              <section className="rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4">Local Rules & Regulations at {data.place}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">
                      Permitted Activities
                    </p>
                    <ul className="space-y-2">
                      {data.rules.allowed.map((r) => (
                        <li key={r} className="flex gap-2 text-sm text-emerald-950 dark:text-emerald-300">
                          <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" /> {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-red-500/5 border border-red-500/20 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 mb-2">
                      Strictly Prohibited (Fines Apply)
                    </p>
                    <ul className="space-y-2">
                      {data.rules.not_allowed.map((r) => (
                        <li key={r} className="flex gap-2 text-sm text-red-950 dark:text-red-300">
                          <Ban className="mt-0.5 size-4 shrink-0 text-red-600" /> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* Safety Warnings */}
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 font-bold text-lg">
                  <AlertTriangle className="size-5 text-destructive" /> Safety Warnings & Local Advisories
                </h3>
                {data.warnings.map((w) => (
                  <div
                    key={w.title}
                    className={`rounded-2xl border-l-4 bg-card p-5 shadow-sm ${severityStyles[w.severity]}`}
                  >
                    <p className="font-bold text-sm text-foreground">{w.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{w.detail}</p>
                  </div>
                ))}
              </section>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

