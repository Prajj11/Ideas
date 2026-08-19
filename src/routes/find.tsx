import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/find")({
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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50/40 via-orange-50/20 to-teal-50/30 px-5 py-10 relative overflow-hidden">
      {/* Subtle Ambient Background Elements */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-orange-400/10 blur-[80px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 h-[600px] w-[600px] rounded-full bg-teal-400/10 blur-[100px] pointer-events-none z-0" />
      
      <div className="relative z-10 w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2">
          &larr; Back home
        </Link>
        <div className="mt-2 rounded-3xl border border-border/50 bg-card/60 p-8 shadow-xl backdrop-blur-xl text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Search className="text-primary w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Found someone?</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Enter the OTP code written on their safety wristband to securely notify their family.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. A9B2F4"
              className="text-center text-2xl tracking-widest font-mono uppercase h-14 bg-background/50 border-border/50 shadow-inner rounded-xl"
              maxLength={12}
              required
            />
            <Button type="submit" className="w-full rounded-full h-12 text-base font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-95 bg-gradient-to-r from-orange-500 to-rose-500 border-0 text-white">
              Find & Notify
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
