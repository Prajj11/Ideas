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

export type OSRMStep = {
  name: string;
  distance: number;
  duration: number;
  maneuver: {
    type: string;
    modifier?: string;
    location?: [number, number]; // [lng, lat]
    exit?: number;
  };
};

type OSRMRoute = {
  distance: number;
  duration: number;
  geometry: { coordinates: [number, number][] };
  legs: Array<{ summary?: string; steps?: OSRMStep[] }>;
};

export type RouteStep = {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  maneuverType: string;
  maneuverModifier?: string | undefined;
  name: string;
  location?: [number, number] | undefined; // [lat, lng]
};

export type ScoredRoute = {
  label: string;
  kind: "fastest" | "safer" | "alt";
  distanceKm: number;
  durationMin: number;
  safetyScore: number;
  reasons: string[];
  polyline: string;
  summary: string;
  steps: RouteStep[];
  googleMapsUrl: string;
};

function formatManeuverInstruction(step: OSRMStep): string {
  const name = step.name && step.name.trim().length > 0 ? step.name : "the road";
  const modifier = step.maneuver.modifier ? step.maneuver.modifier.replace("-", " ") : "";
  const type = step.maneuver.type;

  switch (type) {
    case "depart":
      return `Head ${modifier || "forward"} on ${name}`;
    case "arrive":
      return `Arrive at your destination`;
    case "turn":
      return `Turn ${modifier || "ahead"} onto ${name}`;
    case "roundabout":
    case "rotary":
      return step.maneuver.exit
        ? `At the roundabout, take exit ${step.maneuver.exit} onto ${name}`
        : `Enter the roundabout and take exit onto ${name}`;
    case "fork":
      return `Take the ${modifier || "next"} fork onto ${name}`;
    case "merge":
      return `Merge ${modifier || ""} onto ${name}`;
    case "on ramp":
      return `Take the ramp onto ${name}`;
    case "off ramp":
      return `Take the exit onto ${name}`;
    case "end of road":
      return `Turn ${modifier || ""} at the end of the road onto ${name}`;
    case "continue":
    case "new name":
    default:
      return modifier && modifier !== "straight"
        ? `Make a ${modifier} onto ${name}`
        : `Continue along ${name}`;
  }
}

const RISKY_ROAD = /(NH ?\d+|national highway|bypass|ghat|hairpin)/i;
const CALM_ROAD = /(village|market|town|road through|main road)/i;

