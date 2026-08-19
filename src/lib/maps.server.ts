export type PlaceHit = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export async function searchGoaPlaces(query: string): Promise<PlaceHit[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query + " Goa")}&lat=15.35&lon=73.95&limit=6`;
  const response = await fetch(url);

  if (!response.ok) {
    console.error(`Places search failed [${response.status}]`);
    throw new Error("Place search failed. Please try again.");
  }

  const json = await response.json();

  return (json.features ?? []).map((f: any) => ({
    id: f.properties.osm_id?.toString() ?? Math.random().toString(),
    name: f.properties.name ?? "Unnamed place",
    address: [f.properties.street, f.properties.city, f.properties.state].filter(Boolean).join(", ") || "Goa, India",
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  }));
}

type OSRMRoute = {
  distance: number;
  duration: number;
  geometry: { coordinates: [number, number][] };
  legs: Array<{ summary?: string; steps?: Array<{ name: string; maneuver: { type: string } }> }>;
};

export type ScoredRoute = {
  label: string;
  kind: "fastest" | "safer";
  distanceKm: number;
  durationMin: number;
  safetyScore: number;
  reasons: string[];
  polyline: string;
  summary: string;
};

const RISKY_ROAD = /(NH ?\d+|national highway|bypass|ghat|hairpin)/i;
const CALM_ROAD = /(village|market|town|road through|main road)/i;

function scoreRoute(route: OSRMRoute, fastestMin: number, isNight: boolean) {
  const durationMin = Math.round((route.duration ?? 0) / 60);
  const distanceKm = Math.round(((route.distance ?? 0) / 1000) * 10) / 10;
  
  const steps = route.legs?.[0]?.steps ?? [];
  const text = steps.map(s => s.name).filter(Boolean).join(" ");

  const reasons: string[] = [];
  let score = 72;

  const highwayHits = (text.match(RISKY_ROAD) ?? []).length;
  if (highwayHits > 0) {
    score -= 12;
    reasons.push("Uses fast highway stretches where accidents are more common");
  } else {
    score += 8;
    reasons.push("Mostly stays on slower town and village roads");
  }

  if (CALM_ROAD.test(text)) {
    score += 5;
    reasons.push("Passes through populated areas with help nearby");
  }

  const detour = durationMin - fastestMin;
  if (detour <= 0) {
    reasons.push("Quickest option available");
  } else if (detour <= 10) {
    score += 6;
    reasons.push(`Only ${detour} min longer than the quickest route`);
  } else {
    score -= 4;
    reasons.push(`${detour} min longer than the quickest route`);
  }

  if (isNight) {
    score -= highwayHits > 0 ? 8 : 3;
    reasons.push(
      highwayHits > 0
        ? "Night travel on unlit highway sections - ride slowly and use full lights"
        : "Night travel - stick to lit roads and avoid isolated stretches",
    );
  }

  if (distanceKm > 0 && durationMin > 0) {
    const avgSpeed = (distanceKm / durationMin) * 60;
    if (avgSpeed > 55) {
      score -= 6;
      reasons.push("High average speed stretch");
    }
  }

  return {
    durationMin,
    distanceKm,
    safetyScore: Math.max(20, Math.min(98, Math.round(score))),
    reasons,
    summary: route.legs?.[0]?.summary || steps.find(s => s.name)?.name || "Route",
    polyline: JSON.stringify(route.geometry.coordinates.map(c => [c[1], c[0]])),
  };
}

export async function computeSafeRoutes(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  isNight: boolean,
): Promise<ScoredRoute[]> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&alternatives=true&steps=true`;
  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    console.error(`Routes failed [${response.status}]: ${body}`);
    throw new Error("Could not work out routes for that trip. Please try again.");
  }

  const json = (await response.json()) as { routes?: OSRMRoute[] };
  const raw = json.routes ?? [];
  if (raw.length === 0) return [];

  const durations = raw.map((r) => Math.round((r.duration ?? 0) / 60));
  const fastestMin = Math.min(...durations);

  const scored = raw.map((r) => scoreRoute(r, fastestMin, isNight));
  const fastestIndex = durations.indexOf(fastestMin);
  let saferIndex = 0;
  scored.forEach((s, i) => {
    if (s.safetyScore > scored[saferIndex]!.safetyScore) saferIndex = i;
  });

  const out: ScoredRoute[] = [];
  out.push({ ...scored[fastestIndex]!, kind: "fastest", label: "Fastest route" });
  
  if (saferIndex !== fastestIndex) {
    out.push({ ...scored[saferIndex]!, kind: "safer", label: "Safer route" });
  } else {
    // If the fastest route is also the safest (or only 1 route was found), duplicate it with a clear message
    out.push({ 
      ...scored[fastestIndex]!, 
      kind: "safer", 
      label: "Safer route",
      reasons: ["This route is currently both the fastest and safest option available.", ...scored[fastestIndex]!.reasons.filter(r => !r.includes("Quickest"))]
    });
  }

  scored.forEach((s, i) => {
    if (i !== fastestIndex && i !== saferIndex) {
      out.push({ ...s, kind: "fastest", label: "Alternative route" });
    }
  });

  return out;
}
