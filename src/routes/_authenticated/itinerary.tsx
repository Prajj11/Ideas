import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, Loader2, Sparkles } from "lucide-react";
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

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function getWeekendDate() {
  const d = new Date();
  const day = d.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSaturday);
  return d.toISOString().split("T")[0];
}

function ItineraryPage() {
  const [place, setPlace] = useState<string>("Panjim");
  const [date, setDate] = useState<string>(getTodayDate);
  const [hours, setHours] = useState(6);
  const [startTime, setStartTime] = useState("09:00");
  const [pace, setPace] = useState<"relaxed" | "balanced" | "packed">("balanced");
  const [interests, setInterests] = useState<string[]>(["Local food", "History & heritage"]);
  const [notes, setNotes] = useState("");

  const generate = useServerFn(generateItinerary);

  const plan = useMutation({
    mutationFn: async () => {
      const result = (await generate({
        data: { place, date, hours, interests, pace, startTime, notes: notes.trim() || undefined },
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="date" className="flex items-center gap-1.5 font-medium">
              <Calendar className="size-4 text-primary" /> Date of visit
            </Label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setDate(getTodayDate())}
                className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
                  date === getTodayDate()
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDate(getTomorrowDate())}
                className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
                  date === getTomorrowDate()
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setDate(getWeekendDate())}
                className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
                  date === getWeekendDate()
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                Weekend
              </button>
            </div>
          </div>
          <Input
            id="date"
            type="date"
            value={date}
            min={getTodayDate()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full"
          />
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">{plan.data.title}</h2>
            {plan.data.date && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Calendar className="size-3.5" />
                {new Date(plan.data.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{plan.data.overview}</p>

          <ol className="mt-5 space-y-6 border-l border-border pl-6">
            {plan.data.stops.map((stop, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[31px] top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-sm">
                  {i + 1}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-0.5 text-xs font-semibold text-foreground">
                    🕒 {stop.time}
                  </span>
                  <span className="rounded-md bg-accent/20 px-2 py-0.5 text-[11px] font-medium text-accent-foreground capitalize">
                    {stop.duration}
                  </span>
                </div>
                <h3 className="mt-1.5 text-base font-bold text-foreground flex items-center gap-1.5">
                  <span>{typeEmoji[stop.type] ?? "📍"}</span>
                  <span>{stop.title}</span>
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{stop.description}</p>
                <p className="mt-1.5 text-xs font-medium text-primary flex items-center gap-1">
                  <span>🛵</span>
                  <span>{stop.travel_note}</span>
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-xl bg-secondary/60 p-4 border border-border/50">
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <span>💡</span> Good to know
            </p>
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
