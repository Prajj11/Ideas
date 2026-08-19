import { z } from "zod";

export const crowdBand = z.enum(["quiet", "moderate", "busy", "packed"]);

export const alternativeSchema = z.object({
  name: z.string(),
  why: z.string(),
  travel_time: z.string(),
});

export const recommendationSchema = z.object({
  name: z.string(),
  description: z.string(),
  tip: z.string(),
});

export const placeInsightsSchema = z.object({
  place: z.string(),
  summary: z.string(),
  eat: z.array(recommendationSchema).min(3).max(6),
  activities: z.array(recommendationSchema).min(3).max(6),
  sights: z.array(recommendationSchema).min(3).max(6),
  crowd: z.object({
    percent: z.number().min(0).max(100),
    band: crowdBand,
    reason: z.string(),
    best_time_today: z.string(),
    alternatives: z.array(alternativeSchema).min(2).max(4),
  }),
  rules: z.object({
    allowed: z.array(z.string()).min(3).max(8),
    not_allowed: z.array(z.string()).min(3).max(8),
  }),
  warnings: z
    .array(
      z.object({
        title: z.string(),
        detail: z.string(),
        severity: z.enum(["low", "medium", "high"]),
      }),
    )
    .min(2)
    .max(6),
});

export type PlaceInsights = z.infer<typeof placeInsightsSchema>;

export const itinerarySchema = z.object({
  title: z.string(),
  overview: z.string(),
  stops: z
    .array(
      z.object({
        time: z.string(),
        title: z.string(),
        type: z.enum(["food", "sight", "activity", "beach", "rest", "travel"]),
        duration: z.string(),
        description: z.string(),
        travel_note: z.string(),
      }),
    )
    .min(3)
    .max(12),
  tips: z.array(z.string()).min(2).max(6),
});

export type Itinerary = z.infer<typeof itinerarySchema>;

export const routeOptionSchema = z.object({
  label: z.string(),
  kind: z.enum(["fastest", "safer"]),
  distance_km: z.number(),
  duration_min: z.number(),
  safety_score: z.number(),
  reasons: z.array(z.string()),
  polyline: z.string(),
  summary: z.string(),
});

export type RouteOption = z.infer<typeof routeOptionSchema>;

export const GOA_PLACES = [
  "Panjim",
  "Baga Beach",
  "Calangute Beach",
  "Anjuna Beach",
  "Vagator Beach",
  "Candolim Beach",
  "Palolem Beach",
  "Agonda Beach",
  "Colva Beach",
  "Old Goa",
  "Dudhsagar Falls",
  "Fort Aguada",
  "Chapora Fort",
  "Margao",
  "Arambol Beach",
  "Morjim Beach",
] as const;
