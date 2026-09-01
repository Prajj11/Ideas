import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ShieldAlert, ShieldCheck, Phone, ArrowLeft, Send, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/t/$token")({
  head: () => ({
    meta: [
      { title: "Found Someone? — Safety Tag Alert" },
      {
        name: "description",
        content: "This person is part of an active travel safety group. Notify their family without seeing any private details.",
      },
      { property: "og:title", content: "Safety Tag — Found Someone?" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TagPage,
});

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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 relative overflow-hidden text-foreground selection:bg-primary/20">
      {/* Ambient Lighting Blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-emerald/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-cyan/15 blur-[130px]" />

      <div className="relative z-10 w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-4 rounded-full bg-secondary/80 px-3 py-1 border border-border/40"
        >
          <ArrowLeft className="size-3.5" /> Back to Safr Home
        </Link>

        {isLoading && <div className="h-64 rounded-3xl shimmer-skeleton border border-border/60" />}

        {(isError || (!isLoading && !data)) && (
          <div className="rounded-3xl border border-border/60 bg-card/85 backdrop-blur-2xl p-8 sm:p-10 text-center shadow-2xl">
            <ShieldAlert className="mx-auto size-12 text-destructive" />
            <h1 className="mt-4 text-2xl font-bold font-display tracking-tight">Tag Not Found or Inactive</h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              This safety tag OTP code is not registered or has expired. If someone needs urgent assistance in Goa, dial emergency services immediately.
            </p>
            <div className="mt-6 space-y-2">
              <a
                href="tel:112"
                className="inline-flex w-full items-center justify-center rounded-full bg-destructive px-4 py-3.5 text-sm font-bold text-destructive-foreground shadow-md hover:opacity-90 transition-opacity"
              >
                <Phone className="size-4 mr-2" /> Call Goa Police (112)
              </a>
              <a
                href="tel:1098"
                className="inline-flex w-full items-center justify-center rounded-full bg-secondary px-4 py-3 text-xs font-bold text-foreground hover:bg-secondary/80 transition-colors"
              >
                Call National Childline (1098)
              </a>
            </div>
          </div>
        )}

        {data && !sent && (
          <div className="rounded-3xl border border-border/60 bg-card/85 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl">
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-2xl bg-emerald/10 text-emerald flex items-center justify-center shrink-0">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <span className="rounded-full bg-emerald/10 text-emerald px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                  Verified Active Tag
                </span>
                <h2 className="text-xl font-bold font-display text-foreground mt-0.5">
                  SafeTag Code: {token}
                </h2>
              </div>
            </div>

            <p className="mt-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              You've found <strong>{categoryLabel(data.category)}</strong> registered with an active travel group in Goa.
              Guardian contact details are kept strictly private to protect traveler security. Tap below to send them an instant location and status alert.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                notify.mutate();
              }}
              className="mt-6 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  Where are you right now? (Optional)
                </label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Near Tito's Lane entrance, Baga Beach. Sitting safely with lifeguards."
                  rows={3}
                  className="rounded-2xl bg-secondary/40 border-border/60 text-xs sm:text-sm resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  Your Phone / Contact Info (Optional)
                </label>
                <Input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. +91 98765 43210 (Shopkeeper/Finder)"
                  className="rounded-2xl bg-secondary/40 border-border/60 text-xs sm:text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={notify.isPending}
                className="w-full h-14 rounded-full font-bold text-base bg-gradient-to-r from-emerald to-teal-600 text-white shadow-lg shadow-emerald/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
              >
                {notify.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" /> Alerting Family…
                  </>
                ) : (
                  <>
                    <Send className="size-4 mr-2" /> Send Alert to Guardian
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        {sent && (
          <div className="rounded-3xl border border-emerald/30 bg-card/85 backdrop-blur-2xl p-8 sm:p-10 text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="mx-auto size-16 rounded-full bg-emerald/15 text-emerald flex items-center justify-center mb-4">
              <CheckCircle2 className="size-10" />
            </div>

            <h2 className="text-2xl font-bold font-display text-foreground">
              Guardian Alerted!
            </h2>

            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Thank you! An urgent notification with your message has been sent to the traveler's registered family dashboard.
              Please stay with them in a safe, well-lit area until help arrives.
            </p>

            <div className="mt-6 pt-5 border-t border-border/40 text-xs text-muted-foreground">
              If immediate medical or police assistance is needed, please call <a href="tel:112" className="font-bold text-destructive underline">112</a>.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