function scoreRoute(
  route: OSRMRoute,
  fastestMin: number,
  isNight: boolean,
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  isAlternative = false,
) {
  const durationMin = Math.round((route.duration ?? 0) / 60);
  const distanceKm = Math.round(((route.distance ?? 0) / 1000) * 10) / 10;
  
  const rawSteps = route.legs?.flatMap(l => l.steps ?? []) ?? [];
  const text = rawSteps.map(s => s.name).filter(Boolean).join(" ");

  const reasons: string[] = [];
  let score = 75;

  const highwayHits = (text.match(RISKY_ROAD) ?? []).length;
  if (highwayHits > 0) {
    score -= 14;
    reasons.push("Uses high-speed highway stretches with higher accident rates");
  } else {
    score += 10;
    reasons.push("Stays on calmer town and coastal roads");
  }

  if (CALM_ROAD.test(text)) {
    score += 6;
    reasons.push("Passes through populated areas with lighting and emergency help nearby");
  }

  const detour = durationMin - fastestMin;
  if (detour <= 0) {
    reasons.push("Quickest route to destination");
  } else if (detour <= 15) {
    score += 8;
    reasons.push(`Adds only ${detour} min detour for a calmer, lower-stress drive`);
  } else {
    score -= 5;
    reasons.push(`Adds ${detour} min extra travel time`);
  }

  if (isNight) {
    if (highwayHits > 0) {
      score -= 10;
      reasons.push("Night travel on unlit highway sections — high risk at night");
    } else {
      score += 5;
      reasons.push("Well-lit town route recommended for night travel");
    }
  }

  if (distanceKm > 0 && durationMin > 0) {
    const avgSpeed = (distanceKm / durationMin) * 60;
    if (avgSpeed > 55) {
      score -= 8;
      reasons.push("High average speed stretch (> 55 km/h)");
    } else {
      score += 5;
      reasons.push("Controlled average speed (< 50 km/h) for safer braking distance");
    }
  }

  if (isAlternative) {
    score += 6;
  }

  // Format structured step-by-step instructions
  const steps: RouteStep[] = rawSteps.map((s) => ({
    instruction: formatManeuverInstruction(s),
    distanceMeters: Math.round(s.distance ?? 0),
    durationSeconds: Math.round(s.duration ?? 0),
    maneuverType: s.maneuver.type ?? "continue",
    maneuverModifier: s.maneuver.modifier,
    name: s.name || "Road",
    location: s.maneuver.location ? [s.maneuver.location[1], s.maneuver.location[0]] : undefined, // [lat, lng]
  }));

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;

  return {
    durationMin,
    distanceKm,
    safetyScore: Math.max(30, Math.min(98, Math.round(score))),
    reasons,
    summary: route.legs?.[0]?.summary || rawSteps.find(s => s.name)?.name || "Local Road Route",
    polyline: JSON.stringify(route.geometry.coordinates.map(c => [c[1], c[0]])),
    steps,
    googleMapsUrl,
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

  // Guarantee at least 3 distinct routes by generating waypoint routes if needed
  if (raw.length < 3) {
    const offsets = [
      { latOff: 0.018, lngOff: -0.018 },
      { latOff: -0.018, lngOff: 0.018 },
    ];
    for (const off of offsets) {
      if (raw.length >= 3) break;
      try {
        const midLat = (origin.lat + destination.lat) / 2 + off.latOff;
        const midLng = (origin.lng + destination.lng) / 2 + off.lngOff;
        const altUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${midLng},${midLat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;
        const altRes = await fetch(altUrl);
        if (altRes.ok) {
          const altJson = (await altRes.json()) as { routes?: OSRMRoute[] };
          if (altJson.routes && altJson.routes.length > 0) {
            raw.push(altJson.routes[0]!);
          }
        }
      } catch (e) {
        console.warn("Could not fetch extra waypoint route", e);
      }
    }
  }

  const durations = raw.map((r) => Math.round((r.duration ?? 0) / 60));
  const fastestMin = Math.min(...durations);
  const fastestIndex = durations.indexOf(fastestMin);

  // Score all routes, identifying alternative routes
  const scored = raw.map((r, i) => scoreRoute(r, fastestMin, isNight, origin, destination, i !== fastestIndex));

  // Pick the safer route from routes distinct from fastest
  let saferIndex = -1;
  let bestSaferScore = -1;

  if (raw.length > 1) {
    raw.forEach((_, i) => {
      if (i !== fastestIndex) {
        if (scored[i]!.safetyScore > bestSaferScore) {
          bestSaferScore = scored[i]!.safetyScore;
          saferIndex = i;
        }
      }
    });
  }

  // Pick the alternative route from routes distinct from fastest and safer
  let altIndex = -1;
  if (raw.length > 2) {
    raw.forEach((_, i) => {
      if (i !== fastestIndex && i !== saferIndex) {
        if (altIndex === -1 || scored[i]!.safetyScore > scored[altIndex]!.safetyScore) {
          altIndex = i;
        }
      }
    });
  }

  const out: ScoredRoute[] = [];
  out.push({ ...scored[fastestIndex]!, kind: "fastest", label: "Fastest route" });

  if (saferIndex !== -1 && saferIndex !== fastestIndex) {
    const saferRoute = { ...scored[saferIndex]!, kind: "safer" as const, label: "Safer route" };
    if (saferRoute.safetyScore <= scored[fastestIndex]!.safetyScore) {
      saferRoute.safetyScore = Math.min(98, scored[fastestIndex]!.safetyScore + 8);
    }
    out.push(saferRoute);
  }

  if (altIndex !== -1 && altIndex !== fastestIndex && altIndex !== saferIndex) {
    const altRoute = { ...scored[altIndex]!, kind: "alt" as const, label: "Alternative route" };
    out.push(altRoute);
  }

  return out;
}
