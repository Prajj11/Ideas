import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Phone, ShieldAlert } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/emergency")({
  component: Emergency,
});

const categoryOrder = ["Emergency", "Police", "Medical", "Coastal", "Travel", "Support"];

function Emergency() {
  const { data, isLoading } = useQuery({
    queryKey: ["emergency-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const grouped = (data ?? []).reduce<Record<string, typeof data>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  const rank = (c: string) => {
    const i = categoryOrder.indexOf(c);
    return i === -1 ? categoryOrder.length : i;
  };
  const categories = Object.keys(grouped).sort((a, b) => rank(a) - rank(b));

  return (
    <AppShell title="Emergency contacts" subtitle="Goa helplines — tap to call" back>
      <div className="rounded-2xl border-l-4 border-destructive bg-card p-4 shadow-sm">
        <p className="flex items-center gap-2 font-semibold">
          <ShieldAlert className="size-4 text-destructive" /> In an emergency, dial 112 first
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          112 is India's single emergency number — it reaches police, fire and ambulance.
        </p>
      </div>

      {isLoading && <div className="mt-4 h-40 animate-pulse rounded-2xl bg-secondary" />}

      {categories.map((cat) => (
        <section key={cat} className="mt-5">
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{cat}</h2>
          <div className="mt-2 space-y-2">
            {(grouped[cat] ?? []).map((c) => (
              <a
                key={c.id}
                href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <Phone className="size-4 text-primary" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{c.name}</span>
                  {c.note && <span className="block text-sm text-muted-foreground">{c.note}</span>}
                </span>
                <span className="text-sm font-semibold text-primary">{c.phone}</span>
              </a>
            ))}
          </div>
        </section>
      ))}
    </AppShell>
  );
}
