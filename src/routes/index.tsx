import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Compass,
  Palmtree,
  Sun,
  Waves,
  Shell,
  Umbrella,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  QrCode,
  LocateFixed,
  Phone,
  ArrowRight,
  Heart,
  ChevronRight,
  ShieldAlert,
  Calendar,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { GoogleTranslate } from "@/components/GoogleTranslate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Safr — AI Travel Safety Companion | Goa" },
      {
        name: "description",
        content:
          "Plan safer trips across India: safe-route maps, live crowd estimates, local rules and warnings, QR safety tags for kids and elders, and AI itineraries. Currently piloted in Goa.",
      },
      { property: "og:title", content: "Safr — AI Travel Safety Companion" },
      {
        property: "og:description",
        content: "Safe routes, crowd estimates, local rules, QR safety tags and AI itineraries — piloted in Goa, built for India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const VALUE_PROPS = [
  "🟢 Live Drishti Marine Beach Swell Flags",
  "🧭 Safe-Scored vs. Fastest OSRM Wayfinding",
  "🛡️ Zero-Knowledge QR Wristbands for Kids & Elders",
  "✨ AI Itineraries Built for Free Hours in Goa",
];

function Landing() {
  const [signedIn, setSignedIn] = useState(false);
  const [activePropIndex, setActivePropIndex] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));

    const interval = setInterval(() => {
      setActivePropIndex((prev) => (prev + 1) % VALUE_PROPS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-background selection:bg-primary/20 relative overflow-hidden text-foreground">
      {/* Ambient Gradient Mesh Lighting */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-coral/15 via-amber/10 to-transparent blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[700px] w-[700px] rounded-full bg-gradient-to-bl from-cyan/15 via-primary/10 to-transparent blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-emerald/10 via-teal-500/10 to-transparent blur-[130px]" />

      {/* Floating Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-card/60 backdrop-blur-2xl transition-all">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-cyan to-coral shadow-md transition-transform group-hover:scale-105">
              <Compass className="size-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight font-display bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text">
                Safr
              </span>
              <span className="ml-1.5 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                Goa
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <GoogleTranslate />
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full border-border/60 bg-card/70 backdrop-blur-md text-xs font-bold hover:bg-card hover:border-primary/40 transition-all"
            >
              <Link to="/find">
                <ShieldCheck className="size-3.5 mr-1 text-primary" /> Enter OTP
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-md hover:scale-105 transition-all active:scale-95"
            >
              <Link to={signedIn ? "/dashboard" : "/auth"}>
                {signedIn ? "Open Dashboard" : "Sign In"}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 px-6 sm:pt-24 sm:pb-28">
        {/* Floating Animated Coast Icons */}
        <div className="absolute top-16 left-[8%] text-amber/20 animate-float hidden lg:block" title="Sunny Goa!">
          <Sun className="size-20 animate-sway" />
        </div>
        <div className="absolute top-36 right-[10%] text-cyan/20 animate-float-slow hidden lg:block" title="Ocean Swells">
          <Waves className="size-20" />
        </div>
        <div className="absolute bottom-16 left-[12%] text-emerald/20 animate-float-slow hidden lg:block" title="Palm Shadows">
          <Palmtree className="size-24" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          {/* Animated Value Proposition Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card/80 px-5 py-2 shadow-sm backdrop-blur-xl transition-all duration-300">
            <span className="flex size-2 rounded-full bg-emerald animate-ping" />
            <span className="text-xs font-bold text-foreground transition-all duration-500">
              {VALUE_PROPS[activePropIndex]}
            </span>
          </div>

          <h1 className="mt-8 text-5xl font-black tracking-tight font-display text-foreground sm:text-7xl lg:text-8xl leading-[1.08]">
            Travel safer. <br />
            <span className="bg-gradient-to-r from-coral via-amber to-cyan bg-clip-text text-transparent">
              Skip the trouble.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            The intelligent travel safety companion engineered for Goa. Compare safest vs. fastest routes with turn-by-turn navigation, monitor marine beach flags, explore live crowd levels, protect family with zero-knowledge QR wristbands, and generate custom AI itineraries.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-14 px-9 rounded-full text-base font-bold bg-gradient-to-r from-coral via-orange-500 to-primary text-primary-foreground shadow-xl shadow-coral/20 transition-all hover:scale-105 active:scale-95 border-0"
            >
              <Link to={signedIn ? "/dashboard" : "/auth"}>
                {signedIn ? "Open My Trip Dashboard" : "Start Planning for Free"}
                <ArrowRight className="size-5 ml-2" />
              </Link>
            </Button>
            {!signedIn && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-14 px-8 rounded-full text-base font-bold border-border/70 bg-card/60 backdrop-blur-xl hover:bg-card hover:border-primary/40 shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                <Link to="/auth" search={{ mode: "signup" }}>
                  Create Account
                </Link>
              </Button>
            )}
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="w-full sm:w-auto h-14 px-7 rounded-full text-base font-bold text-primary bg-primary/5 hover:bg-primary/15 border border-primary/20 backdrop-blur-xl transition-all hover:scale-105 active:scale-95"
            >
              <Link to="/find">
                <ShieldCheck className="size-5 mr-2 text-primary" /> Found someone? Enter OTP
              </Link>
            </Button>
          </div>

          {/* Trust Stat Badges */}
          <div className="mt-14 pt-10 border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="glass-pill rounded-2xl p-4">
              <p className="text-2xl font-black font-display text-primary">100%</p>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">Zero-Knowledge Privacy</p>
            </div>
            <div className="glass-pill rounded-2xl p-4">
              <p className="text-2xl font-black font-display text-coral">112 Hub</p>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">Goa Police & Ambulance</p>
            </div>
            <div className="glass-pill rounded-2xl p-4">
              <p className="text-2xl font-black font-display text-cyan">Live Flags</p>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">Drishti Marine Station</p>
            </div>
            <div className="glass-pill rounded-2xl p-4">
              <p className="text-2xl font-black font-display text-emerald">12+ Langs</p>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">Indian Languages Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE PREVIEW BENTO GRID */}
      <section className="relative py-16 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="rounded-full bg-primary/10 text-primary px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
            Intelligent Safety Suite
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-foreground mt-3">
            Designed for carefree Goan adventures
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mt-2 max-w-xl mx-auto">
            Everything you need for peace of mind while exploring coastal roads, bustling markets, and serene beaches.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Safe vs Fast Navigation */}
          <div className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/70 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 hover:border-primary/40 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
            <div>
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Compass className="size-6" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                OSRM Routing Engine
              </span>
              <h3 className="text-lg font-bold font-display text-foreground mt-1">
                Safe vs. Fast Wayfinding
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                Evaluates road lighting, ghat hairpin bends, speed hazards, and populates turn-by-turn navigation with 1-tap Google Maps GPS launch.
              </p>
            </div>
            <Link
              to="/map"
              className="mt-5 inline-flex items-center text-xs font-bold text-primary group-hover:underline"
            >
              Test Route Engine <ChevronRight className="size-3.5 ml-0.5" />
            </Link>
          </div>

          {/* Card 2: Marine Swell & Weather */}
          <div className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/70 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 hover:border-cyan/40 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan/10 rounded-full blur-2xl group-hover:bg-cyan/20 transition-colors" />
            <div>
              <div className="size-12 rounded-2xl bg-cyan/10 text-cyan flex items-center justify-center mb-4">
                <Waves className="size-6" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan">
                7-Day Station
              </span>
              <h3 className="text-lg font-bold font-display text-foreground mt-1">
                Marine & Beach Swimming Flags
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                Real-time Drishti lifeguard swimming status (🟢 Safe, 🟡 Caution, 🔴 No Swimming), UV index forecast, and hourly rain probability radar.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="mt-5 inline-flex items-center text-xs font-bold text-cyan group-hover:underline"
            >
              View Live Station <ChevronRight className="size-3.5 ml-0.5" />
            </Link>
          </div>

          {/* Card 3: Family SafeTags */}
          <div className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/70 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 hover:border-coral/40 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-coral/10 rounded-full blur-2xl group-hover:bg-coral/20 transition-colors" />
            <div>
              <div className="size-12 rounded-2xl bg-coral/10 text-coral flex items-center justify-center mb-4">
                <QrCode className="size-6" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-coral">
                Zero-Knowledge Privacy
              </span>
              <h3 className="text-lg font-bold font-display text-foreground mt-1">
                Family QR Safety Wristbands
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                Printable QR tags & 6-character OTP codes for kids and seniors. Strangers can notify guardians without ever seeing phone numbers or private details.
              </p>
            </div>
            <Link
              to="/safety-tags"
              className="mt-5 inline-flex items-center text-xs font-bold text-coral group-hover:underline"
            >
              Generate SafeTag <ChevronRight className="size-3.5 ml-0.5" />
            </Link>
          </div>

          {/* Card 4: AI Itinerary Generator */}
          <div className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/70 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 hover:border-amber/40 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber/10 rounded-full blur-2xl group-hover:bg-amber/20 transition-colors" />
            <div>
              <div className="size-12 rounded-2xl bg-amber/10 text-amber flex items-center justify-center mb-4">
                <Sparkles className="size-6" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber">
                Smart Time-Budgeting
              </span>
              <h3 className="text-lg font-bold font-display text-foreground mt-1">
                AI Hour-by-Hour Schedules
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                Have 4 or 8 free hours? Instantly build a personalized Goan itinerary matching your pace, interests, and transit notes with 1-click stop navigation.
              </p>
            </div>
            <Link
              to="/itinerary"
              className="mt-5 inline-flex items-center text-xs font-bold text-amber group-hover:underline"
            >
              Build Itinerary <ChevronRight className="size-3.5 ml-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-20 border-t border-border/40 bg-card/30 py-10 px-6 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">Safr (Goa Guide Buddy)</span>
            <span>·</span>
            <span>Piloted in Goa, built for India.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/emergency" className="hover:text-foreground transition-colors">
              Emergency Directory
            </Link>
            <Link to="/find" className="hover:text-foreground transition-colors">
              SafeTag OTP Finder
            </Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">
              Account Sign In
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
