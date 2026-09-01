import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Compass,
  CornerUpLeft,
  CornerUpRight,
  ExternalLink,
  Flag,
  ListOrdered,
  Loader2,
  Milestone,
  Moon,
  MoveUp,
  Navigation,
  RotateCcw,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Split,
  Sun,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRoutes, searchPlaces } from "@/lib/maps.functions";
import type { RouteStep } from "@/lib/goa-schemas";

export const Route = createFileRoute("/_authenticated/map")({
  validateSearch: (search: Record<string, unknown>): { dest?: string; lat?: string; lng?: string } => {
    const params: { dest?: string; lat?: string; lng?: string } = {};
    if (typeof search["dest"] === "string" && search["dest"]) params.dest = search["dest"];
    if (typeof search["lat"] === "string" && search["lat"]) params.lat = search["lat"];
    if (typeof search["lng"] === "string" && search["lng"]) params.lng = search["lng"];
    return params;
  },
  component: MapPage,
});

type Hit = { id: string; name: string; address: string; lat: number; lng: number };
type Scored = {
  label: string;
  kind: "fastest" | "safer" | "alt";
  distanceKm: number;
  durationMin: number;
  safetyScore: number;
  reasons: string[];
  polyline: string;
  summary: string;
  steps?: RouteStep[];
  googleMapsUrl?: string;
};

const DEFAULT_ORIGIN = { lat: 15.4989, lng: 73.8278 };

const QUICK_DESTINATIONS: Hit[] = [
  { id: "q1", name: "Baga Beach", address: "North Goa", lat: 15.5553, lng: 73.7517 },
  { id: "q2", name: "Fort Aguada", address: "Candolim, Goa", lat: 15.4925, lng: 73.7736 },
  { id: "q3", name: "Palolem Beach", address: "Canacona, South Goa", lat: 15.0100, lng: 74.0232 },
  { id: "q4", name: "Dudhsagar Falls", address: "Sanguem, Goa", lat: 15.3144, lng: 74.3144 },
  { id: "q5", name: "Panjim Church", address: "Fontainhas, Panaji", lat: 15.4989, lng: 73.8278 },
];

function getManeuverIcon(type: string, modifier?: string) {
  if (type === "arrive") return <Flag className="size-4 text-emerald" />;
  if (type === "roundabout" || type === "rotary") return <RotateCcw className="size-4 text-amber" />;
  if (type === "fork" || type === "merge") return <Split className="size-4 text-cyan" />;
  if (modifier?.includes("left")) return <CornerUpLeft className="size-4 text-primary" />;
  if (modifier?.includes("right")) return <CornerUpRight className="size-4 text-coral" />;
  return <MoveUp className="size-4 text-primary" />;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
}

