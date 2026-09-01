import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ShieldCheck, Compass, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/find")({
  head: () => ({
    meta: [
      { title: "Found Someone? — Safr SafeTag Finder" },
      { name: "description", content: "Enter the OTP code on a safety wristband to notify the family securely." },
    ],
  }),
  component: FindPage,
});

function FindPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length > 0) {
      navigate({ to: "/t/$token", params: { token: code.trim().toUpperCase() } });
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12 relative overflow-hidden text-foreground selection:bg-primary/20">
      {/* Ambient Lighting Blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-coral/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-cyan/15 blur-[130px]" />

      <div className="relative z-10 w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-4 rounded-full bg-secondary/80 px-3 py-1 border border-border/40"
        >
          <ArrowLeft className="size-3.5" /> Back to Safr Home
        </Link>

        <div className="rounded-3xl border border-border/60 bg-card/85 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl text-center">
          <div className="mx-auto size-14 rounded-2xl bg-gradient-to-br from-primary via-cyan to-coral flex items-center justify-center mb-5 shadow-md">
            <ShieldCheck className="size-7 text-primary-foreground" />
          </div>

          <span className="rounded-full bg-primary/10 text-primary px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
            Zero-Knowledge SafeTag
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-foreground mt-2">
            Found Someone?
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-2 mb-6">
            Enter the 6-character OTP code printed on their safety wristband or card to securely notify their family without seeing any private contact info.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. A9B2F4"
              className="text-center text-3xl font-black tracking-widest font-mono uppercase h-16 bg-secondary/40 border-border/60 shadow-inner rounded-2xl focus-visible:ring-primary focus-visible:border-primary"
              maxLength={12}
              required
              autoFocus
            />

            <Button
              type="submit"
              className="w-full rounded-full h-14 text-base font-bold bg-gradient-to-r from-coral via-orange-500 to-primary text-primary-foreground shadow-lg shadow-coral/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Verify Tag & Notify Family
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border/40 text-xs text-muted-foreground">
            Immediate emergency in Goa? Dial <a href="tel:112" className="font-bold text-destructive underline">112 Police</a> or <a href="tel:108" className="font-bold text-destructive underline">108 Ambulance</a>.
          </div>
        </div>
      </div>
    </main>
  );
}
