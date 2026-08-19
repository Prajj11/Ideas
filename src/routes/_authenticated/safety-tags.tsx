import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import QRCode from "qrcode";
import { Info, Loader2, Plus, Printer, Trash2 } from "lucide-react";
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
};

function TagCard({ tag, onDelete }: { tag: TagRow; onDelete: (id: string) => void }) {
  const [qr, setQr] = useState<string>("");
  const url = typeof window === "undefined" ? "" : `${window.location.origin}/t/${tag.token}`;

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 480, margin: 1 }).then(setQr).catch(() => setQr(""));
  }, [url]);

  return (
    <div className="tag-card rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl p-5 shadow-sm">
      <div className="flex items-start gap-5">
        <div className="flex flex-col items-center gap-2">
          {qr ? (
            <img src={qr} alt={`QR code for ${tag.person_name}`} className="size-28 rounded-lg border border-border/50 shadow-sm" />
          ) : (
            <div className="size-28 animate-pulse rounded-lg bg-secondary" />
          )}
          <div className="bg-primary/10 text-primary font-mono font-bold px-3 py-1 rounded-md tracking-widest text-lg w-full text-center border border-primary/20 shadow-sm">
            {tag.token}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs tracking-wider text-muted-foreground uppercase font-semibold">{tag.category}</p>
          <p className="truncate text-xl font-bold tracking-tight">{tag.person_name}</p>
          {tag.person_age != null && <p className="text-sm text-muted-foreground font-medium">Age {tag.person_age}</p>}
          <p className="mt-1.5 text-sm font-medium">
            Contact: {tag.guardian_name} <span className="text-muted-foreground mx-1">•</span> {tag.guardian_phone}
          </p>
          {tag.staying_at && <p className="text-sm text-muted-foreground">Staying at {tag.staying_at}</p>}
          
          <div className="mt-3 bg-orange-500/10 text-orange-700 dark:text-orange-400 p-2.5 rounded-lg border border-orange-500/20 text-xs font-medium leading-relaxed">
            <span className="block mb-0.5 opacity-80">Write on wristband:</span>
            "If found, visit <strong>website.com/find</strong> and enter OTP: <strong className="text-base tracking-widest">{tag.token}</strong>"
          </div>
        </div>
      </div>
      <div className="no-print mt-4 flex gap-2">
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" /> Print
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(tag.id)}>
          <Trash2 className="size-4" /> Delete
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

  const { data: tags, isLoading } = useQuery({
    queryKey: ["safety-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("safety_tags")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TagRow[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      
      const shortToken = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { error } = await supabase.from("safety_tags").insert({
        user_id: userData.user.id,
        token: shortToken,
        person_name: form.person_name.trim(),
        person_age: form.person_age ? Number(form.person_age) : null,
        category: form.category,
        guardian_name: form.guardian_name.trim(),
        guardian_phone: form.guardian_phone.trim(),
        alt_phone: form.alt_phone.trim() || null,
        staying_at: form.staying_at.trim() || null,
        medical_notes: form.medical_notes.trim() || null,
        description: form.description.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["safety-tags"] });
      setShowForm(false);
      setForm({ ...form, person_name: "", person_age: "", medical_notes: "", description: "" });
      toast.success("QR tag created");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create tag"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("safety_tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["safety-tags"] }),
  });

  return (
    <AppShell title="QR safety tags" subtitle="If they get lost, someone can reach you" back>
      <style>{`@media print { .no-print { display: none !important } body { background: #fff } }`}</style>

      <div className="no-print rounded-2xl border border-border bg-secondary/50 p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <Info className="size-4 text-primary" /> How this works
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Add each child or elderly traveller and your contact number.</li>
          <li>We create a private QR code — scanning it never shows your phone number, name, or where you're staying.</li>
          <li>Print the tag and pin it inside a pocket, on a wristband, or on a bag.</li>
          <li>Anyone who finds them can scan it to notify you directly — you stay in control of the contact.</li>
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">
          A stranger who scans the tag only sees a confirmation and a "Notify Family" button —
          never your phone number, address, or medical notes.
        </p>
      </div>

      {!showForm && (
        <Button className="no-print mt-4 w-full" onClick={() => setShowForm(true)}>
          <Plus className="size-4" /> Create a QR tag
        </Button>
      )}

      {showForm && (
        <form
          className="no-print mt-4 space-y-4 rounded-2xl border border-border bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.person_name.trim() || !form.guardian_name.trim() || !form.guardian_phone.trim()) {
              toast.error("Name and contact details are required");
              return;
            }
            create.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>Who is this tag for?</Label>
            <div className="flex gap-2">
              {(["kid", "senior", "other"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, category: c })}
                  className={`rounded-full px-3 py-1.5 text-sm capitalize ${
                    form.category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-[1fr_5rem] gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="pn">Their name</Label>
              <Input
                id="pn"
                maxLength={60}
                value={form.person_name}
                onChange={(e) => setForm({ ...form, person_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pa">Age</Label>
              <Input
                id="pa"
                type="number"
                min={0}
                max={120}
                value={form.person_age}
                onChange={(e) => setForm({ ...form, person_age: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gn">Your name</Label>
            <Input
              id="gn"
              maxLength={60}
              value={form.guardian_name}
              onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="gp">Your phone</Label>
              <Input
                id="gp"
                type="tel"
                maxLength={20}
                value={form.guardian_phone}
                onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap">Backup phone</Label>
              <Input
                id="ap"
                type="tel"
                maxLength={20}
                value={form.alt_phone}
                onChange={(e) => setForm({ ...form, alt_phone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sa">Where you're staying (optional)</Label>
            <Input
              id="sa"
              maxLength={120}
              value={form.staying_at}
              onChange={(e) => setForm({ ...form, staying_at: e.target.value })}
              placeholder="Hotel name, Calangute"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mn">Medical notes (optional)</Label>
            <Textarea
              id="mn"
              maxLength={300}
              value={form.medical_notes}
              onChange={(e) => setForm({ ...form, medical_notes: e.target.value })}
              placeholder="Asthma, allergic to peanuts…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="de">What they look like (optional)</Label>
            <Input
              id="de"
              maxLength={200}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Red t-shirt, blue cap"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Generate QR tag
            </Button>
          </div>
        </form>
      )}

      <div className="mt-5 space-y-3">
        {isLoading && <div className="h-32 animate-pulse rounded-2xl bg-secondary" />}
        {tags?.map((tag) => (
          <TagCard key={tag.id} tag={tag} onDelete={(id) => remove.mutate(id)} />
        ))}
        {tags?.length === 0 && !isLoading && (
          <p className="py-6 text-center text-sm text-muted-foreground">No tags yet.</p>
        )}
      </div>
    </AppShell>
  );
}