function MapPage() {
  const searchParams = Route.useSearch();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const linesRef = useRef<L.Polyline[]>([]);
  const markersRef = useRef<L.Marker[]>([]);
  const stepMarkerRef = useRef<L.Marker | null>(null);

  const [ready, setReady] = useState(false);
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const [query, setQuery] = useState(searchParams.dest || "");
  const [hits, setHits] = useState<Hit[]>([]);
  const [routes, setRoutes] = useState<Scored[]>([]);
  const [selected, setSelected] = useState(0);
  const [destination, setDestination] = useState<Hit | null>(null);
  const [showDirections, setShowDirections] = useState(true);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

  const currentHour = new Date().getHours();
  const isNightTime = currentHour >= 19 || currentHour < 6;

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
      if (data.length === 0) toast.info("No matching places found in Goa.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Search failed"),
  });

  const routeMutation = useMutation({
    mutationFn: async (dest: Hit) => {
      return (await route({
        data: {
          origin,
          destination: { lat: dest.lat, lng: dest.lng },
          isNight: isNightTime,
        },
      })) as Scored[];
    },
    onSuccess: (data, dest) => {
      setRoutes(data);
      setSelected(0);
      setDestination(dest);
      setHits([]);
      setActiveStepIndex(null);
      if (data.length === 0) toast.info("No driving route found.");
      else toast.success(`Safety routes calculated for ${dest.name}`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not calculate routes"),
  });

  useEffect(() => {
    if (searchParams.dest && searchParams.lat && searchParams.lng && ready) {
      const parsedLat = parseFloat(searchParams.lat);
      const parsedLng = parseFloat(searchParams.lng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        const destHit: Hit = {
          id: "prefill",
          name: searchParams.dest,
          address: "Goa, India",
          lat: parsedLat,
          lng: parsedLng,
        };
        routeMutation.mutate(destHit);
      }
    }
  }, [searchParams.dest, searchParams.lat, searchParams.lng, ready]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;

    linesRef.current.forEach((l) => map.removeLayer(l));
    markersRef.current.forEach((m) => map.removeLayer(m));
    if (stepMarkerRef.current) {
      map.removeLayer(stepMarkerRef.current);
      stepMarkerRef.current = null;
    }
    linesRef.current = [];
    markersRef.current = [];

    if (routes.length === 0) return;

    const bounds = L.latLngBounds([]);

    routes.forEach((r, i) => {
      if (!r.polyline) return;
      try {
        const pathCoords = JSON.parse(r.polyline) as [number, number][];
        if (!pathCoords || pathCoords.length === 0) return;

        // Color coding: Safer (Emerald/Teal), Alt (Cyan/Purple), Fastest (Coral)
        const lineColor = i === selected
          ? (r.kind === "safer" ? "#10b981" : r.kind === "alt" ? "#06b6d4" : "#f97316")
          : "#94a3b8";

        const line = L.polyline(pathCoords, {
          color: lineColor,
          opacity: i === selected ? 1 : 0.35,
          weight: i === selected ? 6 : 3.5,
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
      L.marker([origin.lat, origin.lng]).addTo(map).bindPopup("<b>Your Location</b>")
    );
    if (destination) {
      markersRef.current.push(
        L.marker([destination.lat, destination.lng]).addTo(map).bindPopup(`<b>${destination.name}</b>`)
      );
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [48, 48] });
    }
  }, [routes, selected, ready, origin, destination]);

  const handleStepClick = (step: RouteStep, idx: number) => {
    setActiveStepIndex(idx);
    if (!mapRef.current || !step.location) return;

    const [lat, lng] = step.location;
    mapRef.current.setView([lat, lng], 15, { animate: true });

    if (stepMarkerRef.current) {
      mapRef.current.removeLayer(stepMarkerRef.current);
    }

    const stepIcon = L.divIcon({
      className: "custom-step-marker",
      html: `<div style="background:#0f766e;color:white;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;">${idx + 1}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    stepMarkerRef.current = L.marker([lat, lng], { icon: stepIcon })
      .addTo(mapRef.current)
      .bindPopup(`<b>Step ${idx + 1}</b><br>${step.instruction}`)
      .openPopup();
  };

  const currentRoute = routes[selected];

  return (
    <AppShell title="Safe Route Workspace" subtitle="Turn-by-turn navigation & route safety analysis" back>
      {/* Night Travel Safety Advisory Banner */}
      <div className={`mb-4 flex items-center justify-between rounded-2xl border px-4 py-3 text-xs font-semibold backdrop-blur-xl ${
        isNightTime
          ? "border-amber/30 bg-amber/10 text-amber"
          : "border-primary/20 bg-primary/5 text-primary"
      }`}>
        <div className="flex items-center gap-2">
          {isNightTime ? <Moon className="size-4 shrink-0 animate-pulse" /> : <Sun className="size-4 shrink-0" />}
          <span>
            {isNightTime
              ? "Nighttime Mode Active · Routes prioritize well-lit coastal and village roads over unlit highway ghats."
              : "Daytime Routing · Safety scores incorporate speed limits, pedestrian densities, and road conditions."}
          </span>
        </div>
        <span className="rounded-full bg-card/80 px-2 py-0.5 text-[10px] font-bold">
          {isNightTime ? "Night Advisory" : "Live Routing"}
        </span>
      </div>

      {/* Destination Search Form */}
      <form
        className="flex gap-2.5 z-10 relative group"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim().length < 2) return;
          searchMutation.mutate(query.trim());
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            value={query}
            maxLength={120}
            placeholder="Search beach, fort, shack, or town in Goa…"
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-full border-border/60 bg-card/80 backdrop-blur-xl text-base shadow-sm focus-visible:ring-primary focus-visible:border-primary transition-all"
          />
        </div>
        <Button
          type="submit"
          disabled={searchMutation.isPending}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 active:scale-95 shrink-0"
        >
          {searchMutation.isPending ? <Loader2 className="size-5 animate-spin" /> : <Navigation className="size-5" />}
        </Button>
      </form>

      {/* Quick Destination Chips */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground font-semibold mr-1">Popular:</span>
        {QUICK_DESTINATIONS.map((qd) => (
          <button
            key={qd.id}
            type="button"
            onClick={() => {
              setQuery(qd.name);
              routeMutation.mutate(qd);
            }}
            className="rounded-full bg-secondary/80 border border-border/50 px-3 py-1 text-xs font-semibold text-secondary-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary/40 transition-all"
          >
            {qd.name}
          </button>
        ))}
      </div>

      {/* Search Hits Autocomplete */}
      {hits.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-3xl border border-border/60 bg-card/95 backdrop-blur-2xl relative z-20 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          {hits.map((h) => (
            <button
              key={h.id}
              onClick={() => routeMutation.mutate(h)}
              className="block w-full border-b border-border/40 px-6 py-4 text-left last:border-0 hover:bg-primary/5 transition-colors focus:bg-primary/5 focus:outline-none"
            >
              <span className="block text-base font-bold text-foreground">{h.name}</span>
              <span className="block mt-0.5 text-xs text-muted-foreground">{h.address}</span>
            </button>
          ))}
        </div>
      )}

      {/* Interactive Map Container */}
      <div
        ref={mapEl}
        className="mt-6 h-80 sm:h-[420px] w-full overflow-hidden rounded-3xl border border-border/60 bg-secondary/40 shadow-inner z-0 relative transition-all"
      />

      {routeMutation.isPending && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-3xl border border-primary/20 bg-primary/5 p-6 animate-pulse">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="text-sm font-bold text-primary">Calculating safest vs. fastest routes via OSRM…</span>
        </div>
      )}

      {/* ROUTE COMPARISON CARDS */}
      {routes.length > 0 && currentRoute && (
        <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
          {/* Comparative Route Tabs */}
          <div className="grid gap-3 sm:grid-cols-3">
            {routes.map((r, i) => {
              const isSelected = i === selected;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelected(i);
                    setActiveStepIndex(null);
                  }}
                  className={`group relative overflow-hidden rounded-3xl border p-5 text-left transition-all duration-300 hover:shadow-xl ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-2 ring-primary/30"
                      : "border-border/60 bg-card/75 backdrop-blur-xl hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`flex items-center gap-1.5 text-sm font-bold font-display ${
                        isSelected ? "text-primary" : "text-foreground group-hover:text-primary transition-colors"
                      }`}
                    >
                      {r.kind === "safer" ? (
                        <ShieldCheck className="size-4 text-emerald" />
                      ) : r.kind === "alt" ? (
                        <Compass className="size-4 text-cyan" />
                      ) : (
                        <Zap className="size-4 text-coral" />
                      )}
                      {r.label}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {r.safetyScore}/100
                    </span>
                  </div>

                  <p className="mt-2 text-base font-extrabold text-foreground">
                    {r.durationMin} min · <span className="text-muted-foreground font-normal text-sm">{r.distanceKm} km</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">via {r.summary}</p>
                </button>
              );
            })}
          </div>

          {/* Active Route Intelligence Card */}
          <div className="rounded-3xl border border-border/60 bg-card/80 backdrop-blur-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
              <div>
                <span className="rounded-full bg-primary/10 text-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Active Trajectory
                </span>
                <h3 className="text-xl font-bold font-display text-foreground mt-1 flex items-center gap-2">
                  <Milestone className="size-5 text-primary" />
                  {currentRoute.summary}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Total Distance: <strong>{currentRoute.distanceKm} km</strong> · Travel Time: <strong>{currentRoute.durationMin} mins</strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {currentRoute.googleMapsUrl && (
                  <a
                    href={currentRoute.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-coral via-orange-500 to-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md shadow-coral/20 transition-all hover:scale-105 active:scale-95"
                  >
                    <ExternalLink className="size-4" /> Start GPS Navigation
                  </a>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDirections(!showDirections)}
                  className="rounded-full font-bold text-xs gap-1.5"
                >
                  <ListOrdered className="size-3.5" />
                  {showDirections ? "Hide Directions" : "Turn-by-Turn"}
                </Button>
              </div>
            </div>

            {/* Safety Score Reasoning */}
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Safety Analysis & Warnings</p>
              <ul className="mt-2 space-y-1.5">
                {currentRoute.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-foreground/90 leading-relaxed">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Step-by-Step Turn Directions Drawer */}
            {showDirections && currentRoute.steps && currentRoute.steps.length > 0 && (
              <div className="mt-6 border-t border-border/40 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <ListOrdered className="size-4" /> Turn-by-Turn Maneuvers ({currentRoute.steps.length} steps)
                  </h4>
                  <span className="text-[11px] text-muted-foreground">Tap any step to focus on map</span>
                </div>

                <div className="max-h-80 overflow-y-auto pr-1 space-y-2 rounded-2xl border border-border/40 bg-secondary/30 p-2">
                  {currentRoute.steps.map((step, sIdx) => {
                    const isActive = activeStepIndex === sIdx;
                    return (
                      <div
                        key={sIdx}
                        onClick={() => handleStepClick(step, sIdx)}
                        className={`flex items-start gap-3 rounded-2xl p-3 cursor-pointer transition-all ${
                          isActive
                            ? "bg-primary/15 border border-primary/40 shadow-sm"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-card border border-border/60 shadow-xs mt-0.5">
                          {getManeuverIcon(step.maneuverType, step.maneuverModifier)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs sm:text-sm font-bold leading-tight ${isActive ? "text-primary" : "text-foreground"}`}>
                            {step.instruction}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatDistance(step.distanceMeters)}
                            {step.durationSeconds > 0 && ` · ~${Math.ceil(step.durationSeconds / 60)} min`}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground/70 px-1.5 py-0.5 rounded bg-card border border-border/40">
                          #{sIdx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
