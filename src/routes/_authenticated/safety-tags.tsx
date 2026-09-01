import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import QRCode from "qrcode";
import {
  Info,
  Loader2,
  Plus,
  Printer,
  QrCode,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/safety-tags")({
  component: SafetyTags,
});

type TagRow = {
  id: string;
  token: string;
  person_name: string;
  person_age: number | null;
  category: string;
  guardian_name: string;
  guardian_phone: string;
  alt_phone: string | null;
  staying_at: string | null;
  medical_notes: string | null;
  description: string | null;
  created_at: string;
};

function TagCard({ tag, onDelete }: { tag: TagRow; onDelete: (id: string) => void }) {
  const [qr, setQr] = useState<string>("");
  const url = typeof window === "undefined" ? "" : `${window.location.origin}/t/${tag.token}`;

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 480, margin: 1 }).then(setQr).catch(() => setQr(""));
  }, [url]);

  return (
    <div className="tag-card group relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 backdrop-blur-2xl p-6 shadow-sm transition-all hover:shadow-xl hover:border-emerald/40">
      <div className="flex flex-col sm:flex-row items-start gap-5">
        {/* QR Code & Token Box */}
        <div className="flex flex-col items-center gap-2.5 shrink-0 mx-auto sm:mx-0">
          {qr ? (
            <div className="p-2 rounded-2xl bg-white shadow-md border border-border/40">
              <img
                src={qr}
                alt={`QR code for ${tag.person_name}`}
                className="size-28 rounded-lg object-contain"
              />
            </div>
          ) : (
            <div className="size-32 rounded-2xl shimmer-skeleton border border-border/50" />
          )}

          <div className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-1 text-center font-mono font-bold text-sm tracking-widest text-primary w-full">
            OTP: {tag.token}
          </div>
        </div>

        {/* Member Details */}
        <div className="min-w-0 flex-1 w-full">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-emerald/10 text-emerald border border-emerald/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
              {tag.category === "kid" ? "Child Tag" : tag.category === "senior" ? "Elderly Tag" : "Member Tag"}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              Created {new Date(tag.created_at).toLocaleDateString()}
            </span>
          </div>

          <h3 className="mt-2 text-xl font-bold font-display text-foreground">{tag.person_name}</h3>
          {tag.person_age != null && (
            <p className="text-xs font-semibold text-muted-foreground">Age: {tag.person_age} years</p>
          )}

          <div className="mt-3 space-y-1 text-xs text-foreground/90">
            <p className="font-medium">
              <span className="text-muted-foreground">Guardian:</span> {tag.guardian_name} ({tag.guardian_phone})
            </p>
            {tag.alt_phone && (
              <p>
                <span className="text-muted-foreground">Alt Contact:</span> {tag.alt_phone}
              </p>
            )}
            {tag.staying_at && (
              <p>
                <span className="text-muted-foreground">Staying At:</span> {tag.staying_at}
              </p>
            )}
            {tag.medical_notes && (
              <p className="text-coral font-medium">
                <span className="text-muted-foreground">Medical Alert:</span> {tag.medical_notes}
              </p>
            )}
          </div>

          {/* Wristband Instructions */}
          <div className="mt-4 rounded-2xl bg-amber/10 border border-amber/20 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
            <p className="font-bold mb-0.5">Printed Wristband Message:</p>
            "If lost, scan QR or visit <strong>safr.in/find</strong> & enter OTP: <strong>{tag.token}</strong>"
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="no-print mt-5 pt-4 border-t border-border/40 flex items-center justify-between gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.print()}
          className="rounded-full font-bold text-xs gap-1.5 shadow-sm hover:border-primary/40"
        >
          <Printer className="size-3.5" /> Print Wristband
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full font-bold text-xs text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(tag.id)}
        >
          <Trash2 className="size-3.5 mr-1" /> Remove
        </Button>
      </div>
    </div>
  );
}

