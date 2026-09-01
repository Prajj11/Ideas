import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Phone, ShieldAlert, ShieldCheck, Siren, HeartPulse, Waves, Compass, ArrowUpRight } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/emergency")({
  component: Emergency,
});

const categoryOrder = ["Emergency", "Police", "Medical", "Coastal", "Travel", "Support"];

function getCategoryIcon(cat: string) {
  switch (cat.toLowerCase()) {
    case "emergency":
      return <Siren className="size-4 text-destructive" />;
    case "medical":
      return <HeartPulse className="size-4 text-coral" />;
    case "coastal":
      return <Waves className="size-4 text-cyan" />;
    case "police":
      return <ShieldCheck className="size-4 text-primary" />;
    default:
      return <Phone className="size-4 text-muted-foreground" />;
  }
}

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
    <AppShell title="Goa Emergency 112 Hub" subtitle="Official state helplines & instant direct dial" back>
      {/* Prime 112 Notice Card */}
      <div className="rounded-3xl border border-destructive/30 bg-card/85 backdrop-blur-2xl p-6 sm:p-7 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <ShieldAlert className="size-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display text-foreground">
              Dial 112 For Immediate Emergency
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              112 is India's single national emergency hotline — direct dispatch to Goa Police, Fire, and 108 Ambulances.
            </p>
          </div>
        </div>

        <a
          href="tel:112"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-destructive py-3.5 text-sm font-bold text-destructive-foreground shadow-md transition-transform hover:scale-[1.01] active:scale-95"
        >
          <Phone className="size-4" /> Call 112 National Emergency
        </a>
      </div>

      {isLoading && (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-3xl shimmer-skeleton border border-border/50" />
          ))}
        </div>
      )}

      {/* Categorized Contact Cards */}
      {categories.map((cat) => (
        <section key={cat} className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2.5">
            {getCategoryIcon(cat)}
            {cat} Directory
          </h3>

          <div className="space-y-2.5">
            {(grouped[cat] ?? []).map((c) => (
              <a
                key={c.id}
                href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card/75 backdrop-blur-xl p-4 shadow-sm transition-all hover:border-primary/40 hover:bg-card/95 hover:shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/80 text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Phone className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-sm font-bold text-foreground truncate">{c.name}</span>
                    {c.note && (
                      <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.note}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-full bg-primary/10 text-primary px-3 py-1 font-mono font-bold text-xs">
                    {c.phone}
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </a>
            ))}
          </div>
        </section>
      ))}
    </AppShell>
  );
}
