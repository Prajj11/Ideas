import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Navigation, Search, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRoutes, searchPlaces } from "@/lib/maps.functions";

export const Route = createFileRoute("/_authenticated/map")({
  component: MapPage,
});

type Hit = { id: string; name: string; address: string; lat: number; lng: number };
type Scored = {
  label: string;
  kind: "fastest" | "safer";
  distanceKm: number;
  durationMin: number;
  safetyScore: number;
  reasons: string[];
  polyline: string;
  summary: string;
};

const DEFAULT_ORIGIN = { lat: 15.4989, lng: 73.8278 };

function MapPage() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const linesRef = useRef<L.Polyline[]>([]);
  const markersRef = useRef<L.Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [routes, setRoutes] = useState<Scored[]>([]);
  const [selected, setSelected] = useState(0);
  const [destination, setDestination] = useState<Hit | null>(null);

  const search = useServerFn(searchPlaces);
  const route = useServerFn(getRoutes);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    mapRef.current = L.map(mapEl.current, {
      center: [DEFAULT_ORIGIN.lat, DEFAULT_ORIGIN.lng],
      zoom: 11,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(mapRef.current);

    // Fix default marker icon issues with Vite
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    setReady(true);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => undefined,
      { timeout: 8000 },
    );
  }, []);

  const searchMutation = useMutation({
    mutationFn: async (q: string) => (await search({ data: { query: q } })) as Hit[],
    onSuccess: (data) => {
      setHits(data);
      if (data.length === 0) toast.info("No matching places found.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Search failed"),
  });

  const routeMutation = useMutation({
    mutationFn: async (dest: Hit) => {
      const hour = new Date().getHours();
      return (await route({
        data: {
          origin,
          destination: { lat: dest.lat, lng: dest.lng },
          isNight: hour >= 19 || hour < 6,
        },
      })) as Scored[];
    },
    onSuccess: (data, dest) => {
      setRoutes(data);
      setSelected(0);
      setDestination(dest);
      setHits([]);
      if (data.length === 0) toast.info("No driving route found.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not get routes"),
  });

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;

    linesRef.current.forEach((l) => map.removeLayer(l));
    markersRef.current.forEach((m) => map.removeLayer(m));
    linesRef.current = [];
    markersRef.current = [];
    
    if (routes.length === 0) return;

    const bounds = L.latLngBounds([]);
    
    routes.forEach((r, i) => {
      if (!r.polyline) return;
      try {
        const pathCoords = JSON.parse(r.polyline) as [number, number][];
        if (!pathCoords || pathCoords.length === 0) return;
        
        const line = L.polyline(pathCoords, {
          color: i === selected ? (r.kind === "safer" ? "#0f766e" : "#e2725b") : "#9ca3af",
          opacity: i === selected ? 1 : 0.5,
          weight: i === selected ? 6 : 4,
        }).addTo(map);
        
        if (i === selected) {
          line.bringToFront();
        }
        
        linesRef.current.push(line);
        pathCoords.forEach((p) => bounds.extend(p));
      } catch (e) {
        console.error("Failed to parse polyline", e);
      }
    });

    markersRef.current.push(
      L.marker([origin.lat, origin.lng]).addTo(map).bindPopup("You")
    );
    if (destination) {
      markersRef.current.push(
        L.marker([destination.lat, destination.lng]).addTo(map).bindPopup(destination.name)
      );
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [48, 48] });
    }
  }, [routes, selected, ready, origin, destination]);

  return (
    <AppShell title="Map & safe routes" subtitle="Compare the quickest with the safer way" back>
      <form
        className="flex gap-3 z-10 relative mt-2 group"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim().length < 2) return;
          searchMutation.mutate(query.trim());
        }}
      >
        <div className="relative flex-1 shadow-lg shadow-black/5 rounded-full transition-all duration-300 group-hover:shadow-xl group-focus-within:shadow-xl group-focus-within:shadow-primary/20">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            value={query}
            maxLength={120}
            placeholder="Where do you want to go?"
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-full border-border/50 bg-card/80 backdrop-blur-md text-base transition-all focus-visible:ring-primary focus-visible:border-primary"
          />
        </div>
        <Button 
          type="submit" 
          disabled={searchMutation.isPending}
          className="h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          {searchMutation.isPending ? <Loader2 className="size-5 animate-spin" /> : <Navigation className="size-5" />}
        </Button>
      </form>

      {hits.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-3xl border border-border/50 bg-card/90 backdrop-blur-xl relative z-10 shadow-2xl shadow-black/10 animate-in fade-in slide-in-from-top-4 duration-300">
          {hits.map((h) => (
            <button
              key={h.id}
              onClick={() => routeMutation.mutate(h)}
              className="block w-full border-b border-border/40 px-6 py-4 text-left last:border-0 hover:bg-primary/5 transition-colors focus:bg-primary/5 focus:outline-none"
            >
              <span className="block text-base font-semibold text-foreground">{h.name}</span>
              <span className="block mt-1 text-sm text-muted-foreground">{h.address}</span>
            </button>
          ))}
        </div>
      )}

      {/* Make z-index low so it stays behind dropdowns */}
      <div ref={mapEl} className="mt-6 h-80 w-full overflow-hidden rounded-3xl border-2 border-border/50 bg-secondary/50 shadow-inner z-0 relative transition-all duration-500 hover:border-border" />

      {routeMutation.isPending && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-3xl border border-primary/20 bg-primary/5 p-6 animate-pulse">
          <Loader2 className="size-6 animate-spin text-primary" /> 
          <span className="text-base font-medium text-primary">Working out safer options…</span>
        </div>
      )}

      {routes.length > 0 && (
        <div className="mt-6 space-y-4 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
          {routes.map((r, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`group block w-full rounded-3xl border p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                i === selected 
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10" 
                  : "border-border/50 bg-card/60 backdrop-blur-md hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`flex items-center gap-2.5 text-lg font-bold tracking-tight ${i === selected ? "text-primary" : "text-foreground group-hover:text-primary transition-colors"}`}>
                  {r.kind === "safer" ? (
                    <ShieldCheck className={`size-5 ${i === selected ? "text-primary" : "text-primary/70"}`} />
                  ) : (
                    <Navigation className={`size-5 ${i === selected ? "text-accent" : "text-accent/70"}`} />
                  )}
                  {r.label}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${i === selected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                  Safety {r.safetyScore}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-foreground/80">
                <span className="text-foreground font-bold">{r.durationMin} min</span> · {r.distanceKm} km · via {r.summary}
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground/90 marker:text-primary/40">
                {r.reasons.map((reason, idx) => (
                  <li key={idx} className="leading-relaxed">{reason}</li>
                ))}
              </ul>
            </button>
          ))}
          <p className="px-4 text-center text-xs font-medium text-muted-foreground/60 leading-relaxed">
            Safety scores are estimates from road type, detour length and time of day — ride carefully regardless.
          </p>
        </div>
      )}
    </AppShell>
  );
}