function SafetyTags() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    person_name: "",
    person_age: "",
    category: "kid",
    guardian_name: "",
    guardian_phone: "",
    alt_phone: "",
    staying_at: "",
    medical_notes: "",
    description: "",
  });

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["safety-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("safety_tags")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TagRow[];
    },
  });

  const createTag = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");

      // Generate a random 6-character alphanumeric OTP token
      const token = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data, error } = await supabase.from("safety_tags").insert({
        user_id: userData.user.id,
        token,
        person_name: form.person_name.trim(),
        person_age: form.person_age ? parseInt(form.person_age, 10) : null,
        category: form.category,
        guardian_name: form.guardian_name.trim(),
        guardian_phone: form.guardian_phone.trim(),
        alt_phone: form.alt_phone.trim() || null,
        staying_at: form.staying_at.trim() || null,
        medical_notes: form.medical_notes.trim() || null,
        description: form.description.trim() || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("SafeTag wristband created successfully!");
      setShowForm(false);
      setForm({
        person_name: "",
        person_age: "",
        category: "kid",
        guardian_name: "",
        guardian_phone: "",
        alt_phone: "",
        staying_at: "",
        medical_notes: "",
        description: "",
      });
      queryClient.invalidateQueries({ queryKey: ["safety-tags"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create tag"),
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("safety_tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.info("SafeTag removed");
      queryClient.invalidateQueries({ queryKey: ["safety-tags"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete tag"),
  });

  return (
    <AppShell title="Family SafeTag Studio" subtitle="Printable QR wristbands with Zero-Knowledge privacy" back>
      {/* Privacy Guarantee Header Card */}
      <div className="rounded-3xl border border-border/60 bg-card/75 backdrop-blur-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-3 py-0.5 text-xs font-bold text-emerald">
              <ShieldCheck className="size-3.5" /> Zero-Knowledge Privacy Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground mt-2">
              Protect Kids & Senior Travelers
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
              Generate water-resistant QR wristbands or short 6-digit OTP tags. If a member gets separated in crowded markets or beaches, finders can notify you instantly without ever seeing your private phone number or hotel address.
            </p>
          </div>

          <Button
            onClick={() => setShowForm(true)}
            className="rounded-full font-bold px-6 bg-primary text-primary-foreground shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <Plus className="size-4 mr-1.5" /> Create New Tag
          </Button>
        </div>
      </div>

      {/* Creation Modal / Drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <h3 className="text-xl font-bold font-display text-foreground">New Family SafeTag</h3>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                createTag.mutate();
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="person_name" className="text-xs font-bold uppercase text-muted-foreground">
                    Member Name *
                  </Label>
                  <Input
                    id="person_name"
                    required
                    value={form.person_name}
                    onChange={(e) => setForm({ ...form, person_name: e.target.value })}
                    placeholder="e.g. Aarav"
                    className="rounded-xl bg-secondary/40 border-border/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="person_age" className="text-xs font-bold uppercase text-muted-foreground">
                    Age (Optional)
                  </Label>
                  <Input
                    id="person_age"
                    type="number"
                    min={1}
                    max={120}
                    value={form.person_age}
                    onChange={(e) => setForm({ ...form, person_age: e.target.value })}
                    placeholder="e.g. 7"
                    className="rounded-xl bg-secondary/40 border-border/60"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Category</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "kid", label: "Child" },
                    { id: "senior", label: "Elderly" },
                    { id: "adult", label: "Adult" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat.id })}
                      className={`rounded-xl py-2 text-xs font-bold transition-all ${
                        form.category === cat.id
                          ? "bg-primary text-primary-foreground shadow-xs scale-102"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="guardian_name" className="text-xs font-bold uppercase text-muted-foreground">
                    Guardian Name *
                  </Label>
                  <Input
                    id="guardian_name"
                    required
                    value={form.guardian_name}
                    onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
                    placeholder="e.g. Priya Sharma"
                    className="rounded-xl bg-secondary/40 border-border/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guardian_phone" className="text-xs font-bold uppercase text-muted-foreground">
                    Phone Number *
                  </Label>
                  <Input
                    id="guardian_phone"
                    type="tel"
                    required
                    value={form.guardian_phone}
                    onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="rounded-xl bg-secondary/40 border-border/60 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="staying_at" className="text-xs font-bold uppercase text-muted-foreground">
                  Goa Hotel / Resort (Kept Private)
                </Label>
                <Input
                  id="staying_at"
                  value={form.staying_at}
                  onChange={(e) => setForm({ ...form, staying_at: e.target.value })}
                  placeholder="e.g. Taj Holiday Village, Candolim"
                  className="rounded-xl bg-secondary/40 border-border/60"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="medical_notes" className="text-xs font-bold uppercase text-muted-foreground">
                  Medical Notes / Allergies (Optional)
                </Label>
                <Input
                  id="medical_notes"
                  value={form.medical_notes}
                  onChange={(e) => setForm({ ...form, medical_notes: e.target.value })}
                  placeholder="e.g. Asthmatic, Peanut allergy"
                  className="rounded-xl bg-secondary/40 border-border/60"
                />
              </div>

              <Button
                type="submit"
                disabled={createTag.isPending}
                className="w-full h-12 rounded-full font-bold bg-primary text-primary-foreground shadow-md transition-all mt-4"
              >
                {createTag.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <QrCode className="size-4 mr-2" />}
                Generate Printable SafeTag
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Active Tags List */}
      <div className="mt-8 space-y-4">
        {isLoading ? (
          <div className="h-44 rounded-3xl shimmer-skeleton border border-border/50" />
        ) : tags.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 p-10 text-center bg-card/40">
            <QrCode className="size-12 mx-auto text-muted-foreground/40 mb-3" />
            <h4 className="text-base font-bold text-foreground">No SafeTags generated yet</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Create printable QR wristbands for your children or elders before heading to busy Goa beaches.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="mt-5 rounded-full font-bold text-xs px-6"
            >
              Create first SafeTag
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {tags.map((tag) => (
              <TagCard key={tag.id} tag={tag} onDelete={(id) => deleteTag.mutate(id)} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
