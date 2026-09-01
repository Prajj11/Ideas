import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Calendar,
  Clock,
  Download,
  Loader2,
  MapPin,
  Navigation,
  Printer,
  Share2,
  Sparkles,
  Zap,
} from "lucide-react";
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
  "Beaches & sunsets",
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

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0] || "";
}

function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0] || "";
}

function getWeekendDate(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSaturday);
  return d.toISOString().split("T")[0] || "";
}

function ItineraryPage() {
  const [place, setPlace] = useState<string>("Panjim");
  const [date, setDate] = useState<string>(getTodayDate());
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
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not build itinerary"),
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell title="AI Itinerary Planner" subtitle="Custom hour-by-hour schedules tailored for Goa" back>
      {/* Configuration Form Card */}
      <form
        className="space-y-5 rounded-3xl border border-border/60 bg-card/75 backdrop-blur-2xl p-6 sm:p-8 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          if (interests.length === 0) {
            toast.error("Please select at least one travel interest");
            return;
          }
          plan.mutate();
        }}
      >
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Time-Budget Planner</span>
            <h3 className="text-xl font-bold font-display text-foreground">Configure Your Goan Day</h3>
          </div>
          <Sparkles className="size-6 text-primary" />
        </div>

        {/* Location Dropdown */}
        <div className="space-y-1.5">
          <Label htmlFor="place" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <MapPin className="size-3.5 text-primary" /> Destination Base
          </Label>
          <select
            id="place"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            className="h-12 w-full rounded-2xl border border-border/60 bg-secondary/40 px-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {GOA_PLACES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Date of Visit & Quick Date Pills */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="date" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" /> Date of Exploration
            </Label>
            <div className="flex gap-1.5">
              {[
                { label: "Today", fn: getTodayDate },
                { label: "Tomorrow", fn: getTomorrowDate },
                { label: "Weekend", fn: getWeekendDate },
              ].map((pill) => {
                const isSelected = date === pill.fn();
                return (
                  <button
                    key={pill.label}
                    type="button"
                    onClick={() => setDate(pill.fn())}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>
          <Input
            id="date"
            type="date"
            value={date}
            min={getTodayDate()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-11 rounded-2xl bg-secondary/40 border-border/60"
          />
        </div>

        {/* Start Time and Available Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="start" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3.5 text-primary" /> Start Time
            </Label>
            <Input
              id="start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-11 rounded-2xl bg-secondary/40 border-border/60 font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hours" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="size-3.5 text-amber" /> Free Hours ({hours}h)
            </Label>
            <Input
              id="hours"
              type="number"
              min={1}
              max={24}
              value={hours}
              onChange={(e) => setHours(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
              className="h-11 rounded-2xl bg-secondary/40 border-border/60 font-bold"
            />
          </div>
        </div>

        {/* Pacing Speed Controls */}
        <div className="space-y-2">
          <Label className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Exploration Pace</Label>
          <div className="grid grid-cols-3 gap-2.5">
            {(["relaxed", "balanced", "packed"] as const).map((p) => {
              const isSelected = pace === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPace(p)}
                  className={`rounded-2xl py-2.5 text-xs font-bold capitalize transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                      : "bg-secondary/70 text-secondary-foreground hover:bg-secondary"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interest Tags Selector */}
        <div className="space-y-2">
          <Label className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">What do you enjoy?</Label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => {
              const isSelected = interests.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    setInterests(
                      isSelected ? interests.filter((x) => x !== i) : [...interests, i]
                    )
                  }
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs scale-105"
                      : "bg-secondary/70 text-secondary-foreground hover:bg-secondary"
                  }`}
                >
                  {i}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Notes / Constraints */}
        <div className="space-y-1.5">
          <Label htmlFor="notes" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
            Special Requests & Notes (optional)
          </Label>
          <Textarea
            id="notes"
            maxLength={400}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Travelling with a toddler, vegetarian only, prefer scooter-accessible spots…"
            className="rounded-2xl bg-secondary/40 border-border/60 text-xs sm:text-sm resize-none"
            rows={2}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={plan.isPending}
          className="w-full h-12 rounded-full font-bold bg-primary text-primary-foreground shadow-md transition-all hover:scale-[1.01] active:scale-95"
        >
          {plan.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" /> Building your Goan Itinerary…
            </>
          ) : (
            <>
              <Sparkles className="size-4 mr-2" /> Generate AI Itinerary
            </>
          )}
        </Button>
      </form>

      {/* RESULTING ITINERARY TIMELINE */}
      {plan.data && (
        <section className="mt-8 rounded-3xl border border-border/60 bg-card/80 backdrop-blur-2xl p-6 sm:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
            <div>
              <span className="rounded-full bg-primary/10 text-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Personalized Schedule
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground mt-1">
                {plan.data.title}
              </h2>
              {plan.data.date && (
                <p className="text-xs font-semibold text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-primary" />
                  {new Date(plan.data.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>

            {/* Export / Print Button */}
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="rounded-full font-bold text-xs gap-1.5 shadow-sm hover:border-primary/40"
            >
              <Printer className="size-3.5" /> Print / Save PDF
            </Button>
          </div>

          <p className="mt-4 text-sm text-foreground/90 leading-relaxed">{plan.data.overview}</p>

          {/* Sequential Timeline Stops */}
          <ol className="mt-6 space-y-6 border-l-2 border-primary/30 pl-6 ml-2">
            {plan.data.stops.map((stop, i) => (
              <li key={i} className="relative group">
                {/* Numbered Step Bubble */}
                <span className="absolute -left-[33px] top-0.5 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm group-hover:scale-110 transition-transform">
                  {i + 1}
                </span>

                <div className="rounded-2xl border border-border/50 bg-secondary/30 p-4 transition-all hover:border-primary/40 hover:bg-secondary/50">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-bold font-mono">
                        🕒 {stop.time}
                      </span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold capitalize text-muted-foreground">
                        {stop.duration}
                      </span>
                    </div>

                    {/* Direct Turn-by-Turn Navigation Action */}
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs font-bold text-primary hover:bg-primary/10 rounded-full px-3"
                    >
                      <Link to="/map" search={{ dest: stop.title }}>
                        <Navigation className="size-3 mr-1" /> Navigate
                      </Link>
                    </Button>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-foreground flex items-center gap-2">
                    <span>{typeEmoji[stop.type] ?? "📍"}</span>
                    <span>{stop.title}</span>
                  </h3>

                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {stop.description}
                  </p>

                  <p className="mt-2 text-xs font-semibold text-primary bg-primary/5 px-2.5 py-1 rounded-lg w-fit flex items-center gap-1.5">
                    <span>🛵</span>
                    <span>{stop.travel_note}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* Travel Tips & Good to Know */}
          {plan.data.tips.length > 0 && (
            <div className="mt-8 rounded-2xl bg-primary/5 border border-primary/20 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span>💡</span> Travel Insights & Pro-Tips
              </p>
              <ul className="mt-2.5 space-y-1.5 text-xs sm:text-sm text-foreground/90 leading-relaxed">
                {plan.data.tips.map((t, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </AppShell>
  );
}
