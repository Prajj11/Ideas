import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GOA_PLACES, type Itinerary } from "@/lib/goa-schemas";
import { generateItinerary } from "@/lib/goa.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/itinerary")({
  component: ItineraryPage,
});

const INTERESTS = [
  "History & heritage",
  "Local food",
  "Beaches",
  "Nightlife",
  "Nature & wildlife",
  "Markets & shopping",
  "Churches & temples",
  "Water sports",
];

const typeEmoji: Record<string, string> = {
  food: "🍤",
  sight: "🏛️",
  activity: "🎯",
  beach: "🏖️",
  rest: "😌",
  travel: "🛵",
};

function ItineraryPage() {
  const [place, setPlace] = useState<string>("Panjim");
  const [hours, setHours] = useState(6);
  const [startTime, setStartTime] = useState("09:00");
  const [pace, setPace] = useState<"relaxed" | "balanced" | "packed">("balanced");
  const [interests, setInterests] = useState<string[]>(["Local food", "History & heritage"]);
  const [notes, setNotes] = useState("");

  const generate = useServerFn(generateItinerary);

  const plan = useMutation({
    mutationFn: async () => {
      const result = (await generate({
        data: { place, hours, interests, pace, startTime, notes: notes.trim() || undefined },
      })) as Itinerary;
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from("itineraries").insert({
          user_id: userData.user.id,
          place,
          hours,
          pace,
          interests,
          plan: result as unknown as never,
        });
      }
      return result;
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not build a plan"),
  });

  return (
    <AppShell title="AI itinerary" subtitle="Make the most of the hours you have" back>
      <form
        className="space-y-4 rounded-2xl border border-border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (interests.length === 0) {
            toast.error("Pick at least one interest");
            return;
          }
          plan.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="place">Where are you?</Label>
          <select
            id="place"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {GOA_PLACES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="start">Start time</Label>
            <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hours">Hours free</Label>
            <Input
              id="hours"
              type="number"
              min={1}
              max={24}
              value={hours}
              onChange={(e) => setHours(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Pace</Label>
          <div className="flex gap-2">
            {(["relaxed", "balanced", "packed"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPace(p)}
                className={`rounded-full px-3 py-1.5 text-sm capitalize ${
                  pace === p ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>What do you enjoy?</Label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() =>
                  setInterests(interests.includes(i) ? interests.filter((x) => x !== i) : [...interests, i])
                }
                className={`rounded-full px-3 py-1.5 text-sm ${
                  interests.includes(i) ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Anything else? (optional)</Label>
          <Textarea
            id="notes"
            maxLength={400}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Travelling with a toddler, no seafood, prefer scooter…"
          />
        </div>

        <Button type="submit" className="w-full" disabled={plan.isPending}>
          {plan.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {plan.isPending ? "Building your plan…" : "Generate itinerary"}
        </Button>
      </form>

      {plan.data && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-xl font-semibold">{plan.data.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{plan.data.overview}</p>

          <ol className="mt-5 space-y-4 border-l border-border pl-5">
            {plan.data.stops.map((stop, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {i + 1}
                </span>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {stop.time} · {stop.duration}
                </p>
                <p className="font-semibold">
                  {typeEmoji[stop.type] ?? "📍"} {stop.title}
                </p>
                <p className="text-sm text-muted-foreground">{stop.description}</p>
                <p className="mt-0.5 text-sm text-primary">{stop.travel_note}</p>
              </li>
            ))}
          </ol>

          <div className="mt-5 rounded-xl bg-secondary/60 p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Good to know</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {plan.data.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </AppShell>
  );
}
