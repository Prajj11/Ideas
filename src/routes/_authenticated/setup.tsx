import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GOA_PLACES } from "@/lib/goa-schemas";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/setup")({
  component: Setup,
});

type Person = { name: string; age: string; category: "adult" | "kid" | "senior" };

function Setup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [style, setStyle] = useState<"solo" | "group">("solo");
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("Panjim");
  const [startDate, setStartDate] = useState("");
  const [days, setDays] = useState(3);
  const [people, setPeople] = useState<Person[]>([{ name: "", age: "", category: "adult" }]);

  const { data: existing } = useQuery({
    queryKey: ["trip"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*, travellers(*)")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!existing) return;
    setStyle(existing.travel_style === "group" ? "group" : "solo");
    setName(existing.traveller_name);
    setDestination(existing.destination);
    setStartDate(existing.start_date ?? "");
    setDays(existing.days);
    const t = (existing.travellers ?? []) as Array<{ name: string; age: number | null; category: string }>;
    if (t.length > 0) {
      setPeople(t.map((p) => ({ name: p.name, age: p.age ? String(p.age) : "", category: p.category as Person["category"] })));
    }
  }, [existing]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not signed in");

      const payload = {
        user_id: userId,
        travel_style: style,
        traveller_name: name.trim(),
        destination,
        start_date: startDate || null,
        days,
      };

      let tripId = existing?.id as string | undefined;
      if (tripId) {
        const { error } = await supabase.from("trips").update(payload).eq("id", tripId);
        if (error) throw error;
        await supabase.from("travellers").delete().eq("trip_id", tripId);
      } else {
        const { data, error } = await supabase.from("trips").insert(payload).select("id").single();
        if (error) throw error;
        tripId = data.id;
      }

      if (style === "group") {
        const rows = people
          .filter((p) => p.name.trim())
          .map((p) => ({
            trip_id: tripId!,
            user_id: userId,
            name: p.name.trim(),
            age: p.age ? Number(p.age) : null,
            category: p.category,
          }));
        if (rows.length > 0) {
          const { error } = await supabase.from("travellers").insert(rows);
          if (error) throw error;
        }
      }
      return tripId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip"] });
      toast.success("Trip saved");
      navigate({ to: "/dashboard" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save trip"),
  });

  return (
    <AppShell title="Trip setup" subtitle="Step " back>
      {step === 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">How are you travelling?</h2>
          {(
            [
              { value: "solo", icon: User, title: "Solo", text: "Just me exploring" },
              { value: "group", icon: Users, title: "In a group", text: "Family or friends travelling together" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setStyle(opt.value);
                setStep(1);
              }}
              className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${
                style === opt.value ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary"
              }`}
            >
              <opt.icon className="size-6 text-primary" />
              <span>
                <span className="block font-semibold">{opt.title}</span>
                <span className="block text-sm text-muted-foreground">{opt.text}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) {
              toast.error("Please add your name");
              return;
            }
            if (style === "group") setStep(2);
            else save.mutate();
          }}
        >
          <h2 className="text-xl font-semibold">Your trip details</h2>
          <div className="space-y-1.5">
            <Label htmlFor="tname">Your name</Label>
            <Input id="tname" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dest">Which city are you based in?</Label>
            <select
              id="dest"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
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
              <Label htmlFor="start">Arriving on</Label>
              <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="days">Number of days</Label>
              <Input
                id="days"
                type="number"
                min={1}
                max={60}
                value={days}
                onChange={(e) => setDays(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button type="submit" className="flex-1" disabled={save.isPending}>
              {style === "group" ? "Next: who's travelling" : save.isPending ? "Saving…" : "Save trip"}
            </Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Who's travelling?</h2>
          <p className="text-sm text-muted-foreground">
            Add each person. We use kids and seniors to tailor safety tips and QR tags.
          </p>
          <div className="space-y-3">
            {people.map((p, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4">
                <div className="grid grid-cols-[1fr_5rem] gap-2">
                  <Input
                    placeholder="Name"
                    value={p.name}
                    maxLength={60}
                    onChange={(e) =>
                      setPeople(people.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                    }
                  />
                  <Input
                    placeholder="Age"
                    type="number"
                    min={0}
                    max={120}
                    value={p.age}
                    onChange={(e) => setPeople(people.map((x, j) => (j === i ? { ...x, age: e.target.value } : x)))}
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  {(["adult", "kid", "senior"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPeople(people.map((x, j) => (j === i ? { ...x, category: c } : x)))}
                      className={`rounded-full px-3 py-1 text-xs capitalize ${
                        p.category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                  {people.length > 1 && (
                    <button
                      type="button"
                      aria-label="Remove traveller"
                      className="ml-auto text-muted-foreground hover:text-destructive"
                      onClick={() => setPeople(people.filter((_, j) => j !== i))}
                    >
                      <Minus className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPeople([...people, { name: "", age: "", category: "adult" }])}
          >
            <Plus className="size-4" /> Add person
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save trip"}
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
