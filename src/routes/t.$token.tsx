import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/t/$token")({
  head: () => ({
    meta: [
      { title: "Found someone? — Safety tag" },
      {
        name: "description",
        content: "This person is part of an active travel safety group. Notify their family without seeing any private details.",
      },
      { property: "og:title", content: "Safety tag — Found someone?" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TagPage,
});

// NOTE: this is the PUBLIC page a stranger lands on after scanning a
// SafeTag QR or entering its code manually. It intentionally shows NO
// personal data — no name, no address, no guardian phone number — only
// a confirmation that the tag is active and a way to notify the family.
// Full details are only ever visible to the guardian on their own
// authenticated dashboard.

const categoryLabel = (c: string) =>
  c === "senior" ? "an elderly traveller" : c === "kid" ? "a child" : "a traveller";

function TagPage() {
  const { token } = Route.useParams();
  const [note, setNote] = useState("");
  const [contact, setContact] = useState("");
  const [sent, setSent] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-tag-check", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("check_safety_tag", { _token: token });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? null) as { tag_id: string; category: string; is_active: boolean } | null;
    },
  });

  const notify = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("notify_safety_tag", {
        _token: token,
        _finder_note: note.trim() || null,
        _finder_contact: contact.trim() || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => setSent(true),
  });

  return (
    <main className="flex min-h-screen items-start justify-center bg-gradient-to-br from-amber-50/40 via-orange-50/20 to-teal-50/30 relative overflow-hidden px-4 py-10">
      {/* Subtle Ambient Background Elements */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-orange-400/10 blur-[80px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 h-[600px] w-[600px] rounded-full bg-teal-400/10 blur-[100px] pointer-events-none z-0" />
      
      <div className="relative z-10 w-full max-w-md">
        {isLoading && <div className="h-56 animate-pulse rounded-2xl bg-secondary" />}

        {(isError || (!isLoading && !data)) && (
          <div className="rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl p-8 text-center shadow-lg">
            <ShieldAlert className="mx-auto size-10 text-muted-foreground" />
            <h1 className="mt-4 text-xl font-bold tracking-tight">This tag isn't active</h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              If someone needs help right now, dial 112 for emergency services in India.
            </p>
            <a
              href="tel:112"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-destructive px-4 py-3 font-semibold text-destructive-foreground shadow-sm hover:opacity-90 transition-opacity"
            >
              Call 112
            </a>
          </div>
        )}

        {data && !sent && (
          <div className="space-y-4">
            <div className="rounded-3xl border-l-4 border-l-primary/60 border border-border/50 bg-card/60 backdrop-blur-xl p-6 shadow-lg">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                <p className="font-semibold">Active safety tag</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                You've found {categoryLabel(data.category)} who is part of an active travel
                safety group. Their family's contact details are kept private — tap below to
                notify them directly.
              </p>
            </div>

            <div className="rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 shadow-lg">
              <label className="text-sm font-semibold">Where are you / any details? (optional)</label>
              <Textarea
                className="mt-2 bg-background/50 border-border/50 shadow-inner rounded-xl"
                placeholder="e.g. Near the Baga Beach lifeguard tower"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
              />
              <label className="mt-4 block text-sm font-semibold">Your phone number (optional)</label>
              <input
                type="tel"
                className="mt-2 w-full rounded-xl border border-border/50 bg-background/50 shadow-inner px-4 py-2.5 text-sm"
                placeholder="So the family can call you back"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                maxLength={20}
              />
              <Button
                className="mt-6 w-full rounded-full h-12 text-base font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-95 bg-gradient-to-r from-orange-500 to-rose-500 border-0 text-white"
                disabled={notify.isPending}
                onClick={() => notify.mutate()}
              >
                {notify.isPending ? "Notifying…" : "Notify Family"}
              </Button>
            </div>

            <a
              href="tel:112"
              className="flex items-center justify-center gap-2 rounded-full border border-destructive/50 bg-destructive/5 px-4 py-3 font-semibold text-destructive hover:bg-destructive/10 transition-colors"
            >
              Emergency services — 112
            </a>
          </div>
        )}

        {sent && (
          <div className="rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl p-8 text-center shadow-lg">
            <CheckCircle2 className="mx-auto size-12 text-green-500" />
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Family notified</h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Thank you — their family has been alerted. If this is urgent, please stay nearby
              and dial 112 for immediate help.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
