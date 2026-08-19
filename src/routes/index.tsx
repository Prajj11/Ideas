import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Palmtree, Sun, Waves, Shell, Umbrella } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

import { GoogleTranslate } from "@/components/GoogleTranslate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Safr — AI Travel Safety Companion" },
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

function Landing() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/50 to-teal-50 selection:bg-orange-500/20 relative">
      <div className="absolute top-6 right-6 z-50">
        <GoogleTranslate />
      </div>

      <div className="relative overflow-hidden border-b border-border/40 min-h-[85vh] flex items-center justify-center z-10">
        {/* Massive Glowing Sun in the Background */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-orange-400 via-rose-400 to-transparent opacity-20 blur-[100px] animate-pulse" />
        {/* Ocean vibe at the bottom */}
        <div className="absolute bottom-0 left-0 -ml-32 h-[400px] w-[800px] rounded-full bg-gradient-to-tr from-teal-400 to-transparent opacity-20 blur-[100px]" />
        
        {/* Animated Goan Vibe Background Elements */}
        <div className="absolute top-20 left-[10%] text-orange-400/20 animate-float hover:text-orange-500/80 transition-all duration-300 hover:scale-125 cursor-pointer z-0" title="Sunny Goa!">
          <Sun className="w-24 h-24 animate-sway" />
        </div>
        <div className="absolute bottom-10 left-[5%] text-emerald-600/20 animate-float-slow hover:text-emerald-600/80 transition-all duration-300 hover:scale-125 hover:rotate-12 cursor-pointer z-0" title="Relax under the palm trees">
          <Palmtree className="w-32 h-32" />
        </div>
        <div className="absolute bottom-24 right-[8%] text-emerald-600/10 animate-float hover:text-emerald-600/60 transition-all duration-300 hover:scale-125 hover:-rotate-12 cursor-pointer z-0">
          <Palmtree className="w-24 h-24" />
        </div>
        <div className="absolute top-40 right-[15%] text-blue-500/20 animate-float-slow hover:text-blue-500/80 transition-all duration-300 hover:scale-125 cursor-pointer z-0" title="Hit the waves">
          <Waves className="w-20 h-20" />
        </div>
        <div className="absolute bottom-20 right-[25%] text-rose-400/20 animate-float hover:text-rose-400/80 transition-all duration-300 hover:scale-125 hover:-rotate-12 cursor-pointer z-0" title="Find seashells by the seashore">
          <Shell className="w-16 h-16" />
        </div>
        <div className="absolute top-32 left-[25%] text-sky-400/20 animate-float-slow hover:text-sky-400/80 transition-all duration-300 hover:scale-125 hover:rotate-12 cursor-pointer z-0" title="Shade yourself">
          <Umbrella className="w-16 h-16" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-5 pt-24 pb-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-white/50 px-5 py-2 text-sm font-bold text-orange-700 shadow-xl backdrop-blur-md transition-transform hover:scale-105">
            <Compass className="size-4 animate-pulse" /> Piloted in Goa
          </span>
          <h1 className="mt-8 text-6xl font-black tracking-tighter text-slate-800 sm:text-8xl drop-shadow-sm">
            Travel safer. <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-teal-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-pulse">Skip the trouble.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Safer routes, honest crowd estimates, local do's and don'ts, printable QR safety tags for your family, and
            an AI plan for every free hour you have — built for travel across India, currently piloted in Goa.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center flex-wrap">
            <Button asChild size="lg" className="w-full sm:w-auto h-14 px-10 rounded-full text-lg font-bold bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-xl shadow-orange-500/30 transition-all hover:scale-105 active:scale-95 hover:shadow-2xl hover:shadow-orange-500/40 border-0">
              <Link to={signedIn ? "/dashboard" : "/auth"}>{signedIn ? "Open my trip" : "Start planning"}</Link>
            </Button>
            {!signedIn && (
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-10 rounded-full text-lg font-bold bg-white/50 border border-orange-500/20 text-orange-700 backdrop-blur-md transition-all hover:bg-white/90 hover:text-orange-900 hover:scale-105 active:scale-95 shadow-lg">
                <Link to="/auth" search={{ mode: "signup" }}>Create an account</Link>
              </Button>
            )}
            <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto h-14 px-8 rounded-full text-lg font-bold text-teal-800 bg-teal-50/50 hover:bg-teal-100/80 backdrop-blur-md transition-all hover:scale-105 active:scale-95 border border-teal-500/30 shadow-sm">
              <Link to="/find">Found someone? Enter OTP</Link>
            </Button>
          </div>
        </div>
      </div>


    </main>
  );
}
